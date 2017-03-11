var express = require("express");
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

var amazon_end_point = "http://webservices.amazon.in";
var end_point = "webservices.amazon.in";
var uri = "/onca/xml";
var aws_access_key_id = "";
var aws_secret_key = "";
var associate_tag = "";


var urlencodedParser = bodyParser.urlencoded({extended:true});
app.use(express.static("public")); //define static directory
app.use(bodyParser.json()); //to parse application-json
app.use(urlencodedParser); // for parsing application/x-www-form-urlencoded
app.set('view engine','ejs');

mongoclient.connect("mongodb://localhost:27017/bmgdb", function(err,db) {
  if (!err){
    console.log("We are connected");
    bmgDB = db;

    var configData = bmgDB.collection("Config");
    configData.find({}).toArray(function(err,doc) {
      if (doc.length == 0) {console.log("Config data is missing!!")}
      else {
        aws_access_key_id = doc[0].aws_access_key_id;
        aws_secret_key = doc[0].aws_secret_key;
        associate_tag = doc[0].associate_tag;
      }
    });
  }
  else {
    console.log("Error in connection"+err);
  };

});

app.get('/', function(req,res) {
  res.sendFile(__dirname + "/site/index.html");
  console.log("call made to index.html");
});

app.get('/getProdByCatg',function(req,res){
  try {
    var prdCollection = bmgDB.collection('Product');
    var qryStr = req.query.Catg;
    if (qryStr == "KKK") {
      prdCollection.find({}).toArray(function(err,docs){
        if (!err){
          if (docs.length == 0) {res.send()}
          else {res.format({'application/json': function(){res.send(docs)}})}
        }
        else {res.send("Error in fetching documents")}
      })}
    else {
      prdCollection.find({Catg:{$in:qryStr}}).toArray(function(err,docs){
        if (!err){
          if (docs.length == 0) {res.send()}
          else {res.format({'application/json': function(){res.send(docs)}})}
        }
        else {res.send("Error in fetching documents")}
      })}
  }
  catch (e) {console.log("getProdByCatg -->"+e.message)}
});

app.get('/fetchCartProducts',function(req,res) {
  try {
    var prdCollection = bmgDB.collection('Product');
    var qryStr = req.query.ProdID;

    prdCollection.find({ProdID:{$in:qryStr}}).toArray(function(err,docs){
      if (!err){
        if (docs.length == 0) {res.send()}
        else {res.format({'application/json': function(){res.send(docs)}})}
      }
      else {res.send("Error in fetching documents")}
    });
  }
  catch (e) {res.end("Error in fetching products")}
})

app.post('/addToDB',urlencodedParser,function(req,res){
  try {
    var prdCollection = bmgDB.collection('Product');
    console.log("Body Product:" +req.body.Product);
    var prdToBeAdded = JSON.parse(req.body.Product);

    console.log("ProdID : "+prdToBeAdded.ProdID);
    prdCollection.find({ProdID:prdToBeAdded.ProdID}).toArray(function(err,docs){
      if (docs.length != 0) {res.send("Already Present in DB")}
      else {
        prdCollection.insert({"ProdID":prdToBeAdded.ProdID,"ProdNm":prdToBeAdded.ProdNm,"ProdDsc":prdToBeAdded.ProdDsc,"ImageURL":prdToBeAdded.ImageURL,"Catg":prdToBeAdded.Catg,"MRP":prdToBeAdded.MRP,"ProdGrp":prdToBeAdded.ProdGrp});
        if (!err) {res.send("Success")}
        else {res.send("Error")}
      }
    })
  }
  catch (e) {console.log(e);res.send("Error in adding product to cart!")}
})

app.get('/srchProductByName',function(req,res){
  try {
    var prdCollection = bmgDB.collection('Product');
    var srchStr = req.query.ProdNm;

    prdCollection.find({"ProdNm" : {$regex : new RegExp(srchStr,"i")}}).toArray(function(err,docs){
        if (!err){
        if (docs.length == 0) {
          getProductsFrmAmzn(req,function(err,docs) {
            if (err) {res.send("Error in fetching products")}
            else {
              console.log("Doc.ProdNm "+docs[0].ProdNm);
              res.format({'application/json': function(){res.send(docs)}})
            }
          }); //Use callback function....
        }
        else {res.format({'application/json': function(){res.send(docs)}})}
      }
      else {res.send("Error in fetching documents")}
    });
  }
  catch (e) {console.log("srchProdByName -->"+e.message)}
});

