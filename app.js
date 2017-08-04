'use strict';

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
//3/24/2017 - Setting up a variable for database sessions
//This will help bmg with session management
var usersession = require('client-sessions');


// 3/23/2017 - setting up variable rand for csprng package.
// This will be used to generate a salt on which password will be hashed.
var rand = require('csprng');
bmgaux.test();
const amazon_end_point = "http://webservices.amazon.in";
const end_point = "webservices.amazon.in";
const uri = "/onca/xml";
var aws_access_key_id = "";
var aws_secret_key = "";
var associate_tag = "";
var urlHost;
var emailPassword;
var certdir;
var envmode;
const googleSiteVerify = "https://www.google.com/recaptcha/api/siteverify";
var captchaSecret = "";


var app2 = express();

var httpServer = http.Server(app2);

app2.get('*',function(req,res){
  if (envmode == "prod") {
    res.redirect('https://www.bemygenie.com' + req.url);
  }
  else if (envmode == "dev") {
    res.redirect('https://dev.bemygenie.com:3000' + req.url);
  }
})


function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}

function getTimeStamp() {
  var dateUTC = new Date();
  var dateUTC = dateUTC.getTime();
  var dateIST = new Date(dateUTC);
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  return '[' + dateFormat (dateIST, "%d-%m-%Y %H:%M:%S", true) + '] ';
}


var urlencodedParser = bodyParser.urlencoded({extended:true,limit: '50mb'});
app.use(express.static("public")); //define static directory
app.use(bodyParser.json()); //to parse application-json
app.use(urlencodedParser); // for parsing application/x-www-form-urlencoded
app.set('view engine','ejs');



// Making user of npm package client-rs.
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

//console.log(process.argv[2]);

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
        captchaSecret = doc[0].captchaSecret;
        emailPassword = doc[0].mailconn;
        certdir = doc[0].certdir;
        envmode = doc[0].envmode;

        if (envmode == "prod") {
          urlHost = "www.bemygenie.com";
        } else if (envmode == "dev") {
          urlHost = "dev.bemygenie.com";
        }


        var certoptions = {
           key  : fs.readFileSync(certdir + "nodejs.key"),
           cert : fs.readFileSync(certdir + "nodejs.crt")
        };

        var server = https.createServer(certoptions, app).listen(3000, function () {
           console.log('Started https on 3000!');
        });

        httpServer.listen(8080, function(err){
          console.log('Listening on 8080');
        });

      }
    });
  }
  else {
    console.log("Error in connection"+err);
  };

});

//var server = app.listen(8080,function(){
//  console.log("Server listening at 127.0.0.1:8080");
//})


//delay test
//for (var i = 0;i < 50;i++){
//  for (var j = 0;j < 100000000;j++);
//}


app.get('/', function(req,res) {
  console.log(getTimeStamp() + 'Index|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/index.html");
});

app.get('/FAQ.html',function(req,res) {
  console.log(getTimeStamp() + 'FAQ|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/FAQ.html");
})



app.get('/invite.html',urlencodedParser, function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    console.log(getTimeStamp() + 'Invite|' + req.connection.remoteAddress)
    res.render(__dirname + "/email_templates/invite.ejs",{userID : sha256(req.session.user),username: req.session.name});
    //console.log("call made to home.html with valid session " + req.session.user);
  } else {
    // If this is not a valid session then the user gets a message that the
    // session is not valid
    // At a later time, this should be a login page
    res.redirect('/');
  }
});


