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



function sendEmailFor(item,report,retry) {
  var templateDir = __dirname + '/email_templates/saved/';
  bmgaux.mailerWithAttachments(emailPassword,'support',item.email,item.username + ' has invited you to a party!','<b>This is the body</b><br><br> - Team Bemygenie.com',templateDir + item.event_id + ".png", function(message,response) {
    console.log('mail reponse is ' + response);
    report();
  });
}

function updateAUXMAiler(item2,report2) {
  var aux_invite_mailer = bmgDB.collection('AUX_INVITE_MAILER');
  aux_invite_mailer.update({"_id" : new ObjectId(item2._id)},{$set:{"sent":1}}, function(err) {
    if (!err) {report2();}
    else {console.log("Error in updating aux_mailer status" + err)}
  });
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

        var package = [];
        var packet = {};



        var aux_mailers = bmgDB.collection('AUX_INVITE_MAILER');

        aux_mailers.find({"sent":0}).toArray(function(err,prods) {
          if (!err) {
            WaterfallOverRetry(prods,function(item,report,retry){
                sendEmailFor(item,report,retry);
              },function(){
                WaterfallOver(prods,function(item2,report2){
                    updateAUXMAiler(item2,report2);
                  },function(){
                    console.log("alldone");
                })
            })
          }

        });
        //console.log('host is ' + urlHost)



      }
    });
  }
  else {
    console.log("Error in connection"+err);
  }

});

console.log('This is dog');