function getProductsFrmAmzn(req,callback) {
  var operation = "ItemSearch"
  var response_group = "Images,ItemAttributes,Offers";  //Stricly no spaces only commas.
  var service="AWSECommerceService";
  var sort="price";
  var search_index = "All";
  var resJSON;
  var vJSON = [];
  var canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&AssociateTag=" + associate_tag + "\&Availability=Available\&Keywords=" +
                                encodeURIComponent(req.query.ProdNm) + "\&Operation=" + operation + "\&ResponseGroup=" +
                                encodeURIComponent(response_group) + "\&SearchIndex=" + search_index + "\&Service=" + service +
                                "\&Timestamp=" + encodeURIComponent(new Date().toISOString());
  var string_to_sign = "GET\n" + end_point + "\n" + uri + "\n" + canonical_query_string;
  var hash = crypto.createHmac('sha256', aws_secret_key).update(string_to_sign).digest('base64');
  var signed_url = amazon_end_point + uri + "\?" + canonical_query_string + "\&Signature=" + encodeURIComponent(hash);
  console.log(signed_url);
  var rawData = '';
  let error;
  http.get(signed_url, (response) => {
    const statusCode = response.statusCode;
    const contentType = response.headers['content-type'];


    if (statusCode != 200) {error = new Error('Request Failed.\n' +'Status Code: ${statusCode}')}
    else if (!/^text\/xml/.test(contentType)) {error = new Error('Invalid content-type.\n'
                                              +'Expected text/xml but received ${contentType}')}
    if (error) {console.log(error.message);response.resume();return}

    response.setEncoding('utf8');
    response.on('data', (chunk) => rawData += chunk);
    response.on('end', () => {
    try {
        parseString(rawData,function(err,resJSON) {
          if (err) {console.log("Error in converting to json")}
          else {
            if (resJSON.ItemSearchResponse.Items[0].Item.length == 0) {vJSON = []}
            else {
                for (var i=0;i<resJSON.ItemSearchResponse.Items[0].Item.length;i++) {
                  try {
                   vJSON[i] = {"ProdNm" : resJSON.ItemSearchResponse.Items[0].Item[i].ItemAttributes[0].Title,
                               "ImageURL" : resJSON.ItemSearchResponse.Items[0].Item[i].MediumImage[0].URL,
                               "MRP" : Number(resJSON.ItemSearchResponse.Items[0].Item[i].ItemAttributes[0].ListPrice[0].Amount)/100,
                               "ProdGrp" : resJSON.ItemSearchResponse.Items[0].Item[i].ItemAttributes[0].ProductGroup,
                               "ProdDsc" : resJSON.ItemSearchResponse.Items[0].Item[i].DetailPageURL,
                               "ProdID" : resJSON.ItemSearchResponse.Items[0].Item[i].ASIN};
                    //console.log("\nItem"+JSON.stringify(vJSON[i]));
                   }
                   catch (e) {} //Ignore items on offers
               }
               //res = vJSON;
             }
            }
            callback(error,vJSON);
        }) //parseString
      }
      catch (e) {console.log(e.message)}
    });
 }).on('error', (e) => {console.log('Got error: ${e.message}')}); //end of http.get
}

app.get('/New-Cart.html',function(req,res){
  res.sendFile(__dirname+"/site/New-Cart.html");
});

app.get('/showWishList',function(req,res) {
  var qryStr = req.query.eventID;
  res.render(__dirname+"/site/showWishList.ejs",{eventID : qryStr});
});

app.get('/filterWishListByCatg',function(req,res){
  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.Catg;
  var eventID = req.query.eventID;
  var prodArr = [];
  wishList.find({"EventID":eventID},{_id:0,Products:1}).toArray(function(err,docs) {
    if (!err){
      if (docs.length == 0) {res.send()}
      else {res.format({'application/json': function(){
        for (i=0;i<docs[0].Products.length;i++) {
          if (qryStr.indexOf(docs[0].Products[i].Catg) != -1) {prodArr.push(docs[0].Products[i])}
        }
        if (prodArr.length == 0) {res.send()}
        else {res.send(prodArr)}
      }})}
    }
    else {res.send("Error in fetching documents")}
  });
}); //filter wishlist by category

app.get('/showListProducts',function(req,res){
  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  wishList.find({"EventID" : qryStr},{_id:0,Products:1}).toArray(function(err,docs) {
    if (!err){
    if (docs.length == 0) {res.send()}
    else {res.format({'application/json': function(){res.send(docs[0].Products)}})}
    }
    else {res.send("Error in fetching documents")}
  });
}); //showListProducts

