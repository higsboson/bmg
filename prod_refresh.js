var express = require("express");
var fs = require('fs');
var app = express();
var bodyParser = require("body-parser");
var JSON = require("json3");
var mongoclient = require('mongodb').MongoClient;
var bmgDB;
var url = require("url");
var ejs = require("ejs");
var crypto = require('crypto');
var http = require("http");
var parseString = require("xml2js").parseString;
var ObjectId = require('mongodb').ObjectID;
var sha256 = require('sha256');
var request = require('request');
var bmgaux = require('./bmgaux/bmgaux.js');
var https = require('https');
var parse = require('xml-parser');

const amazon_end_point = "http://webservices.amazon.in";
const end_point = "webservices.amazon.in";
const uri = "/onca/xml";
var aws_access_key_id = "";
var aws_secret_key = "";
var associate_tag = "";


function WaterfallOver(list, iterator, callback) {
  var nextItemIndex = 0;
  function report() {
    nextItemIndex++;
    if (nextItemIndex === list.length)
      callback();
    else
      iterator(list[nextItemIndex],report);
  }
  function retry() {
    iterator(list[nextItemIndex],report);
  }
  if (list.length != 0)
    iterator(list[0], report);
  else
    callback();
}

function WaterfallOverRetry(list, iterator, callback) {
  var nextItemIndex = 0;
  function report() {
    nextItemIndex++;
    if (nextItemIndex === list.length)
      callback();
    else
      iterator(list[nextItemIndex],report,retry);
  }
  function retry() {
    iterator(list[nextItemIndex],report,retry);
  }
  if (list.length != 0)
    iterator(list[0], report, retry);
  else
    callback();
}


function processData(xml,batch) {
  //console.log(JSON.stringify(batch));
  parseString(xml,function(err,resJSON) {
    if (resJSON.ItemLookupResponse.Items[0].Request[0].IsValid == "True") {
      xitems = resJSON.ItemLookupResponse.Items[0].Item;
      WaterfallOver(xitems, function (x,subreport) {
        var name,desc,imageURL,price,asin;
        try {
          if (typeof x.ItemAttributes[0].ListPrice !== 'undefined') {
            if (typeof x.ItemAttributes[0].ListPrice[0] !== 'undefined' || x.ItemAttributes[0].ListPrice[0] === null) {
                price = parseInt(x.ItemAttributes[0].ListPrice[0].Amount)/100;
            } else {
              price = parseInt(x.OfferSummary[0].LowestNewPrice[0].Amount)/100;
            }
            name = x.ItemAttributes[0].Title[0];
            desc = x.DetailPageURL[0];
            if (typeof x.MediumImage[0] !== 'undefined' || x.MediumImage[0] === null) {
                image_url = x.MediumImage[0].URL[0];
            } else {
              image_url = '/images/no_image_available.png';
            }

            asin = x.ASIN;
            //console.log(desc + name + image_url + price + asin);
            var prdCollection = bmgDB.collection('Product');

            prdCollection.update({"_id" : new ObjectId(batch['BMG' + asin])},{$set :{"ProdNm":name,"ProdDsc":desc,"ImageURL":image_url,"MRP":price,"InStock":1,"UpdDate":new Date()}}, function(err) {
              if (err) {
                console.log("Error in updating product status")
              }
               else {
                 console.log('updated ' + batch['BMG' + asin]);
                 subreport();
               }
             });
           } else if (typeof x.OfferSummary[0].LowestNewPrice !== 'undefined') {
             price = parseInt(x.OfferSummary[0].LowestNewPrice[0].Amount)/100;
             name = x.ItemAttributes[0].Title[0];
             desc = x.DetailPageURL[0];
             if (typeof x.MediumImage[0] !== 'undefined' || x.MediumImage[0] === null) {
                 image_url = x.MediumImage[0].URL[0];
             } else {
               image_url = '/images/no_image_available.png';
             }

             asin = x.ASIN;
             //console.log(desc + name + image_url + price + asin);
             var prdCollection = bmgDB.collection('Product');

             prdCollection.update({"_id" : new ObjectId(batch['BMG' + asin])},{$set :{"ProdNm":name,"ProdDsc":desc,"ImageURL":image_url,"MRP":price,"InStock":1,"UpdDate":new Date()}}, function(err) {
               if (err) {
                 console.log("Error in updating product status")
               }
                else {
                  console.log('updated ' + batch['BMG' + asin]);
                  subreport();
                }
              });
            }
            else {
             console.log('Out of Stock');
             var asin = x.ASIN;
             var prdCollection = bmgDB.collection('Product');
             prdCollection.update({"_id" : new ObjectId(batch['BMG' + asin])},{$set :{"InStock":0}}, function(err) {
               if (err) {
                 console.log("Error in updating product status")
               }
                else {
                  console.log('updated ' + batch['BMG' + asin]);
                  subreport();
                }
              });
           }
         }
         catch (e) {
           console.log("error " + JSON.stringify(x));
         }

      }, function () {
        console.log('All updated');
      });
    } else {
      console.log('invalid xml')
    }
  })
}

