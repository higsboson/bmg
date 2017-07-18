module.exports.test = function() {
  console.log('this is test');
}

module.exports.randomString = function() {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var length = 9;
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

module.exports.mailer = function(pass,from,to,subject,body,callback) {

  //encoding from:

  if (from == "support") {
    from = '"BMG Support" <no_reply@bemygenie.com>';
  }

  console.log('sending email');
  var nodemailer = require('nodemailer');

  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport({
      service: 'Zoho',
      auth: {
          user: 'no_reply@bemygenie.com',
          pass: pass
      }
  });

  // setup email data with unicode symbols
  var mailOptions = {
      from: from, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      generateTextFromHTML: true,
      html: body // html body
  };

  function sendingTheEmail(tporter,callback) {
    tporter.sendMail(mailOptions, function(error, info){
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        //console.log(response);
        callback(info.messageId,info.response);
    });
  }

  //sendingTheEmail(transporter, function(message,response) {res.end('Message %s sent: %s', message, response)})

  //250 Message received
  sendingTheEmail(transporter, callback);
}


module.exports.bccmailer = function(pass,from,to,subject,body,callback) {

  //encoding from:

  if (from == "support") {
    from = '"BMG Support" <no_reply@bemygenie.com>';
  }

  console.log('sending email');
  var nodemailer = require('nodemailer');

  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport({
      service: 'Zoho',
      auth: {
          user: 'no_reply@bemygenie.com',
          pass: pass
      }
  });

  // setup email data with unicode symbols
  var mailOptions = {
      from: from, // sender address
      bcc: to, // list of receivers
      subject: subject, // Subject line
      generateTextFromHTML: true,
      html: body // html body
  };

  function sendingTheEmail(tporter,callback) {
    tporter.sendMail(mailOptions, function(error, info){
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        //console.log(response);
        callback(info.messageId,info.response);
    });
  }

  //sendingTheEmail(transporter, function(message,response) {res.end('Message %s sent: %s', message, response)})

  //250 Message received
  sendingTheEmail(transporter, callback);
}
