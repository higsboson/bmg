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
var ObjectId = require('mongodb').ObjectID;
var sha256 = require('sha256');

//3/24/2017 - Setting up a variable for database sessions
//This will help bmg with session management
var usersession = require('client-sessions');

// 3/23/2017 - setting up variable rand for csprng package.
// This will be used to generate a salt on which password will be hashed.
var rand = require('csprng');

var amazon_end_point = "http://webservices.amazon.in";
var end_point = "webservices.amazon.in";
var uri = "/onca/xml";
var aws_access_key_id = "";
var aws_secret_key = "";
var associate_tag = "";
var urlHost = "localhost:8080";


var urlencodedParser = bodyParser.urlencoded({extended:true});
app.use(express.static("public")); //define static directory
app.use(bodyParser.json()); //to parse application-json
app.use(urlencodedParser); // for parsing application/x-www-form-urlencoded
app.set('view engine','ejs');

// Making user of npm package client-sessions.
// Setting the app to make use of sessions.
// Ideally the random string that goes here will
// need to be recreated after every restart of the application server

app.use(usersession({
  cookieName: 'session',
  //The secret key will need to come from the database
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

mongoclient.connect("mongodb://localhost:27017/bmgdb", function(err,db) {
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
      //console.log(qryStr);
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
      if (docs.length != 0) {res.send("Already present in DB")}
      else {
        prdCollection.insert({"ProdID":prdToBeAdded.ProdID,"ProdNm":prdToBeAdded.ProdNm,"ProdDsc":prdToBeAdded.ProdDsc,"ImageURL":prdToBeAdded.ImageURL,"Catg":prdToBeAdded.Catg,"MRP":prdToBeAdded.MRP,"ProdGrp":prdToBeAdded.ProdGrp});
        if (!err) {res.send("Success")}
        else {res.send("Error")}
      }
    })
  }
  catch (e) {console.log(e);res.send("Error in adding product to cart!")}
})

app.post('/saveWishlist',urlencodedParser,function(req,res){
  try {
    var wishlistCollection = bmgDB.collection('WishList');
    var prdCollection = bmgDB.collection('Product');
    var wishlistToBeAdded = JSON.parse(req.body.Wishlist);
    var prdIdArr = wishlistToBeAdded.ProductIDs.split(",");
    var wishList = {};

    prdCollection.find({ProdID:{$in:prdIdArr}}).toArray(function(err,docs){
      for (i = 0;i < docs.length;i++) {
        docs[i]["Status"] = "Available";
      }
      if (docs.length == 0) {res.send("Fatal error! Products not found in database")}
      else {
        // Making the below check to see if this wishlist was being saved as a logged in user
        // If the user is not logged in then we set the wishlist record to primary.
        // A Primary record will store user informtation such as the user's name. phone, etc
        if (!(req.session && req.session.user)) {
          wishList = {"EventName":wishlistToBeAdded.EventName,"EventType":wishlistToBeAdded.EventType,
                      "EventDate":wishlistToBeAdded.EventDate,
                      "HostName":wishlistToBeAdded.HostName,"RcvrName":wishlistToBeAdded.ContactName,
                      "HostPhone":wishlistToBeAdded.HostPhone,"HostEmail":wishlistToBeAdded.HostEmail,
                      "KEY":wishlistToBeAdded.Password,"UPPU":wishlistToBeAdded.Uppu,"Primary":1, // Primary 1 means primary record.
                      // Event status 1 means open wishlist, 0 means closed wishlist
                      "EventStatus":1,
                      "Products":docs};
          // Creating a session variable named 'user' which will hold the email.
          // The variable 'user' will be used to validate if the session exists.
          console.log("Wishlist is inserted for " + wishlistToBeAdded.HostEmail + " and " + wishlistToBeAdded.HostName );
          req.session.user = wishlistToBeAdded.HostEmail;
          req.session.name = wishlistToBeAdded.HostName;
        } else {
          wishList = {"EventName":wishlistToBeAdded.EventName,"EventType":wishlistToBeAdded.EventType,
                      "HostEmail":req.session.user,"EventDate":wishlistToBeAdded.EventDate,
                      // Event status 1 means open wishlist, 0 means closed wishlist
                      "EventStatus":1,
                      "Products":docs};
        }

        wishlistCollection.insert(wishList, function(err,insertedObj) {
          if (!err) {
            //we need to send back the link
            var wishListId = insertedObj["ops"][0]["_id"];
            console.log("Wishlist is inserted in database");
            res.send("<b>Wishlist inserted successfully.</b><br><br>To share the wishlist with your invitees, copy and paste the below link :<br>http://"+urlHost+"/showWishList?eventID="+wishListId)}
          else {res.send("Error in saving wishlist. Please try again later")}

        });
      }
    })
  }
  catch (e) {console.log(e);res.send("Error in saving wishlist!")}
})

app.post('/updProductStatus',urlencodedParser,function(req,res) {//change the status of the product
  try {
    var wishlistCollection = bmgDB.collection('WishList');
    var data = JSON.parse(req.body.Data);

    wishlistCollection.update({"_id" : new ObjectId(data.WishListID),"Products.ProdID":data.ProductID},{$set:{"Products.$.Status":data.Status}}, function(err) {
      if (!err) {res.send("Success")}
      else {res.send("Error in updating product status")}
    })
  }
  catch (e) {console.log("Error - "+e)}
})

//3/24/2017 - Created a get to /home.
app.post('/home',urlencodedParser, function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    res.render(__dirname + "/site/home.ejs",{userID : req.session.user,username: req.session.name});
    console.log("call made to home.html with valid session " + req.session.user);
  } else {
    // If this is not a valid session then the user gets a message that the
    // session is not valid
    // At a later time, this should be a login page
    res.end("A session does not exist");
  }
});