mongoclient.connect("mongodb://worker:" + process.argv[2] + "@localhost:27017/bmgdb", function(err,db) {
  if (!err){
    console.log("We are connected");
    bmgDB = db;

    var configData = bmgDB.collection("Config");
    configData.find({}).toArray(function(err,doc) {
      if (doc.length == 0) {console.log("Config data is missing!!")}
      else {
        //higsboson - changed to correct identifiers - Access Key Id & Secret Key from Config collection
        aws_access_key_id = doc[0].aws_access_key_id;
        aws_secret_key = doc[0].aws_secret_key;
        associate_tag = doc[0].associate_tag;
        emailPassword = doc[0].mailconn;
        envmode = doc[0].envmode;

        if (envmode == "prod") {
          urlHost = "www.bemygenie.com";
        } else if (envmode == "dev") {
          urlHost = "dev.bemygenie.com";
        }

        // Init amazon call stuff

        var operation = "ItemLookup"
        var response_group = "Images,ItemAttributes,Offers";  //Stricly no spaces only commas.
        var service="AWSECommerceService";
        var sort="price";


        var prdCollection = bmgDB.collection('Product');

        prdCollection.find({},{_id:1,ProdID:1}).toArray(function(err,prods) {
          var i,j,asin_string="";

          var prodsList = {};
          var request_batch = 10;
          var requestArray = [];
          var batch = {};
          var requestCount = 0;
          for (i = 0,j = 0;i < prods.length ;i++,j++) {
            prodsList = {};
            prodsList["_id"] = prods[i]._id;
            prodsList["ProdID"] = prods[i].ProdID;
            batch[prods[i].ProdID] = prods[i]._id;
            if (j == 0)
              asin_string += prods[i].ProdID.substring(3,prods[i].ProdID.length);
            else
              asin_string += "," + prods[i].ProdID.substring(3,prods[i].ProdID.length);
            if (j == request_batch - 1) {
              j = -1;
              var packet = {};
              packet['batch'] = batch;
              console.log('batch is ' + JSON.stringify(batch))
              packet['asin'] = asin_string
              requestArray.push(packet);
              asin_string = "";
              batch = {};
            }
          }
          if (j < request_batch - 1) {
            var packet = {};
            packet['batch'] = batch;
            packet['asin'] = asin_string
            requestArray.push(packet);
          }
          console.log(JSON.stringify(requestArray));
          WaterfallOverRetry(requestArray, function(request,report,retry){
            //console.log('Request for ' + request.asin);
            var canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&" +
            "AssociateTag=" + associate_tag + "\&" + "IdType=ASIN" + "\&" + "ItemId=" + encodeURIComponent(request.asin) + "\&" + "Operation=" + operation + "\&" + "ResponseGroup=" + encodeURIComponent(response_group) +
            "\&" + "Service=" + service + "\&" +"Timestamp=" + encodeURIComponent(new Date().toISOString());

            var string_to_sign = "GET\n" + end_point + "\n" + uri + "\n" + canonical_query_string;

            ///////////// Signing the web service call string with our secret key using sha256////
            var hash = crypto.createHmac('sha256', aws_secret_key).update(string_to_sign).digest('base64');
            var signed_url = amazon_end_point + uri + "\?" + canonical_query_string + "\&Signature=" + encodeURIComponent(hash);
            //console.log(signed_url);
            ///////////////////////////////////////////////////////////////////////////////////////
            var rawData = '';

            http.get(signed_url, (response) => {
              const statusCode = response.statusCode;
              const contentType = response.headers['content-type'];

              let error;
              if (statusCode !== 200) {
                error = new Error(`Request Failed.\n` +
                                  `Status Code: ${statusCode}`);
                                  console.log("Error" + statusCode);
              } else if (!/^text\/xml/.test(contentType)) {
                error = new Error(`Invalid content-type.\n` +
                                  `Expected text/xml but received ${contentType}`);
                                  console.log("Error" + statusCode);
              }
              if (error) {
                console.log(error.message + 'full error ' + error + ' Retrying');
                setTimeout(function () {
                    console.log('Re-trying');
                    retry();
                }, 1000);
                // consume response data to free up memory
                response.resume();
                return;
              }

              response.setEncoding('utf8');

              response.on('data', (chunk) => rawData += chunk);
              response.on('end', () => {
                try {
                  //let parsedData = XML.parse(rawData);
                  //console.log("Raw data is :" +  rawData);
                  processData(rawData,request.batch);
                  setTimeout(function () {
                      console.log('Reporting');
                      report();
                  }, 1000);
                } catch (e) {
                  console.log(e.message);
                }
              });
            }).on('error', (e) => {
              console.log(`Got error: ${e.message}`);
            });

            //console.log(canonical_query_string);


          },function() {
            console.log('all done');
            db.close();
          })


        });
        //console.log('host is ' + urlHost)



      }
    });
  }
  else {
    console.log("Error in connection"+err);
  };

});

console.log('This is dog');