app.get('/aboutus.html',function(req,res) {
  console.log(getTimeStamp() + 'About|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/aboutus.html");
})

app.get('/howitworks.html',function(req,res) {
  console.log(getTimeStamp() + 'HowItWorks|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/howitworks.html");
})

app.get('/aboutus',function(req,res) {
  console.log(getTimeStamp() + 'About|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/aboutus.html");
})

app.get('/learnmore.html',function(req,res) {
  console.log(getTimeStamp() + 'LearnMore|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/learnmore.html");
})

app.get('/findRegistry',function(req,res) {
  console.log(getTimeStamp() + 'FindRegistry|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/findRegistry.html");
})

app.get('/exportinvites',function(req,res) {
  if (req.session.adminUser && req.session) {
    console.log(getTimeStamp() + 'exportinvites|' + req.connection.remoteAddress);
    res.sendFile(__dirname + "/email_templates/exportinvites.html");
  } else {
    res.send("Un-Autorized Access. Your IP will be recorded.")
  }
})

app.get('/review_product',function(req,res) {
  if (req.session.adminUser && req.session) {
    res.sendFile(__dirname + "/site/review_product.html");
  } else {
    res.send("Un-Autorized Access. Your IP will be recorded.")
  }
})

app.get('/dashboard.html',function(req,res) {
  if (req.session.adminUser && req.session) {
    res.sendFile(__dirname + "/site/dashboard.html");
  } else {
    res.send("Un-Autorized Access. Your IP will be recorded.")
  }
})

app.post('/showReports',function(req,res) {
  if (req.session.adminUser && req.session) {
    try {
      var data = JSON.parse(req.body.Data);
      var reportName = data.ReportName;
      var vCollection;
      var vRportsObject;
      if (reportName == "Number of active wishlists") {
        vCollection = bmgDB.collection('WishList');
        vCollection.find({"EventDate":{$gte:new Date()}}).count(function(err,count) {
          if (err) {res.send(err)}
          else {res.send({"count":count})}
        })
      }
      else if (reportName == "Number of products") {
        vCollection = bmgDB.collection('Product');
        vCollection.find().count(function(err,count) {
          if (err) {res.send(err)}
          else {res.send({"count":count})}
        })
      }
      else if (reportName == "Number of products by product group") {
        vCollection = bmgDB.collection('Product');
        vCollection.aggregate([{$group:{_id:"$ProdGrp",count:{$sum:1}}}],function(err,docs) {
          if (err) {res.send(err)}
          else {res.send(docs)}
        })
      }
      else if (reportName == "Number of products by event type") {
        vCollection = bmgDB.collection('Product');
        vCollection.aggregate([{$group:{_id:"$eventType",count:{$sum:1}}}],function(err,docs) {
          if (err) {res.send(err)}
          else {res.send(docs)}
        })
      }
      else if (reportName == "Number of products by creator") {
        vCollection = bmgDB.collection('Product');
        vCollection.aggregate([{$group:{_id:"$created_by",count:{$sum:1}}}],function(err,docs) {
          if (err) {res.send(err)}
          else {res.send(docs)}
        })
      }
      else if (reportName == "Number of products by review status") {
        vCollection = bmgDB.collection('Product');
        vCollection.aggregate([{$group:{_id:"$Reviewed",count:{$sum:1}}}],function(err,docs) {
          if (err) {res.send(err)}
          else {res.send(docs)}
        })
      }
      else if (reportName == "Number of purchased products for each event") {
        vCollection = bmgDB.collection('WishList');
        vCollection.aggregate([{$match:{"$Products.Status":"Already Bought"}},{$group:{_id:"$EventName",count:{$sum:1}}}],function(err,docs) {
          if (err) {res.send(err)}
          else {res.send(docs)}
        })
      }
      else if (reportName == "Number of active wishlists by event type") {
        vCollection = bmgDB.collection('WishList');
        vCollection.aggregate([{$match:{"EventDate":{$gte:new Date()}}},{$group:{_id:"$EventType",count:{$sum:1}}}],function(err,docs) {
          if (err) {res.send(err)}
          else {res.send(docs)}
        })
      };
    } //try
    catch (e) {console.log("Error in show reports : "+e);console.log('Data is: ' + req.body.Data)}
  } else {
    res.send("Un-Autorized Access. Your IP will be recorded.")
  }
})

app.get('/downloadFile',function(req,res) {
  console.log(getTimeStamp() + 'DownloadFile|' + req.connection.remoteAddress)
  if (typeof req.session.downloadkey === 'undefined') {
        res.send("Un-Autorized Access.")
        console.log('Un-Autorized Access')
  }
  else {
    if (req.session.downloadkey == null) {
      res.send("Un-Autorized Access.")
    }
    else {
      res.sendFile(req.session.downloadkey);
      req.session.downloadkey = null;
    }
  }
})

app.post('/saveInviteImage',urlencodedParser, function(req,res) {
  var templateDir = __dirname + '/email_templates/saved/';
  fs = require('fs');
  // string generated by canvas.toDataURL()
  var img = req.body.imgBase64;
  // strip off the data: url prefix to get just the base64-encoded bytes
  var data = img.replace(/^data:image\/\w+;base64,/, "");
  var buf = new Buffer(data, 'base64');
  req.session.downloadkey = templateDir + req.body.fname + '.png';
  fs.writeFile(templateDir + req.body.fname + '.png', buf, 0, buf.length, function(error) {
    if(error) {
      console.log('[write auth]: ' + error);
    } else {
      console.log('[write auth]: success');
      res.end('Success');
    }
  })
});

app.get('/getEventTmplt',function(req,res) {
  try {
    console.log(getTimeStamp() + 'getEventTmplt|' + req.connection.remoteAddress);
    var tmpltCollection = bmgDB.collection("Templates");
    var eventType = req.query.EventType;
    tmpltCollection.find({"EventType":eventType}).toArray(function(err,docs) {
      if (!err) { res.send(docs)}
      else {res.send("Unable to fetch invitiation templates")}
    })
  }
  catch (e) {console.log(getTimeStamp() + 'getEventTmplt|Error - ' + e)}
})

app.get('/getProductReview',function(req,res) {
  if (req.session.adminUser && req.session) {
    var prdCollection = bmgDB.collection('Product');
    prdCollection.find({"Reviewed" : "TBD"}).toArray(function(err,docs){

      if (!err){
        res.send(docs.length + "");
      }
      else {res.send("Error in fetching documents")}
    });
  } else {
    res.send("Un-Autorized Access. Your IP will be recorded.")
  }
})

app.get('/getProductReviewItems',function(req,res) {
  if (req.session.adminUser && req.session) {
    var prdCollection = bmgDB.collection('Product');
    prdCollection.find({"Reviewed" : "TBD"}).toArray(function(err,docs){
      if (!err){
        if (docs.length == 0) {res.send()}
        else {res.format({'application/json': function(){res.send(docs)}})}
      }
      else {res.send("Error in fetching documents")}
    });
  } else {
    res.send("Un-Autorized Access. Your IP will be recorded.")
  }
})

app.get('/forgotPassword',function(req,res) {
  res.sendFile(__dirname + "/site/forgotPassword.html");
})

app.get('/admin',function(req,res) {
  if (req.session.adminUser && req.session) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    res.render(__dirname + "/site/admin_home.ejs",{username: req.session.adminUser});
    //console.log("call made to admin_home.html with valid session " + req.session.adminUser);
  } else {
    // Logging in if there is no valid session.
    res.sendFile(__dirname + "/site/admin.html");
  }

})

app.post('/eventDetails',function(req,res) {
  try {
    console.log(getTimeStamp() + 'eventDetails|' + req.connection.remoteAddress);
    var wishlistCollection = bmgDB.collection('WishList');
    var qryStr = req.body.EventId;
    wishlistCollection.find({"event_id":qryStr},{"EventType":1,"RcvrName":1,"inviteGreeting":1,"addr":1,"EventDate":1,"invite_date":1,"invite_time":1}).toArray(function(err,docs) {
      if (!err) {
        res.send(docs);
      }
      else {res.send("Error in fetching wishlist")}
    })
  }
  catch (e) {console.log(getTimeStamp() + 'eventDetails|Error - ' + e)}
})

app.post('/saveInviteTmplt',function(req,res) {
  try {
    console.log(getTimeStamp() + 'saveInviteTmplt|' + req.connection.remoteAddress);
    var wishlistCollection = bmgDB.collection('WishList');
    var templateId = req.body.TemplateId;
        wishlistCollection.update({"uid":req.body.eventUID,"wid":req.body.eventWID},{$set:{"TmpltId":templateId,"invExp":"N"}}, function(err){
      if (!err) {
        res.send("Success");
      }
      else {res.send("Error in fetching wishlist")}
    })
  }
  catch (e) {console.log(getTimeStamp() + 'eventDetails|Error - ' + e)}
})

app.post('/updateEventDetailsForWishList',function(req,res) {
  try {
    console.log(getTimeStamp() + 'updateEventDetailsForWishList|' + req.connection.remoteAddress);
    var wishlistCollection = bmgDB.collection('WishList');
    var eventUID = req.body.EventUID;
    var eventWID = req.body.EventWID;
    console.log(req.body.addr + req.body.inviteGreeting + req.body.event_time);
      wishlistCollection.update({"uid":eventUID,"wid":eventWID},{$set:{addr:req.body.addr,inviteGreeting:req.body.inviteGreeting,invite_date:req.body.invite_date,invite_time:req.body.invite_time}}, function(err){
      if (!err) {
        res.send("Success");
      }
      else {res.send("Error in fetching wishlist" + err)}
    })
  }
  catch (e) {console.log(getTimeStamp() + 'eventDetails|Error - ' + e)}
})

app.post('/inviteSent',function(req,res) {
  try {
    console.log(getTimeStamp() + 'inviteSent|' + req.connection.remoteAddress);
    var wishlistCollection = bmgDB.collection('WishList');
    var eventID = req.body.EventId;
    wishlistCollection.update({"event_id":eventID},{$set:{"invExp":"Y"}}, function(err){
      if (!err) {
        res.send("Success");
      }
      else {res.send("Error in fetching wishlist")}
    })
  }
  catch (e) {console.log(getTimeStamp() + 'inviteSent|Error - ' + e)}
})


app.post('/getProdByCatg',function(req,res){
  try {
    var prdCollection = bmgDB.collection('Product');
    var qryStr = JSON.parse(req.body.Catg);
    //console.log("Query String - "+qryStr);
    var count = qryStr.catgCount;
    var evenTypeStr = qryStr.eventType;
    var genderVal = qryStr.genderCat;
    //console.log("Event Type : "+evenTypeStr);
    //console.log("Count : "+qryStr.catgCount);
    //console.log("Category Array : "+qryStr.category);
    //console.log("pNameFlag is " + qryStr.pNameFlag);
    if (qryStr.eventType != 'A Special Event') {
      if (qryStr.pNameFlag == "0") {
        //console.log("no item names searched")

        if (parseInt(qryStr.ageCat) == -1) {
          //console.log("Age Cat" + qryStr.ageCat);
          if (count == 0) {
            prdCollection.find({"eventType":{$elemMatch:{$eq:evenTypeStr}},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
          else {
            prdCollection.find({"eventType":{$elemMatch:{$eq:evenTypeStr}},"Catg":{$in:qryStr.category},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
        } else {
          //console.log("Age Cat" + qryStr.ageCat);
          if (count == 0) {
            prdCollection.find({"eventType":{$elemMatch:{$eq:evenTypeStr}},"genderCat":{$elemMatch:{$eq:genderVal}},"ageCat":{$elemMatch:{$eq:parseInt(qryStr.ageCat)}},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
          else {
            //console.log("Count greater than 0" + evenTypeStr + genderVal + qryStr.ageCat + qryStr.category + 'skip is ' + req.body.skip + 'limit is ' +req.body.limit);
            prdCollection.find({"eventType":{$elemMatch:{$eq:evenTypeStr}},"genderCat":{$elemMatch:{$eq:genderVal}},"ageCat":{$elemMatch:{$eq:parseInt(qryStr.ageCat)}},"Catg":{$in:qryStr.category},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
        }
      } else {

        var searchKeyWords = qryStr.productNameKeywords;
        //console.log(searchKeyWords);
        if (count == 0) {
          prdCollection.find({"eventType":{$elemMatch:{$eq:evenTypeStr}},"prodNameKeyWords":{$all:searchKeyWords},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
            if (!err){
              if (docs.length == 0) {res.send()}
              else {res.format({'application/json': function(){res.send(docs)}})}
            }
            else {console.log(err);res.send("Error in fetching documents")}
          })
        }
        else {
          prdCollection.find({"eventType":{$elemMatch:{$eq:evenTypeStr}},"prodNameKeyWords":{$all:searchKeyWords},"Catg":{$in:qryStr.category},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
            if (!err){
              if (docs.length == 0) {res.send()}
              else {res.format({'application/json': function(){res.send(docs)}})}
            }
            else {console.log(err);res.send("Error in fetching documents")}
          })
        }
      }
    } else {
      if (qryStr.pNameFlag == "0") {
        //console.log("no item names searched")
        if (parseInt(qryStr.ageCat) == -1) {
          if (count == 0) {
            prdCollection.find({"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
          else {
            prdCollection.find({"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}},"Catg":{$in:qryStr.category},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
        } else {
          if (count == 0) {
            prdCollection.find({"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}},"genderCat":{$elemMatch:{$eq:genderVal}},"ageCat":{$elemMatch:{$eq:parseInt(qryStr.ageCat)}},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
          else {
            prdCollection.find({"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}},"genderCat":{$elemMatch:{$eq:genderVal}},"ageCat":{$elemMatch:{$eq:parseInt(qryStr.ageCat)}},"Catg":{$in:qryStr.category},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
              if (!err){
                if (docs.length == 0) {res.send()}
                else {res.format({'application/json': function(){res.send(docs)}})}
              }
              else {console.log(err);res.send("Error in fetching documents")}
            })
          }
        }
      } else {

        var searchKeyWords = qryStr.productNameKeywords;
        //console.log(searchKeyWords);
        if (count == 0) {
          prdCollection.find({"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}},"prodNameKeyWords":{$all:searchKeyWords},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
            if (!err){
              if (docs.length == 0) {res.send()}
              else {res.format({'application/json': function(){res.send(docs)}})}
            }
            else {console.log(err);res.send("Error in fetching documents")}
          })
        }
        else {
          prdCollection.find({"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}},"prodNameKeyWords":{$all:searchKeyWords},"Catg":{$in:qryStr.category},"InStock":1}).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit)).toArray(function(err,docs) {
            if (!err){
              if (docs.length == 0) {res.send()}
              else {res.format({'application/json': function(){res.send(docs)}})}
            }
            else {console.log(err);res.send("Error in fetching documents")}
          })
        }
      }
    }
  }
  catch (e) {console.log("getProdByCatg -->"+e.message);console.log("Data is: " + req.body.Catg)}
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

app.post('/addToDBByUser',urlencodedParser,function(req,res){
  try {
    var prdCollection = bmgDB.collection('Product');
    //console.log("Body Product:" +req.body.Product);
    var prdToBeAdded = JSON.parse(req.body.Product);

    //console.log("ProdID : "+prdToBeAdded.ProdID);
    prdToBeAdded.AddDate = new Date();
    prdToBeAdded.UpdDate = new Date(prdToBeAdded.AddDate);
    //console.log("Update Date : "+prdToBeAdded.UpdDate);
    prdCollection.find({ProdID:prdToBeAdded.ProdID}).toArray(function(err,docs){
      if (docs.length != 0) {res.send("Already present in DB")}
      else {
        prdCollection.insert({"ProdID":prdToBeAdded.ProdID,"ProdNm":prdToBeAdded.ProdNm,"ProdDsc":prdToBeAdded.ProdDsc,"ImageURL":prdToBeAdded.ImageURL,"Catg":prdToBeAdded.Catg,"MRP":prdToBeAdded.MRP,"ProdGrp":prdToBeAdded.ProdGrp,"eventType":prdToBeAdded.eventType,"prodNameKeyWords":prdToBeAdded.prodNameKeyWords,"Reviewed":prdToBeAdded.Reviewed,"ageCat":prdToBeAdded.ageCat,
        "AddDate":prdToBeAdded.AddDate,"genderCat":prdToBeAdded.genderCat,"created_by":prdToBeAdded.created_by,"MfrID":1,"InStock":1,"UpdDate":prdToBeAdded.UpdDate});
        if (!err) {res.send("Success")}
        else {res.send("Error")}
      }
    })
  }
  catch (e) {console.log(e);console.log('Data is ' + req.body.Product);res.send("Error in adding product to cart!")}
})

app.post('/saveReminder',urlencodedParser,function(req,res){
  console.log(getTimeStamp() + 'SaveReminder|' + req.connection.remoteAddress);
  try {
    var remCollection = bmgDB.collection('Reminder');
    //console.log("Body Product:" +req.body.Product);
    var remToBeAdded = {};

    //console.log("ProdID : "+prdToBeAdded.ProdID);
    remToBeAdded.date = new Date(req.body.date);
    remToBeAdded.email = req.body.email;
    remToBeAdded.name = req.body.name;
    //console.log("Update Date : "+prdToBeAdded.UpdDate);
    remCollection.find({Email:remToBeAdded.email.toUpperCase()}).toArray(function(err,docs){
      if (docs.length != 0) {res.send("Already present in DB")}
      else {
        remCollection.insert({"Name":remToBeAdded.name,"Email":remToBeAdded.email.toUpperCase(),"Date":remToBeAdded.date});
        if (!err) {res.send("Success")}
        else {res.send("Error")}
      }
    })
  }
  catch (e) {console.log(e);console.log('Data is ' + req.body.email + ',' + req.body.name);res.send("Error in adding product to cart!")}
})

app.post('/checkRegistry',urlencodedParser,function(req,res){
  console.log(getTimeStamp() + 'checkRegistry|' + req.connection.remoteAddress);
  var response = {};
  console.log(JSON.stringify(req.body.registry));
  try {
    var refCollection = bmgDB.collection('WishListRef');

    refCollection.find({WishListID:req.body.registry.toUpperCase()}).toArray(function(err,docs){
      if (docs.length == 0) {response.status = "not found";res.send(response)}
      else {
        console.log(JSON.stringify(docs));
        response.status = "found";
        response.wid = docs[0].wid;
        response.uid = docs[0].uid;
        console.log(JSON.stringify(response));
        res.send(response);
      }
    })
  }
  catch (e) {console.log(e);console.log('Data is ' + req.body.registry);res.send("Error")}
})

app.post('/saveReviewedProducts',urlencodedParser,function(req,res){
  var prodCollection = bmgDB.collection('Product');
  WaterfallOver(req.body.array,function (val,report){
      prodCollection.update({"_id" : new ObjectId(val.Prod)},{$unset:{"Reviewed":"TBD"},$set :{"eventType":val.events}}, function(err) {
        if (!err) {report();}
        else {console.log("Error in updating product status")}
      });
    },function() {
      //console.log("Work Done");
      res.end("Posted");
    });

});

function WaterfallRetry(firstrand,iterator, callback) {
  var random;
  function report(t) {
    if (t)
      callback();
    else {
      random = bmgaux.randomString();
      iterator(random,report);
    }
  }
  iterator(firstrand, report);
}

app.post('/saveWishlist',urlencodedParser,function(req,res){
  try {
    var wishlistCollection = bmgDB.collection('WishList');
    var prdCollection = bmgDB.collection('Product');
    var wishlistToBeAdded = JSON.parse(req.body.Wishlist);
    var prdIdArr = wishlistToBeAdded.ProductIDs.split(",");
    var wishList = {};

    prdCollection.find({ProdID:{$in:prdIdArr}},{"_id":1,"ProdId":1}).toArray(function(err,docs){
      for (var i = 0;i < docs.length;i++) {
        docs[i]["Status"] = "Available";
      }
      if (docs.length == 0) {res.send("Fatal error! Products not found in database")}
      else {
        // Making the below check to see if this wishlist was being saved as a logged in user
        // If the user is not logged in then we set the wishlist record to primary.
        // A Primary record will store user informtation such as the user's name. phone, etc
        if (!(req.session && req.session.user)) {
          wishList = {"EventName":wishlistToBeAdded.EventName,"EventType":wishlistToBeAdded.EventType,
                      "EventDate":new Date(wishlistToBeAdded.EventDate),
                      "HostName":wishlistToBeAdded.HostName,"RcvrName":wishlistToBeAdded.ContactName,
                      "HostPhone":wishlistToBeAdded.HostPhone,"HostEmail":wishlistToBeAdded.HostEmail,
                      "KEY":wishlistToBeAdded.Password,"UPPU":wishlistToBeAdded.Uppu,"Primary":1, // Primary 1 means primary record.
                      // Event status 1 means open wishlist, 0 means closed wishlist
                      "EventStatus":1,
                      "uid":sha256(wishlistToBeAdded.HostEmail) ,
                      "wid":sha256(rand(160,36) + wishlistToBeAdded.HostEmail) ,
                      "wcd" :new Date(),
                      "Products":docs};
          // Creating a session variable named 'user' which will hold the email.
          // The variable 'user' will be used to validate if the session exists.
          //console.log("Wishlist is inserted for " + wishlistToBeAdded.HostEmail + " and " + wishlistToBeAdded.HostName );
          req.session.user = wishlistToBeAdded.HostEmail;
          req.session.name = wishlistToBeAdded.HostName;
        }
        else {
          wishList = {"EventName":wishlistToBeAdded.EventName,"EventType":wishlistToBeAdded.EventType,
                      "HostEmail":req.session.user,"EventDate":new Date(wishlistToBeAdded.EventDate),
                      "HostName":req.session.name,
                      // Event status 1 means open wishlist, 0 means closed wishlist
                      "EventStatus":1,
                      "uid":sha256(req.session.user),
                      "wid":sha256(rand(160,36) + req.session.user) ,
                      "wcd" :new Date(),
                      "Products":docs};
        }
        var random_string = bmgaux.randomString();

        wishlistCollection.insert(wishList, function(err,insertedObj) {
          if (!err) {
            //we need to send back the link
            try {
              var random_string = bmgaux.randomString();
              var wishlistRef = bmgDB.collection('WishListRef');
              var wishListId = insertedObj["ops"][0]["wid"];
              var hostName = insertedObj["ops"][0]["HostName"];
              var hostEmail = insertedObj["ops"][0]["HostEmail"];
              var wid = insertedObj["ops"][0]["wid"];
              var uid = insertedObj["ops"][0]["uid"];
              var _id = insertedObj["ops"][0]["_id"];
              var refDoc = {};
              refDoc.wid = wid;
              refDoc.uid = uid;
              var firstrand = bmgaux.randomString();
              console.log(JSON.stringify(refDoc));

              WaterfallRetry(firstrand, function tryInsert(rand,report){
                refDoc.WishListID = rand;
                wishlistRef.insert(refDoc, function(err, result) {
                  if (!err) {
                    report(true);
                  } else {
                    console.log(err.code);
                    report(false);
                  }
                })
              }, function callback() {
                var arr = refDoc.WishListID.split('');
                var ref_ID = arr[0] + arr[1] + arr[2] + " - " + arr[3] + arr[4] + arr[5] + " - " + arr[6] + arr[7] + arr[8];
                var wishListModalTxt = "Your wishlist has been created! You can now share your wishlist with your guests so that they know what to get you on this special occasion. You can share using any of the methods below:<br><br>1. Copy the below URL and share/email it to your guests <br><br><input class=\"form-control\" style=\"font-size:20px\" onClick=\"this.select();\" value=\"http://"+ urlHost +"/showWishList?eventID=" + wid + "\&u=" + uid  + " \" readonly/><br><br>2. Send across the wish list reference ID to your guests. They will be able to look up the registry on our site directly. <div class=\"help-tip-learnmore\" style=\"text-align:center;font-size:12px\">	<p>This is the best option in case you are planning out an event with a large number of guests. For eg. if it's a wedding, you can have this wishlist ID mentioned in your wedding invitation.</p> </div> <br<div style='text-align:center'><p><b>" + ref_ID + "</b></p><br><br>3. Use Bemygenie's registry notification service. We will directly send a notifciation email to your guests with a link to your wish list. You can launch this service from your homepage</div>";
                var wishListEmailTxt = "Your wishlist has been created! You can now share the following URL with your friends and family so that they know what to get you on this special occasion:<br><a href=\"http://"+ urlHost +"/showWishList?eventID=" + wishListId + "\&u=" + uid  + "\"><br>http://"+ urlHost +"/showWishList?eventID=" + wid + "\&u=" + uid  + "</a><br><br>Your wishlist can also be accessed using your registry reference ID on bemygenie.com. This registry's ID is: <br><br><div style='text-align:center'><p><b>" + ref_ID + "</b></p></div>";
                var emailTxt = '<p style="font-family:"Merriweather", serif;font-size:16px">Dear '+ hostName +',<br><br>Thank you for choosing Bemygenie.</p>';
                emailTxt = emailTxt + '<p style="font-family:"Merriweather", serif;font-size:16px">'+ wishListEmailTxt +'<br><br><br>Team Bemygenie</p>';
                wishlistCollection.update({"_id":new ObjectId(_id)},{$set: {event_id: ref_ID,notification_sent:0}}, function (err){
                  bmgaux.mailer(emailPassword,'support',hostEmail,'New Wishlist Created',emailTxt,function(message,response) {});
                  res.send(wishListModalTxt + '<input type="hidden" name="wishlistIdReference" id="wishlistIdReference" value="' + wishListId + '" ><input type="hidden" name="UIDReference" id="UIDReference" value="' + uid + '" ><input type="hidden" name="refID" id="refID" value="' + ref_ID + '" ><input type="hidden" name="WishListRef" id="UIDReference" value="' + refDoc.WishListID + '" >');
                })
              })
            }
            catch (e) {
              console.log(e);
            }
          }
          else {res.send("Error in saving wishlist. Please try again later")}

        });
      }
    })
  }
  catch (e) {console.log(e);console.log('Data is ' + req.body.Wishlist);res.send("Error in saving wishlist!")}
})

app.post('/sendMailerNotification',urlencodedParser,function(req,res) {
  var aux_invite_mailer = bmgDB.collection('AUX_INVITE_MAILER');
  var eventid = req.body.event_id_num.replace(/ /g,'');
  var realmails = req.body.email_adds;
  var username = req.body.username;
  WaterfallOver(req.body.email_adds,function (item,report) {
    aux_invite_mailer.insert({event_id:eventid,email:item,username:username,sent:0}, function(err,result) {
      if (!err) {
          report();
        }
      });
  }, function () {
    res.end("AllSaved");
  })
});

/*app.post('/sendMailerNotification',urlencodedParser,function(req,res) {//change the status of the product
  try {
    var mail_adds = [];
    var mail_add_set = [];
    var bcc = ""
    var i = 0,j = 0,k = 0;
    console.log('length is ' + req.body.email_adds.length);
    for (i = 0,j = 0,k = 0;i < req.body.email_adds.length;i++) {
      console.log(req.body.email_adds[i]);
      if (j != 0) {
        bcc += ",";
      }
      if (j < 0 ) {
        bcc += req.body.email_adds[i];
        j++;
      }
      else {
         bcc += req.body.email_adds[i];
         console.log(bcc);
         mail_add_set[k] = bcc;
         k++;
         bcc = "";
         j = 0;
       }
    }
    if (j != 0) {
      mail_add_set[k] = bcc;
      k++;
      bcc = "";
      j = 0;
    }
    console.log(JSON.stringify(mail_add_set));
    WaterfallOver(req.body.email_adds, function (set, report) {
      var wishListEmailTxt = "Hi There! <br><br> " + req.body.username + " has just created a gift wishlist on bemygenie.com and has shared it with you. Please go through the list and select the gift that you would like to present to " + req.body.username + " on this special occasion!<br><br> The wishlist can be accessed via the folloring URL: <br><br><a href='" + req.body.url  + "' target='_blank'>Wishlist</a><br><br>The wishlist can also be accessed by the 'Find Registry' option on <a href='www.bemygenie.com' target='_blank'>www.bemygenie.com</a> using the following reference ID: <br><br><div style='text-align:center'><p><b>" + req.body.event_id + "</b></p></div><br>Thanks<br>Team Bemygenie.com";
        bmgaux.mailer(emailPassword,'support',set,req.body.username + ' has shared a wishlist with you.',wishListEmailTxt,function(message,response) {
          setTimeout(function () {
            report();
          }, 1000)
        });
      }, function (){
        res.send("Sent Mailer Success for " + req.body.event_id + ' - ' + req.body.url)
    })
  }
  catch (e) {
    console.log(e);
    res.send("Error in sendingMailer")
  }
});*/

app.post('/updateSentNotification',urlencodedParser,function(req,res) {//change the status of the product
  console.log(getTimeStamp() + 'UpdateNotification|' + req.connection.remoteAddress)
  try {
    var wishlistCollection = bmgDB.collection('WishList');
    wishlistCollection.update({"wid":req.body.EventWID,"uid":req.body.EventUID},{$set: {notification_sent:1}}, function (err){
      res.send('NotificationUpdated');
    })
  }
  catch (e) {console.log("Error - "+e);console.log('Data is ' + req.body.Data)}
}) //updProductStatus

app.post('/updProductStatus',urlencodedParser,function(req,res) {//change the status of the product
  try {
    var wishlistCollection = bmgDB.collection('WishList');
    var data = JSON.parse(req.body.Data);
    var currDate = new Date();
    //if (data.emailaddr == "NA" ) { //email address is sent NA when confirming or cancelling purchase
      wishlistCollection.update({"wid":data.WishListID,"uid":data.u,"Products._id":new ObjectId(data.ProductID)},{$set:{"Products.$.Status":data.Status,"Products.$.statusUpddDt":currDate,"Products.$.email":data.emailaddr}}, function(err) {
        if (!err) {res.send("Success")}
        else {res.send("Error in updating product status")}
      })
  /*  else {
      wishlistCollection.update({"wid":data.WishListID,"uid":data.u,"Products._id":new ObjectId(data.ProductID)},{$set:{"Products.$.Status":data.Status,"Products.$.statusUpddDt":currDate}}, function(err) {
        if (!err) {res.send("Success")}
        else {res.send("Error in updating product status")}
      })}*/
  }
  catch (e) {console.log("Error - "+e);console.log('Data is ' + req.body.Data)}
}) //updProductStatus


app.post('/resetPassword',urlencodedParser,function(req,res) {//change the status of the product
  try {
    var profileDetails = bmgDB.collection('WishList');
    var aux_passwordReset = bmgDB.collection('AUX_PASSRESET');


    profileDetails.find({$and: [{"uid": sha256(req.body.username)},{"Primary" : 1}]},{"_id":1,"HostName":1,"HostPhone":1,"HostEmail":1}).toArray(function(err,docs){
      if (!err) {
        if (docs.length) {
          //console.log('email found');
          var setval = sha256(rand(160,36) + docs[0].HostEmail) + sha256(rand(160,36) + docs[0]._id);
          aux_passwordReset.insert({"email":req.body.username,"FP":setval}, function(err,result) {
            if (!err) {
              //console.log('inserted fp');
              bmgaux.mailer(emailPassword,'support',req.body.username,'Password Reset','<b>Click the link below to change your password:</b><br><br><a href="https://www.bemygenie.com/rpf?c=' + setval + '" >Change Password</a> <br><br> - Team Bemygenie.com',function(message,response) {
                res.end('mailsent');
              });
            }
            else {res.end("Error in FP")}
          })
        } else {
          res.end('mailsent');
        }
      }
    });
  }
  catch (e) {console.log("Error - "+e)}
})


app.get('/rpf', function (req,res){
  var fp = encodeURIComponent(req.query.c);
  var aux_passwordReset = bmgDB.collection('AUX_PASSRESET');
  aux_passwordReset.find({"FP": fp},{"_id":1,"email":1}).toArray(function(err,docs){
    if (!err) {
      if (docs.length) {
          res.render(__dirname + "/site/newPassword.ejs",{c : req.query.c});
      }
    }
  })

});

app.post('/setPassword', urlencodedParser, function (req,res){
  var aux_passwordReset = bmgDB.collection('AUX_PASSRESET');
  var profileDetails = bmgDB.collection('WishList');
  aux_passwordReset.find({"FP": req.body.c},{"_id":1,"email":1}).toArray(function(err,docs){
    if (!err) {
      if (docs.length) {
          profileDetails.update({$and:[{"HostEmail" : docs[0].email},{"Primary":1}]},{$set:{"KEY":req.body.h,"UPPU":req.body.s}}, function(err) {
            if (!err) {
              aux_passwordReset.remove({"FP": req.body.c}, function (err, result) {
                if (!err) {
                      res.send("success")
                }
              })
            }
            else {res.send("Error setting Password")}
          })
      }
    }
  })

});

//3/24/2017 - Created a get to /home.
app.post('/home',urlencodedParser, function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    console.log(getTimeStamp() + 'UserHome|' + req.connection.remoteAddress)
    res.render(__dirname + "/site/home.ejs",{userID : sha256(req.session.user),username: req.session.name});
    //console.log("call made to home.html with valid session " + req.session.user);
  } else {
    // If this is not a valid session then the user gets a message that the
    // session is not valid
    // At a later time, this should be a login page
    res.redirect('/');
  }
});

app.get('/invite_composer',urlencodedParser, function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    console.log(getTimeStamp() + 'InviteComposer|' + req.connection.remoteAddress)
    res.render(__dirname + "/site/invite_composer.ejs",{userID : sha256(req.session.user),username: req.session.name});
    //console.log("call made to home.html with valid session " + req.session.user);
  } else {
    // If this is not a valid session then the user gets a message that the
    // session is not valid
    // At a later time, this should be a login page
    res.redirect('/');
  }
});

app.get('/send_invite',urlencodedParser, function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    console.log(getTimeStamp() + 'SendInvite|' + req.connection.remoteAddress)
    res.render(__dirname + "/site/send_invite.ejs",{userID : sha256(req.session.user),username: req.session.name});
    //console.log("call made to home.html with valid session " + req.session.user);
  } else {
    // If this is not a valid session then the user gets a message that the
    // session is not valid
    // At a later time, this should be a login page
    res.redirect('/');
  }
});




app.get('/home', function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //rendering Home page with user ID
    // On load of the ejs file, it will use the user ID reference
    // To pick information about the user.
    res.render(__dirname + "/site/home.ejs",{userID : sha256(req.session.user),username: req.session.name});
    //console.log("call made to home.html with valid session " + req.session.user + req.session.name);
  } else {
    // If this is not a valid session then the user gets a message that the
    // session is not valid
    // At a later time, this should be a login page
    res.redirect('/');
  }
});

//trznt - 22/4/2017
//This get will retrieve all wishlist items based on the ID for display on the user's dashboard.
app.get('/getWishListItems', function (req,res) {
  // Checking if a valid session exists.
  if (req.session && req.session.user) {
    //console.log("call made to /getWishListItems with valid session " + req.session.user + req.session.name);
    try {
      var wishList = bmgDB.collection('WishList');
      wishList.find({"wid":req.query.wid,"uid":req.query.uid},{_id:0,Products:1,wid:1,uid:1}).toArray(function(err,docs) {
        var product = bmgDB.collection('Product');
        WaterfallOver(docs[0].Products,function (prod, report) {
            product.find({"_id" : new ObjectId(prod._id)}).toArray(function (err,pdocs) {
              prod["ProdData"] = pdocs;
              report();
            });
          }, function (){
            //console.log(JSON.stringify(docs[0]));
            res.send(docs[0]);
        });
      });
    }
    catch (e) {console.log("Error - " +e);res.send({"Products": []});}
  } else {
    res.end("Invalid request");
  }
});


app.get('/getUserWishLists', function (req,res) {
  var wishlistCollection = bmgDB.collection('WishList');
  //console.log("getting wishlist for " + sha256(req.query.userid) + req.query.mode);
  //We only return pertinent information such as the event names, types and open/closed registries
  wishlistCollection.find({$and: [{"uid": req.query.userid},{"EventStatus": parseInt(req.query.mode)}]},{"wid":1,"uid":1,"EventName":1,"EventType":1,"EventStatus":1,"EventDate":1,"event_id":1,"notification_sent":1}).toArray(function(err,docs){
    if (!err) {
      if (docs.length) {
        res.format({'application/json': function(){res.send(docs)}})
      }
      else {
        var nothing = [];
        res.format({'application/json': function(){res.send(nothing)}})
      }
    }
  });
});

app.post('/saveProfileChanges',urlencodedParser, function (req,res) {
  //console.log("Name is " + req.body.hostname);
  if (req.session && req.session.user) {
    var wishlistCollection = bmgDB.collection('WishList');
    wishlistCollection.update({"uid" : req.body.uid},{$set:{"HostName":req.body.hostname,"HostPhone":req.body.hostphone}}, function(err) {
      if (!err) {res.redirect('/home');}
      else {res.send("Error in updating product status")}
    })
    req.session.name = req.body.hostname;
  }
});

app.get('/getUserProfileDetails', function (req,res) {
  var profileDetails = bmgDB.collection('WishList');
  profileDetails.find({$and: [{"uid": req.query.userid},{"Primary" : 1}]},{"uid":1,"HostName":1,"HostPhone":1,"HostEmail":1}).toArray(function(err,docs){
    if (!err) {
      if (docs.length) {
        res.format({'application/json': function(){res.send(docs)}})
      }
      else {
        var nothing = [];
        res.format({'application/json': function(){res.send(nothing)}})
      }
    }
  });
});


app.get('/srchProductByName',function(req,res){
  try {
    var prdCollection = bmgDB.collection('Product');
    var srchStr = req.query.ProdNm;

    prdCollection.find({"ProdNm" : {$regex : new RegExp(srchStr,"i")},"InStock":1}).toArray(function(err,docs){
        if (!err){
        if (docs.length == 0) {
          console.log("no products found, calling amazon");
          getProductsFrmAmzn(req,function(err,docs) {
            if (err) {res.send("Error in fetching products")}
            else {
              //console.log("Doc.ProdNm "+docs[0].ProdNm);
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
    var search_index = req.query.ProdGrp;
    //console.log("Search Index : "+search_index);
    var resJSON;
    var vJSON = [];
    var itempage = parseInt(req.query.PageNumber);
    //console.log("query = "+JSON.stringify(req.query));
    var canonical_query_string;
    if (req.query.min == "-1" && req.query.max == "-1") {
    canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&AssociateTag=" + associate_tag +
                                  "\&Availability=Available"+"\&ItemPage=" + itempage +"\&Keywords=" +
                                  encodeURIComponent(req.query.ProdNm) + "\&Operation=" + operation + "\&ResponseGroup=" +
                                  encodeURIComponent(response_group) + "\&SearchIndex=" + search_index + "\&Service=" + service +
                                  "\&Timestamp=" + encodeURIComponent(new Date().toISOString());
    }
    else if (req.query.min == "3000" && req.query.max == "-1") {
    canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&AssociateTag=" + associate_tag +
                                  "\&Availability=Available"+"\&ItemPage=" + itempage +"\&Keywords=" +
                                  encodeURIComponent(req.query.ProdNm) + "\&" + "MinimumPrice=" + 300000 + "\&" + "Operation=" + operation + "\&ResponseGroup=" +
                                  encodeURIComponent(response_group) + "\&SearchIndex=" + search_index + "\&Service=" + service +
                                  "\&Timestamp=" + encodeURIComponent(new Date().toISOString());
    }
    else {
    canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&AssociateTag=" + associate_tag +
                                  "\&Availability=Available"+"\&ItemPage=" + itempage +"\&Keywords=" +
                                  encodeURIComponent(req.query.ProdNm) + "\&" +"MaximumPrice=" + (parseInt(req.query.max) * 100) +
                                  "\&" + "MinimumPrice=" + (parseInt(req.query.min) * 100) + "\&" + "Operation=" + operation + "\&ResponseGroup=" +
                                  encodeURIComponent(response_group) + "\&SearchIndex=" + search_index + "\&Service=" + service +
                                  "\&Timestamp=" + encodeURIComponent(new Date().toISOString());
    }

    var string_to_sign = "GET\n" + end_point + "\n" + uri + "\n" + canonical_query_string;
    //console.log("string to sign - "+string_to_sign);
    //console.log("secret key - "+aws_secret_key);
    var hash = crypto.createHmac('sha256', aws_secret_key).update(string_to_sign).digest('base64');
    //console.log("hash - "+hash);
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
      if (error) {console.log("Error message = " + error.message);callback(true,[])}

      response.setEncoding('utf8');
      response.on('data', (chunk) => rawData += chunk);
      response.on('end', () => {
      try {
          parseString(rawData,function(err,resJSON) {
            if (err) {console.log("Error in converting to json" + rawData)}
            else {
              if (typeof resJSON.ItemSearchResponse.Items[0].Item === 'undefined') {vJSON = []}
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
        catch (e) {console.log(e.message);}
      });
   }).on('error', (e) => {console.log('Got error: ${e.message} - '+e.message);}); //end of http.get
  }
  catch (e) {console.log("Error - ");callback(true,[])}
}

app.get('/New-Cart.html',function(req,res){
  console.log(getTimeStamp() + 'New-Cart|' + req.connection.remoteAddress)
  res.sendFile(__dirname+"/site/New-Cart.html");
  //console.log("Accessing New-Cart.html");
});

app.get('/showWishList',function(req,res) {
  var qryStr = req.query.eventID;
  var uid = req.query.u;
  console.log(getTimeStamp() + 'showWishList|' + req.connection.remoteAddress);
  res.render(__dirname+"/site/showWishList.ejs",{eventID : qryStr, uid_val : uid});
});

app.post('/invitesNotSent',function(req,res) {
  try {
    console.log(getTimeStamp() + 'invitesNotSent|' + req.connection.remoteAddress);
    var wishList = bmgDB.collection('WishList');
    wishList.find({"TmpltId":{$ne:null},"invExp":"N"},{event_id:1,TmpltId:1}).toArray(function(err,docs) {
      if (!err) {
        if (docs.length == 0) {res.send({})}
        else {
          //console.log(JSON.stringify(docs));
          res.send(docs);
        }
      } //!err
      else {console.log(err+'|'+req.connection.remoteAddress)}
    })
  }
  catch (e) {
    console.log(e+'|'+req.connection.remoteAddress);
  }
})

app.post('/filterWishListByCatg',function(req,res){
  try {
    var wishList = bmgDB.collection('WishList');
    var qryStr = JSON.parse(req.body.criteria);
    var eventID = qryStr.eventID;
    var cnt = qryStr.catgCount;
    var catg = qryStr.Catg;
    //console.log('checking uid' + qryStr.uid)
    var prodArr = [];
    wishList.find({"uid":qryStr.uid,"wid":qryStr.eventID},{_id:0,Products:1}).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {
          res.send({});
        }
        else {
          res.format({'application/json': function(){
            //console.log('Count is ' + cnt);
            if (cnt == 0) {
              //console.log('Count is ' + cnt);
              var product = bmgDB.collection('Product');
              WaterfallOver(docs[0].Products,function (prod, report) {
                //console.log('Product is ' + JSON.stringify(prod));
                  product.find({"_id" : new ObjectId(prod._id),"InStock" : 1}).toArray(function (err,pdocs) {
                    if (pdocs.length != 0) {
                      prodArr.push(pdocs[0])
                      report();
                    }
                    else {
                      prod["ProdData"] = [];
                      report();
                    }
                  });
                }, function (){
                  if (prodArr.length == 0) {
                    res.send("No matching products found")}
                  else {
                    res.send(prodArr)
              }})
            } else {
              var product = bmgDB.collection('Product');
              //console.log('Products is ' + JSON.stringify(docs[0].Products));
              WaterfallOver(docs[0].Products,function (prod, report) {
                //console.log('Prod is ' + JSON.stringify(prod));
                  product.find({"_id" : new ObjectId(prod._id),"InStock" : 1}).toArray(function (err,pdocs) {
                    if (pdocs.length != 0) {
                      if (catg.indexOf(pdocs[0].Catg) != -1) {
                        prodArr.push(pdocs[0])
                      }
                      report();
                    }
                    else {
                      prod["ProdData"] = [];
                      report();
                    }
                  });
                }, function (){
                  if (prodArr.length == 0) {
                    res.send("No matching products found")}
                  else {
                    res.send(prodArr)
              }});
            }


          }
        })
      }
    }
    });
  }
  catch (e) {console.log("Error - "+e);console.log('Data is ' + req.body.criteria)}
}); //filter wishlist by category

app.get('/showListProducts',function(req,res){
  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  var u = req.query.u;
  try {
    wishList.find({"wid":qryStr,"uid":u},{_id:0,Products:1,wid:1,uid:1}).toArray(function(err,docs) {
      if (!err){
        var product = bmgDB.collection('Product');
        WaterfallOver(docs[0].Products,function (prod, report) {
            product.find({"_id" : new ObjectId(prod._id),"InStock" : 1}).toArray(function (err,pdocs) {
              //console.log("pdocs" + pdocs.length);
              if (pdocs.length != 0) {
                prod["ProdData"] = pdocs;
                report();
              }
              else {
                prod["ProdData"] = [];
                report();
              }
            });
          }, function (){
            //console.log(JSON.stringify(docs[0]));
            res.format({'application/json': function(){res.send(docs[0].Products)}})
        });
      }
        else {res.send("Unable to find desired wishlist.")}
    });
  }
  catch (e) {res.send(e)}
}); //showListProducts

app.get('/getEventInfo',function(req,res){
  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  var uid = req.query.u;
  //console.log(qryStr + ' and ' + uid)
  try {
    wishList.find({"wid" : qryStr,"uid" : uid},{_id:0,EventName:1,HostName:1,wishlistMsg:1}).toArray(function(err,docs) {
      if (!err){
      if (docs.length == 0) {res.send("Unable to find the desired wishlist")}
      else {res.format({'application/json': function(){res.send(docs[0])}})}
      }
      else {res.send("Error in fetching documents")}
    });
  }
  catch (e) {res.send(e)}
}); //showListProducts



app.get('/new_registry', function (req,res){
  console.log(getTimeStamp() + 'NewReg|' + req.connection.remoteAddress)
  res.sendFile(__dirname + "/site/new_registry.html");
  //console.log("call made to new_registry.html");
});

app.post('/getsalt',urlencodedParser,function(req,res) {
  req.session.email = null;
  req.session.user = null;
  res.end(rand(160,36));
});


app.post('/getPasswordChangeSalt',urlencodedParser,function(req,res) {
  //console.log("session user is " + req.session.user);
  res.end(rand(160,36));
});

app.post('/saveNewPassword', urlencodedParser, function (req, res){
  var wishlistCollection = bmgDB.collection('WishList');
  //console.log("changedPassData is" + req.body.changedPassData)
  var passData = JSON.parse(req.body.changedPassData);
  //console.log("User for which password gonna be changed is is" + passData.user + req.session.user)
  var hashed = sha256(req.session.user);
  if (hashed == passData.user) {
    wishlistCollection.update({$and:[{"uid" : hashed},{"Primary":1}]},{$set:{"KEY":passData.Password,"UPPU":passData.Uppu}}, function(err) {
      if (!err) {
        //console.log("Password changed to :" + passData.Password);
        //console.log("uppu changed to :" + passData.Uppu);
        res.send("Success.")
      }
      else {res.send("Error in updating product status")}
    })
  }
});

app.post('/changePassword',urlencodedParser, function (req, res){
  //console.log("Performing login with " +  req.body.attempt + " " + req.body.gensalt);
  var wishList = bmgDB.collection('WishList');
  //console.log("Session Id" + sha256(req.body.email));
  try {
    wishList.find({"uid" : sha256(req.body.email), "Primary" : 1},{_id:0,KEY:1,HostName:1}).toArray(function(err,docs) {
      if (!err){
        //console.log('into the log')
        if (docs.length == 0) {res.end("")}
        else {
          //console.log("Key from DB is " + docs[0].KEY);
          var trypass = sha256(req.body.gensalt + docs[0].KEY);
          //console.log("Try Pass is " + trypass);
          if (req.body.attempt == trypass) {
            req.session.user = req.body.email;
            req.session.name = docs[0].HostName;
            //console.log("session user is " + req.session.user);
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

app.post('/plogin',urlencodedParser,function(req,res){
  //console.log("Performing login with " +  req.body.attempt + " " + req.body.gensalt);

  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  try {
    wishList.find({"uid" : req.body.user},{_id:0,KEY:1,HostName:1}).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {res.end("")}
        else {
          //console.log("Key from DB is " + docs[0].KEY);
          var trypass = sha256(req.body.gensalt + docs[0].KEY);
          //console.log("Try Pass is " + trypass);
          if (req.body.attempt == trypass) {
            req.session.user = req.body.email;
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

app.post('/pAdminLogin',urlencodedParser,function(req,res){
  //console.log("Performing login with " +  req.body.attempt + " " + req.body.gensalt);

  var adminuser = bmgDB.collection('AdminUser');
  try {
    adminuser.find({"username" : req.body.user},{_id:0,hash:1,username:1}).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {console.log("no user named" + req.body.user);res.end("No user")}
        else {
          //console.log("Key from DB is " + docs[0].hash);
          var trypass = sha256(req.body.gensalt + docs[0].hash);
          //console.log("Try Pass is " + trypass);
          if (req.body.attempt == trypass) {
            req.session.adminUser = docs[0].username;
            res.end("Login Success");
          } else {
            //console.log(req);
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
  //console.log(req.body.user);
  var wishList = bmgDB.collection('WishList');
  var qryStr = req.query.eventID;
  try {
    wishList.find({"uid" : req.body.user},{_id:0,HostEmail:1,UPPU:1}).toArray(function(err,docs) {
      if (!err){
      if (docs.length == 0) {res.end("")}
      else {res.end(docs[0].UPPU)}
      }
      else {res.end("Error in fetching documents")}
    });
  }
  catch (e) {res.end(e)};
});

app.post('/getSaltForAdminUser',urlencodedParser,function(req,res) {
  //console.log(req.body.user);
  var adminUser = bmgDB.collection('AdminUser');
  try {
    adminUser.find({"username" : req.body.user},{_id:0,username:1,UPPU:1}).toArray(function(err,docs) {
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
  if ((req.session && req.session.adminUser)) {
    res.sendFile(__dirname+"/site/product_loader.html");
  } else {
    //console.log(req);
    res.end("Un-Autorized Access. This request will be logged.");
  }

});



app.get('/featured_product_configuration',function(req,res){
  if ((req.session && req.session.adminUser)) {
    res.sendFile(__dirname+"/site/featured_products.html");
  } else {
    //console.log(req);
    res.end("Un-Autorized Access. This request will be logged.");
  }

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
  if (list.length != 0)
    iterator(list[0], report);
  else
    callback();
}

app.post('/saveFeaturedList',urlencodedParser, function (req,res){
  //console.log(req.body.remove + "and" + req.body.add);

  var temp_add_array = req.body.add.split("|");
  var add_array = [];
  for (var i = 0; i < temp_add_array.length -1;i++) {
    add_array[i] = temp_add_array[i];
  }

  var temp_rem_array = req.body.remove.split("|");
  var rem_array = [];
  for (var i = 0; i < temp_rem_array.length -1;i++) {
    rem_array[i] = temp_rem_array[i];
  }

  //console.log("rem array lengt" + rem_array.length)

  var prodCollection = bmgDB.collection('Product');

  WaterfallOver(add_array,function (val,report){
      prodCollection.update({"_id" : new ObjectId(val)},{$set:{"featured":req.body.eventType}}, function(err) {
        if (!err) {report();}
        else {console.log("Error in updating product status")}
      });
    },function() {
      WaterfallOver(rem_array,function (val,report){
          prodCollection.update({"_id" : new ObjectId(val)},{$unset:{"featured":req.body.eventType}}, function(err) {
            if (!err) {report();}
            else {console.log("Error in updating product status")}
          });
        },function() {
          //console.log("Work Done");
          res.end("Posted");
        });
    });

});

app.post('/load_to_db',urlencodedParser,function(req,res){
  if ((req.session && req.session.adminUser)) {
    //console.log(req.body.array);
    var prods = JSON.parse(req.body.array);
    var collection = bmgDB.collection("Product");
    if (prods.values.length == 0) //nothing to add.
      res.end("Added0");
    WaterfallOver(prods.values, function (val, report) {
      collection.find({"ProdID":val.ProdID}).toArray(function (err,data) {
          if(data.length == 0) {
            val.AddDate = new Date();
            val.UpdDate = new Date(val.AddDate);
            val['created_by'] = req.session.adminUser;
            collection.insert(val, function (err,result) {
              //console.log("inserted" + result);
            });
          } else {
            //console.log("data not inserted");
          }
          report();
        })}, function() {
          //console.log("insert complete");
          res.end("Posted");
        });
      }
      else {
        res.end('Unauthorized Access')
      }
});



app.get('/logout',function (req,res) {
  if ((req.session && req.session.user)) {
    req.session.user = null;
    req.session.name = null;
    res.end("Log-off success");
  } else {
    res.end("unable to logoff");
  }

});

app.get('/admin_logout',function (req,res) {
  if ((req.session && req.session.adminUser)) {
    req.session.adminUser = null;
    res.end("Log-off success");
  } else {
    //console.log(req);
    res.end("Un-Autorized Access. This request will be logged.");
  }

});


app.get('/getFeaturedProducts', function (req,res){
  var prdCollection = bmgDB.collection('Product');
  //var qryStr = JSON.parse(req.body.Catg);
  //console.log("Query String - "+qryStr);
  //var count = qryStr.catgCount;
  //var evenTypeStr = qryStr.eventType;
  //console.log("Event Type : "+evenTypeStr);
  //console.log("Count : "+qryStr.catgCount);
  //console.log("Category Array : "+qryStr.category);
  //console.log(req.query.event);

  if (req.query.event != 'Special Category') {
    prdCollection.find({$and: [{"eventType":{$elemMatch:{$eq:req.query.event}}},{"featured":req.query.event},{"InStock" : 1}]}).sort({ AddDate : -1 }).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {res.send()}
        else {res.format({'application/json': function(){res.send(docs)}})}
      }
      else {console.log(err);res.send("Error in fetching documents")}
    })
  } else {
    prdCollection.find({$and: [{"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}}},{"featured":req.query.event},{"InStock" : 1}]}).sort({ AddDate : -1 }).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {res.send()}
        else {res.format({'application/json': function(){res.send(docs)}})}
      }
      else {console.log(err);res.send("Error in fetching documents")}
    })
  }


});


app.get('/getAllProdsForCatPaged', function (req,res){
  var prdCollection = bmgDB.collection('Product');
  //var qryStr = JSON.parse(req.body.Catg);
  //console.log("Query String - "+qryStr);
  //var count = qryStr.catgCount;
  //var evenTypeStr = qryStr.eventType;
  //console.log("Event Type : "+evenTypeStr);
  //console.log("Count : "+qryStr.catgCount);
  //console.log("Category Array : "+qryStr.category);
  //console.log(req.query.event);

  if (req.query.event != 'Special Category') {
    prdCollection.find({$and:[{"eventType":{$elemMatch:{$eq:req.query.event}}},{featured:{$exists: false }},{"InStock":1}]}).sort({ AddDate : -1 }).skip(parseInt(req.query.skip)).limit(parseInt(req.query.prod_per_page)).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {res.send()}
        else {res.format({'application/json': function(){res.send(docs)}})}
      }
      else {console.log(err);res.send("Error in fetching documents")}
    })
  } else {
    prdCollection.find({$and:[{"eventType":{$elemMatch:{$in:['Birthday','Anniversary','Wedding','House Warming','Farewell']}}},{featured:{$exists: false }},{"InStock":1}]}).sort({ AddDate : -1 }).skip(parseInt(req.query.skip)).limit(parseInt(req.query.prod_per_page)).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0) {res.send()}
        else {res.format({'application/json': function(){res.send(docs)}})}
      }
      else {console.log(err);res.send("Error in fetching documents")}
    })
  }


});

app.get('/sendmail', function (req,res) {

  bmgaux.mailer(emailPassword,'support','test_user@hotmail.com','a new trial','<b> check out the cool body</b>',function(message,response) {
    res.send('{"Message": "' + message + '","Response":"' + response + '"}');
  });

});

app.post('/verifyRecaptcha',urlencodedParser,function(req,res){
  //console.log('checking captcha');
  var captchaRes=req.body.Response;
  request ({uri : googleSiteVerify,
    method : 'POST',
    json : true,
    form : {secret : captchaSecret,response : captchaRes}
  }, function(error,response,body) {
    //console.log('Captcha:' + error + " - " + JSON.stringify(response) + " - " + JSON.stringify(body));
    res.send(response.body);
  })
})

app.post('/saveMessage', urlencodedParser, function (req,res){
  var wishList = bmgDB.collection('WishList');
  //console.log(req.body.id  + req.body.message + req.body.uid)
  wishList.update({"wid" : req.body.id,"uid":req.body.uid},{$set:{"wishlistMsg":req.body.message}}, function(err) {
    if (!err) {res.send("Success");console.log('success');}
    else {res.send("Error in updating wishlist message");console.log('Error ' + err)}
  })
});

app.get('/checkIfEmailExists',function (req,res) {
  var wishList = bmgDB.collection('WishList');
  try {
    wishList.find({$and: [{"HostEmail": req.query.email},{"Primary" : 1}]},{_id:0,KEY:1,HostName:1}).toArray(function(err,docs) {
      if (!err){
        if (docs.length == 0)
          res.end("EmailDoesNotExist")
        else
          res.end("EmailExists");
      }
      else {res.end("Error in fetching documents")}
    });
  }
  catch (e) {res.end(e)};

});

app.get('/get_amazon',function (req,res) {
  //console.log("Page is " + req.query.pageNumber);
  //console.log("String is " + req.query.searchString);
  //console.log("Cat is " + req.query.searchCat);
  /// The following attribute needs to come in from the web browser based on what is selected.
  var mxprice = req.query.max;
  var mnprice = req.query.min;
  var search_index = req.query.searchCat;
  var keywords = req.query.searchString;

  ////////////////////////////////////////////////////////////////////////////////////////////////


  //The following entries are mostly static fields, that can be changed as part of a strategic change.
  var multiplier = 100;
  //var amazon_end_point = "http://webservices.amazon.in";
  //var end_point = "webservices.amazon.in";
  //var uri = "/onca/xml";
  var itempage = parseInt(req.query.pageNumber);
  var operation = "ItemSearch"
  var response_group = "Images,ItemAttributes,Offers";  //Stricly no spaces only commas.
  var service="AWSECommerceService";
  var sort="price";
  var maxprice = parseInt(mxprice) * multiplier;
  var minprice = parseInt(mnprice) * multiplier;
  //////////////////////////////////////////////////////////////////////


  ////Constructing Canonical String for the query string to AMZ Aff.////
  ////PLEASE Note that this string should have query parameters in alphabetical order.
  if (search_index != "All")
    var canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&" +
    "AssociateTag=" + associate_tag + "\&" + "ItemPage=" + itempage + "\&" + "Keywords=" + encodeURIComponent(keywords) + "\&" + "MaximumPrice=" + maxprice +
    "\&" + "MinimumPrice=" + minprice + "\&" + "Operation=" + operation + "\&" + "ResponseGroup=" + encodeURIComponent(response_group) +
    "\&" + "SearchIndex=" + search_index + "\&" + "Service=" + service + "\&" + "Sort=" + sort + "\&" +"Timestamp=" + encodeURIComponent(new Date().toISOString());
  else
  ///////////////////////////////////////////////////////////////////////
    var canonical_query_string = "AWSAccessKeyId=" + aws_access_key_id + "\&" +
    "AssociateTag=" + associate_tag + "\&" + "ItemPage=" + itempage + "\&" + "Keywords=" + encodeURIComponent(keywords) + "\&" + "MaximumPrice=" + maxprice +
    "\&" + "MinimumPrice=" + minprice + "\&" + "Operation=" + operation + "\&" + "ResponseGroup=" + encodeURIComponent(response_group) +
    "\&" + "SearchIndex=" + search_index + "\&" + "Service=" + service + "\&" +"Timestamp=" + encodeURIComponent(new Date().toISOString());

  /////////////Creating a string which will be signed with our amazon secret key
  var string_to_sign = "GET\n" + end_point + "\n" + uri + "\n" + canonical_query_string;
  //////////////////////////////////////////////////////////////////////////////////////
  //console.log("String to sign" + string_to_sign);

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