app.get('/home', function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    res.render(__dirname + "/site/home.ejs",{userID : req.session.user,username: req.session.name});
    console.log("call made to home.html with valid session " + req.session.user + req.session.name);
  } else {
    // If this is not a valid session then the user gets a message that the
    // session is not valid
    // At a later time, this should be a login page
    res.end("A session does not exist");
  }
});

//trznt - 22/4/2017
//This get will retrieve all wishlist items based on the ID for display on the user's dashboard.
app.get('/getWishListItems', function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    console.log("call made to /getWishListItems with valid session " + req.session.user + req.session.name);
    try {
      var wishList = bmgDB.collection('WishList');
      wishList.find({"_id":new ObjectId(req.query.id),"HostEmail":req.session.user},{_id:0,Products:1}).toArray(function(err,docs) {
        if (!err){
          res.send(docs[0]);
        }
        else {res.send({"Products": []})}
      });
    }
    catch (e) {console.log("Error - " +e)}
  } else {
    res.end("Invalid request");
  }
});


app.get('/getUserWishLists', function (req,res) {
  var wishlistCollection = bmgDB.collection('WishList');
  console.log("getting wishlist for " + req.query.userid);
  //We only return pertinent information such as the event names, types and open/closed registries
  wishlistCollection.find({"HostEmail": req.query.userid},{"_id":1,"EventName":1,"EventType":1,"EventStatus":1,"EventDate":1}).toArray(function(err,docs){
    if (!err) {
      if (docs.length) {
        res.format({'application/json': function(){res.send(docs)}})
      }
    }
  });
});

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

app.get('/srchInAmazon',function(req,res){
  try {
    getProductsFrmAmzn(req,function(err,docs) {
        if (err) {res.send("Error in fetching products")}
        else {
          res.format({'application/json': function(){res.send(docs)}})
        }
    }); //Use callback function....
  }
  catch (e) {console.log("srchProdByName -->"+e.message)}
});

function getProductsFrmAmzn(req,callback) {
  try {
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
    console.log("string to sign - "+string_to_sign);
    console.log("secret key - "+aws_secret_key);
    var hash = crypto.createHmac('sha256', aws_secret_key).update(string_to_sign).digest('base64');
    console.log("hash - "+hash);
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
  catch (e) {console.log("Error - "+e)}
}

app.get('/New-Cart.html',function(req,res){
  res.sendFile(__dirname+"/site/New-Cart.html");
  console.log("Accessing New-Cart.html");
});

app.get('/showWishList',function(req,res) {
  var qryStr = req.query.eventID;
  res.render(__dirname+"/site/showWishList.ejs",{eventID : qryStr});
});

app.get('/filterWishListByCatg',function(req,res){
  try {
    var wishList = bmgDB.collection('WishList');
    var qryStr = req.query.Catg;
    var eventID = req.query.eventID;
    var prodArr = [];
    wishList.find({"_id":new ObjectId(eventID)},{_id:0,Products:1}).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {res.send()}
        else {res.format({'application/json': function(){
          if (qryStr.indexOf("KKK") != -1) {prodArr = docs[0].Products}
          else {
            for (i=0;i<docs[0].Products.length;i++) {
              if (qryStr.indexOf(docs[0].Products[i].Catg) != -1) {prodArr.push(docs[0].Products[i])}
            }
          }
          if (prodArr.length == 0) {res.send("No matching products found")}
          else {res.send(prodArr)}
        }})}
      }
      else {res.send("Error in fetching documents")}
    });
  }
  catch (e) {console.log("Error - "+e)}
}); //filter wishlist by category

app.get('/showListProducts',function(req,res){
  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  try {
    wishList.find({"_id" : new ObjectId(qryStr)},{_id:0,Products:1}).toArray(function(err,docs) {
      if (!err){
      if (docs.length == 0) {res.send("Unable to find the desired wishlist")}
      else {res.format({'application/json': function(){res.send(docs[0].Products)}})}
      }
      else {res.send("Error in fetching documents")}
    });
  }
  catch (e) {res.send(e)}
}); //showListProducts

var server = app.listen(8080,function(){
  console.log("Server listening at 127.0.0.1:8080");
})

app.get('/new_registry', function (req,res){
  res.sendFile(__dirname + "/site/new_registry.html");
  console.log("call made to new_registry.html");
});

app.post('/getsalt',urlencodedParser,function(req,res) {
  req.session.email = null;
  req.session.user = null;
  res.end(rand(160,36));
});

app.post('/plogin',urlencodedParser,function(req,res){
  console.log("Performing login with " +  req.body.attempt + " " + req.body.gensalt);

  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  try {
    wishList.find({"HostEmail" : req.body.user},{_id:0,KEY:1,HostName:1}).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {res.end("")}
        else {
          console.log("Key from DB is " + docs[0].KEY);
          var trypass = sha256(req.body.gensalt + docs[0].KEY);
          console.log("Try Pass is " + trypass);
          if (req.body.attempt == trypass) {
            req.session.user = req.body.user;
            req.session.name = docs[0].HostName;
            res.end("Login Success");
          } else {
            res.end("Login Fail");
          }
        }
      }
      else {res.end("Error in fetching documents")}
    });
  }
  catch (e) {res.end(e)};
});

app.post('/getSaltForUser',urlencodedParser,function(req,res) {
  console.log(req.body.user);
  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  try {
    wishList.find({"HostEmail" : req.body.user},{_id:0,HostEmail:1,UPPU:1}).toArray(function(err,docs) {
      if (!err){
      if (docs.length == 0) {res.end("")}
      else {res.end(docs[0].UPPU)}
      }
      else {res.end("Error in fetching documents")}
    });
  }
  catch (e) {res.end(e)};
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