var server = app.listen(8080,function(){
  console.log("Server listening at 127.0.0.1:8080");
})

app.get('/new_registry', function (req,res){
  res.sendFile(__dirname + "/site/new_registry.html");
  console.log("call made to new_registry.html");
});

app.get('/product_loader',function(req,res){
  res.sendFile(__dirname+"/site/product_loader.html");
});

function WaterfallOver(list, iterator, callback) {
  var nextItemIndex = 0;
  function report() {
    nextItemIndex++;
    if (nextItemIndex === list.length)
      callback();
    else
      iterator(list[nextItemIndex],report);
  }
  iterator(list[0], report);
}

app.post('/load_to_db',urlencodedParser,function(req,res){
    console.log(req.body.array);
    var prods = JSON.parse(req.body.array);
    var collection = bmgDB.collection("Product");
    WaterfallOver(prods.values, function (val, report) {
      collection.find({"ProdID":val.ProdID}).toArray(function (err,data) {
          if(data.length == 0) {
            collection.insert(val, function (err,result) {
              console.log("inserted" + result);
            });
          } else {
            console.log("data not inserted");
          }
          report();
        })}, function() {
          console.log("insert complete");
          res.end("Posted");
        });
});


app.get('/get_amazon',function (req,res) {
  console.log("Page is " + req.query.pageNumber);
  console.log("String is " + req.query.searchString);
  console.log("Cat is " + req.query.searchCat);
  /// The following attribute needs to come in from the web browser based on what is selected.
  var mxprice = 1000;
  var mnprice = 500;
  var search_index = req.query.searchCat;
  var keywords = req.query.searchString;
  ////////////////////////////////////////////////////////////////////////////////////////////////


  //The following entries are mostly static fields, that can be changed as part of a strategic change.
  var multiplier = 100;
  var amazon_end_point = "http://webservices.amazon.in";
  var end_point = "webservices.amazon.in";
  var uri = "/onca/xml";
  var itempage = parseInt(req.query.pageNumber);
  var operation = "ItemSearch"
  var response_group = "Images,ItemAttributes,Offers";  //Stricly no spaces only commas.
  var service="AWSECommerceService";
  var sort="price";
  var maxprice = mxprice * multiplier;
  var minprice = mnprice * multiplier;
  //////////////////////////////////////////////////////////////////////


  ////Constructing Canonical String for the query string to AMZ Aff.////
  ////PLEASE Note that this string should have query parameters in alphabetical order.
  var canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&" +
  "AssociateTag=" + associate_tag + "\&" + "ItemPage=" + itempage + "\&" + "Keywords=" + encodeURIComponent(keywords) + "\&" + "MaximumPrice=" + maxprice +
  "\&" + "MinimumPrice=" + minprice + "\&" + "Operation=" + operation + "\&" + "ResponseGroup=" + encodeURIComponent(response_group) +
  "\&" + "SearchIndex=" + search_index + "\&" + "Service=" + service + "\&" + "Sort=" + sort + "\&" +"Timestamp=" + encodeURIComponent(new Date().toISOString());
  ///////////////////////////////////////////////////////////////////////


  /////////////Creating a string which will be signed with our amazon secret key
  var string_to_sign = "GET\n" + end_point + "\n" + uri + "\n" + canonical_query_string;
  //////////////////////////////////////////////////////////////////////////////////////
  console.log("String to sign" + string_to_sign);

  ///////////// Signing the web service call string with our secret key using sha256////
  var hash = crypto.createHmac('sha256', aws_secret_key).update(string_to_sign).digest('base64');
  var signed_url = amazon_end_point + uri + "\?" + canonical_query_string + "\&Signature=" + encodeURIComponent(hash);
  console.log(signed_url);
  ///////////////////////////////////////////////////////////////////////////////////////
  var rawData = '';

  http.get(signed_url, (response) => {
    const statusCode = response.statusCode;
    const contentType = response.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error(`Request Failed.\n` +
                        `Status Code: ${statusCode}`);
                        res.end("Error");
    } else if (!/^text\/xml/.test(contentType)) {
      error = new Error(`Invalid content-type.\n` +
                        `Expected text/xml but received ${contentType}`);
    }
    if (error) {
      console.log(error.message);
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
        res.end(rawData);
      } catch (e) {
        console.log(e.message);
      }
    });
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });


});