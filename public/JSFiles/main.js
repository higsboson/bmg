  // Added for all date calculations
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  var signuporlogin = "";

  function setReminder() {
    $('#set_reminder').modal('show');
  }

  function quickSearch() {
    $('#createRegHolder').html('');
    if ($('#quickSearchVal').val() == "") {
      $('#modalMessage').html('Please type in the name of the item that you are looking for.');
      $('#validateModal').modal('show');
    }
    else {
      $('#qSearchResults').html('<i class="fa fa-circle-o-notch fa-spin" style="font-size:100px;"></i>');
      $('#qSearchResults').css('overflow','hidden');
      $('#qSearchResults').show();
      doAWSSearch(clean($('#quickSearchVal').val()));
    }
    //alert('searching' + $('#quickSearchVal').val());
  }

  function doAWSSearch(item) {
    $('#quickSearchButton').prop('disabled',true);
    $.get(
      "/get_amazon",{pageNumber: 1,searchString: item, searchCat: "All", min: 0, max: 10000000},
      function(data) {
          if (data === "error") {
            $('#preview').html('');
            //alert("There has been an error loading the search results. Please try again");
          } else {
            txt = "";
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(data,"text/xml");
            if (xmlDoc.getElementsByTagName("IsValid")[0].childNodes[0].nodeValue !== "True") {
              $('#preview').html('');
              //alert("The amazon search request was invalid." + xmlDoc.getElementsByTagName("Message")[0].childNodes[0].nodeValue);
              showErrorModal('Serious Error',"The search request was invalid. Error Code: " + xmlDoc.getElementsByTagName("Message")[0].childNodes[0].nodeValue);
            } else {
              if (typeof xmlDoc.getElementsByTagName("Error")[0] !== 'undefined') {
                $('#qSearchResults').html('<p style="font-size:20px">Unfortunately, we were unable to find any results for that search. Why not search for something else.</p>');
                //$('#qSearchResults').css('overflow','scroll');
                //$('#createRegHolder').html('<a class="btn btn-lg btn-warning" style="font-family: \'Rochester\', cursive;font-size:24px;font-weight:bold;text-shadow: 1px 1px 2px black" href="#" role="button" onclick="checkEvents();">Create my Registry!</a>');
                setTimeout(function(){ $('#quickSearchButton').prop('disabled',false); }, 1000);
                //window.location.href = "/product_loader";
              } else {
                //alert('data is ' + xmlDoc);
                var x = xmlDoc.getElementsByTagName("Item");
                //alert('Total items is ' + x.length);
                var results = "<table class='findProd'><tr>";
                var i = 0;
                for (i = 0; i < x.length; i++) {
                  //alert('loop ' + i);
                  if (typeof x[i].getElementsByTagName("ItemAttributes")[0].getElementsByTagName("ListPrice")[0] !== 'undefined') {
                    //alert('reg-loop');
                    results += '<td><div class="findProd" style="background-color:#ffffff;margin:10px;color:#2B6A7A;">';
                    var updatedTitle = "";
                    var title = x[i].getElementsByTagName("ItemAttributes")[0].getElementsByTagName("Title")[0].childNodes[0].nodeValue;
                    if (title.length > 30) {
                      //alert('size greater than 30');
                      var dislaydata = title.substring(0,27);
                      dislaydata += "...";
                      var condensed_array = title.split(' ').join('_ ').split(' ');
                      var condensed = "";
                      var linelength = 0;;
                      for (var n = 0;n < condensed_array.length;n++) {
                        if ((condensed_array[n].length + linelength) < 30) {
                          condensed += condensed_array[n];
                          linelength += condensed_array[n].length;
                        } else {
                          linelength = condensed_array[n].length;
                          condensed = condensed + '<br>' + condensed_array[n];
                        }
                      }
                      updatedTitle += '<div class="tooltip2">' + dislaydata + '<span class="tooltiptext">' + condensed.split('_').join(' ') + '</span></div>'
                    } else {
                      updatedTitle += "<div>" + title + "</div>";
                    }

                    results += '<br>' + updatedTitle;
                    var image_url;
                    if (typeof x[i].getElementsByTagName("MediumImage") === 'undefined') {
                        console.log('This is severe image problem');
                        image_url = x[i].getElementsByTagName("ImageSets")[0].getElementsByTagName("ImageSet")[0].getElementsByTagName("MediumImage")[0].getElementsByTagName("URL")[0].childNodes[0].nodeValue;
                    } else if (typeof x[i].getElementsByTagName("MediumImage")[0] !== 'undefined' || x[i].getElementsByTagName("MediumImage")[0] === null) {
                        image_url = x[i].getElementsByTagName("MediumImage")[0].getElementsByTagName("URL")[0].childNodes[0].nodeValue;
                    } else {
                      image_url = '/images/no_image_available.png';
                    }
                    results += '<div style="padding:10px;"></div><div class="featured-image" style="background:url(\'' + image_url + '\') no-repeat center center;display:inline-block" ></div>';
                    var price = x[i].getElementsByTagName("ItemAttributes")[0].getElementsByTagName("ListPrice")[0].getElementsByTagName("FormattedPrice")[0].childNodes[0].nodeValue.split(' ');
                    results += '<br> &#8377;' + price[1];
                    results += '</div></td>';
                  }
                  else if (typeof x[i].getElementsByTagName("OfferSummary")[0] !== 'undefined') {
                    //alert('irreg-loop' + x[i].getElementsByTagName("OfferSummary"));
                    results += '<td><div class="findProd" style="background-color:#ffffff;margin:10px;color:#2B6A7A;">';
                    var updatedTitle = "";
                    var title = x[i].getElementsByTagName("ItemAttributes")[0].getElementsByTagName("Title")[0].childNodes[0].nodeValue;
                    //alert(title);
                    if (title.length > 30) {
                      //alert('size greater than 30');
                      var dislaydata = title.substring(0,27);
                      dislaydata += "...";
                      var condensed_array = title.split(' ').join('_ ').split(' ');
                      var condensed = "";
                      var linelength = 0;;
                      for (var n = 0;n < condensed_array.length;n++) {
                        if ((condensed_array[n].length + linelength) < 30) {
                          condensed += condensed_array[n];
                          linelength += condensed_array[n].length;
                        } else {
                          linelength = condensed_array[n].length;
                          condensed = condensed + '<br>' + condensed_array[n];
                        }
                      }
                      updatedTitle += '<div class="tooltip2">' + dislaydata + '<span class="tooltiptext">' + condensed.split('_').join(' ') + '</span></div>'
                    } else {
                      updatedTitle += "<div>" + title + "</div>";
                    }

                    results += '<br>' + updatedTitle;
                    var image_url;
                    if (typeof x[i].getElementsByTagName("MediumImage") === 'undefined') {
                        console.log('This is severe image problem');
                        image_url = x[i].getElementsByTagName("ImageSets")[0].getElementsByTagName("ImageSet")[0].getElementsByTagName("MediumImage")[0].getElementsByTagName("URL")[0].childNodes[0].nodeValue;
                    } else if (typeof x[i].getElementsByTagName("MediumImage")[0] !== 'undefined' || x[i].getElementsByTagName("MediumImage")[0] === null) {
                        image_url = x[i].getElementsByTagName("MediumImage")[0].getElementsByTagName("URL")[0].childNodes[0].nodeValue;
                    } else {
                      image_url = '/images/no_image_available.png';
                    }
                    results += '<div style="padding:10px;"></div><div class="featured-image" style="background:url(\'' + image_url + '\') no-repeat center center;display:inline-block" ></div>';
                    var price = x[i].getElementsByTagName("OfferSummary")[0].getElementsByTagName("LowestNewPrice")[0].getElementsByTagName("FormattedPrice")[0].childNodes[0].nodeValue.split(' ');
                    results += '<br> &#8377;' + price[1];
                    results += '</div></td>';
                  } else {
                    continue;
                  }

                }
                if (i == 0) {
                  $('#qSearchResults').html('<p style="font-size:20px">Unfortunately, we were unable to find any results for that search. Why not search for something else.</p>');
                  //$('#qSearchResults').css('overflow','scroll');
                  //$('#createRegHolder').html('<a class="btn btn-lg btn-warning" style="font-family: \'Rochester\', cursive;font-size:24px;font-weight:bold;text-shadow: 1px 1px 2px black" href="#" role="button" onclick="checkEvents();">Create my Registry!</a>');
                  setTimeout(function(){ $('#quickSearchButton').prop('disabled',false); }, 1000);
                } else {
                  $('#qSearchResults').html(results + '</tr></table>');
                  $('#qSearchResults').css('overflow','scroll');
                  $('#createRegHolder').html('<a class="btn btn-lg btn-warning" style="font-family: \'Rochester\', cursive;font-size:24px;font-weight:bold;text-shadow: 1px 1px 2px black" href="#" role="button" onclick="checkEvents();">Create my Registry!</a>');
                  setTimeout(function(){ $('#quickSearchButton').prop('disabled',false); }, 1000);
                }
              }
            }
          }
        });
  }

  function showReminderDate(){
    $('#datepicker').focus();
    setTimeout(function(){
      $('#ui-datepicker-div').css('z-index', '9999');
    }, 500);
  }

  function saveReminder() {
    if ($('#reminder_name').val() == "") {
      document.getElementById("modalMessage").innerHTML = "Please provide a valid name.";
      $('#set_reminder').modal('hide');
      $("#validateModal").modal('show');
      return;
    }
    if ($('#reminder_email').val() == "") {
      document.getElementById("modalMessage").innerHTML = "Please provide a valid email.";
      $('#set_reminder').modal('hide');
      $("#validateModal").modal('show');
      return;
    }
    if (!validateEmail($('#reminder_email').val())) {
      document.getElementById("modalMessage").innerHTML = "Please provide a valid email.";
      $('#set_reminder').modal('hide');
      $("#validateModal").modal('show');
      return;
    }
    if ($('#datepicker').val() == "") {
      document.getElementById("modalMessage").innerHTML = "Please provide a valid date in the future.";
      $('#set_reminder').modal('hide');
      $("#validateModal").modal('show');
      return;
    }
    var date = new Date($('#datepicker').datepicker("getDate"));
    var today = new Date();
    if (dateDifferenceInDays(date,today) <= 0) {
      document.getElementById("modalMessage").innerHTML = "Please choose a valid future date for your event";
      $('#set_reminder').modal('hide');
      $("#validateModal").modal('show');
      return;
    }
    date.setDate(date.getDate()-14);
    if (dateDifferenceInDays(date,today) < 0) {
      $('#set_reminder').modal('hide');
      $("#validateDateModal").modal('show');
      return false;
    }
    var origDate = new Date($('#datepicker').datepicker("getDate"));
    var dISO = origDate.toISOString();
    $.ajax({
      type: 'POST',
      url: '/saveReminder',
      data: {date: dISO,email: $('#reminder_email').val(),name: $('#reminder_name').val()},
      success: function(res) {
        if (res == "Success") {
          $('#set_reminder').modal('hide');
          $("#reminderSuccess").modal('show');
        } else if (res == "Already present in DB") {
          document.getElementById("modalMessage").innerHTML = "You already have a reminder set.";
          $('#set_reminder').modal('hide');
          $("#validateModal").modal('show');
        } else {
          $('#set_reminder').modal('hide');
          alert('Unable to save reminder');
        }

      },
      error: function(err) {
        alert('unable to save');
      }
    })

  }

  function redirectToEvent(mode) {
    if (mode == 'New') {
      deleteCookie('ProdID');
      deleteCookie('age_group');
      deleteCookie('event_date');
      deleteCookie('gender');
      deleteCookie('event_name');
      setCookie('event_category',$('#new_event').val(),2);
      window.location.href = "/new_registry";
    } else {
      window.location.href = "/New-Cart.html";
    }
  }

  function checkEvents(event_cat) {
    if((getCookie('event_category') != event_cat && getCookie('event_category') != "") && getCookie("event_name") != "") {
      $('#new_event').val(event_cat);
      //alert(' you have a cart in progress - discard ?');
      if (getCookie('event_category') == "Birthday")
        $('#clearCartMessage').text('You are already planning a wishlist at the moment for a Birthday.');
      if (getCookie('event_category') == "Anniversary")
        $('#clearCartMessage').text('You are already planning a wishlist at the moment for an Anniversary.');
      if (getCookie('event_category') == "Baby Shower")
        $('#clearCartMessage').text('You are already planning a wishlist at the moment for a Baby Shower.');
      if (getCookie('event_category') == "Wedding")
        $('#clearCartMessage').text('You are already planning a wishlist at the moment for a Wedding.');
      if (getCookie('event_category') == "House Warming")
        $('#clearCartMessage').text('You are already planning a wishlist at the moment for a House Warming.');
      if (getCookie('event_category') == "A Special Event")
        $('#clearCartMessage').text('You are already planning a wishlist at the moment for a Special Event.');
      $('#clearCart').modal('show');
    } else {

    //alert('in else');
      if(getCookie("event_name") == "") {
        setCookie('event_category',event_cat,2);
        window.location.href = "/new_registry";
        // Just a fail safe for deleteing ProdID
        deleteCookie('ProdID');
      }
      else
        window.location.href = "/New-Cart.html";
    }
  }

  function msieversion() {

      var ua = window.navigator.userAgent;
      var msie = ua.indexOf("MSIE ");
      alert(ua + "");
      if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))  // If Internet Explorer, return version number
      {
          alert(parseInt(ua.substring(msie + 5, ua.indexOf(".", msie))));
      }
      else  // If another browser, return 0
      {
          alert('otherbrowser');
      }

      return false;
  }

  function showLoginModal() {
    $('#login').modal('show');
  }

  function clearFields() {
    $('#login_username').val("");
    $('#login_password').val("");
  }

  function gotoHome() {
    window.location.href = "/";
  }

  function validateEmail(email) {
      /*//var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;*/
      var re = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
      return re.test(email);
  }

  function validateAndReset() {
    if ($('#password').val().length < 6) {
      $('#warning_modal-title-id').text('Warning');
      $('#warning_modal-p-id').text('Password needs to be more than 6 characters.');
      $('#warning_modal').modal('show');
      return false;
    } else if ($('#password').val() != $('#repassword').val()) {
      $('#warning_modal-title-id').text('Warning');
      $('#warning_modal-p-id').text('Password do not match.');
      $('#warning_modal').modal('show');
      return false;
    } else if ($('#password').val() == $('#repassword').val()) {
      $.ajax({
        type: 'POST',
        url: '/getsalt',
        success: function (salt) {
         //alert(salt);
         var sha256 = new jsSHA('SHA-256', 'TEXT');
         sha256.update($("#password").val() + salt);
         var hash = sha256.getHash("HEX");
         //alert("Hashed val" + hash);
       $.ajax({
             type : 'POST',
             url :"/setPassword",
             data : {"c": $('#c').val() , "h" : hash, "s": salt},
             success : function(res) {
               if (res == "success") {
                 password_changed
                 $('#password_changed-title-id').text('Success');
                 $('#password_changed-p-id').text('Password changed sucessfully.');
                 $('#password_changed').modal('show');
                 $('#changePassword').html('<p>Password Changed</p>');
              }
             },
             error : function(res) {alert("Error in setting password")}
           })
        },
        error: function (err) {
          alert("Unable to get salt")
        }
      })
    }
  }

  function reloadPage() {
    location.reload();
  }


  function findRegistry() {
    if ($('#key1').val() == '' || $('#key2').val() == '' || $('#key3').val() == '') {
      $('#warning_modal-title-id').text('Warning');
      $('#warning_modal-p-id').text('Please provide a valid registry ID');
      $('#warning_modal').modal('show');
      return false;
    }
    if ($('#key1').val().length != 3 || $('#key2').val().length != 3 || $('#key3').val().length != 3) {
      $('#warning_modal-title-id').text('Warning');
      $('#warning_modal-p-id').text('Please provide a valid registry ID');
      $('#warning_modal').modal('show');
      return false;
    }
    $.ajax({
       type  : 'POST',
       url   : '/verifyRecaptcha',
       data  : {"Response":grecaptcha.getResponse()},
       success: function(res) {
         if (res.success) {
            $.ajax({
              type  : 'POST',
              url   : '/checkRegistry',
              data : {registry: $('#key1').val() + $('#key2').val() + $('#key3').val()},
              success : function (res) {
                if (res.status == 'found') {
                  //alert('found registry ' + res.wid);
                  window.location.replace("/showWishList?eventID=" + res.wid + "\&u=" + res.uid);
                } else {
                  $('#warning_modal-title-id').text('Warning');
                  $('#warning_modal-p-id').text('This registry ID is invalid. Please reconfirm the ID and try again.');
                  $('#close').attr("onclick","reloadPage()");
                  $('#warning_modal').modal('show');
                }
              },
              error : function (err) {
                alert ("Error: " + err);
              }
            })
          } else if (res["error-codes"][0] == "missing-input-response") {
            $('#warning_modal-title-id').text('Warning');
            $('#warning_modal-p-id').text('Please click checkbox to verify that you are a human :)');
            $('#warning_modal').modal('show');
          }
        },
        error : function (res) {
          alert("Error in validating captcha response - "+  res.error_codes);
        }
      })
  }

  function passWordReset() {
    if ($('#username').val() == '') {
      $('#warning_modal-title-id').text('Warning');
      $('#warning_modal-p-id').text('Please provide an email address.');
      $('#warning_modal').modal('show');
      return false;
    }
    //alert('posting');
    $('#passwordChangeButton').html('<i class="fa fa-circle-o-notch fa-spin" style="font-size:24px;"></i><br><p>Processing...</p>')
    $.ajax({
       type  : 'POST',
       url   : '/verifyRecaptcha',
       data  : {"Response":grecaptcha.getResponse()},
       success: function(res) {
         if (res.success) {
            $.ajax({
              type  : 'POST',
              url   : '/resetPassword',
              data : {"username": $('#username').val()},
              success : function (res) {
                if (res == 'mailsent')
                $('#passwordChangeButton').html('<p>Done</p>');
                  $('#mail_sent-title-id').text('Success');
                  $('#mail_sent-p-id').text('We have sent a link to your registered email address using which you can change your password.');
                  $('#mail_sent').modal('show');
              },
              error : function (err) {
                alert ("Error: " + err);
              }
            })
          } else if (res["error-codes"][0] == "missing-input-response") {
            $('#warning_modal-title-id').text('Warning');
            $('#warning_modal-p-id').text('Please click checkbox to verify that you are a human :)');
            $('#warning_modal').modal('show');
          }
        },
        error : function (res) {
          alert("Error in validating captcha response - "+  res.error_codes);
        }
      })
  }

  function changePassword() {
    try {
      //alert("logging in with " + $(login_username).val() + " and " + $(login_password).val());
      $.ajax({
        type: 'POST',
        url: '/getSaltForUser',
        data: {user: $('#user').val()},
        success: function (salt) {
         //alert(salt);
         var sha256 = new jsSHA('SHA-256', 'TEXT');
         sha256.update($('#e_password').val() + salt);
         var hash = sha256.getHash("HEX");
         //alert("Hashed val" + hash);
         $.ajax({
           type: 'POST',
           url: '/getsalt',
           success: function (newsalt) {
            //alert(newsalt);
            var sha2562 = new jsSHA('SHA-256', 'TEXT');
            sha2562.update(newsalt + hash);
            var newhash = sha2562.getHash("HEX");
            //alert("New calculated Salt" + newhash);
            $.ajax({
              type: 'POST',
              url: '/changePassword',
              data: {attempt: newhash,gensalt: newsalt,user: $('#user').val(),email: $('#email').val()},
              success: function (data) {
               //alert("Performing Login: Result is " + data);
               if (data == "Login Success") {
                 //alert('login with existing password is success.');
                 $.ajax({
                   type: 'POST',
                   url: '/getPasswordChangeSalt',
                   success: function (salt_for_new_pass) {
                    //alert("Got Salt for new Password" + salt);
                    var sha256 = new jsSHA('SHA-256', 'TEXT');
                    sha256.update($("#login_password").val() + salt_for_new_pass);
                    var hash = sha256.getHash("HEX");
                    //alert("Hashed val" + hash);
                    var changedPassData = '{"Password" : "'+ hash +'", "Uppu": "' + salt_for_new_pass + '", "user": "' + $('#user').val() + '"}';
                    $.ajax({
                        type : 'POST',
                        url :"/saveNewPassword",
                        data : {"changedPassData":changedPassData},
                        success : function(res) {
                          $('#information_modal-title-id').text('Success');
                          $('#information_modal-p-id').text('Your password has been changed.');
                          $('#information_modal').modal('show');
                        },
                        error : function(res) {alert("Error Changing Password!")}
                      })
                   },
                   error: function (err) {
                     alert("Unable to save wishlist")
                   }
                 })
               } else {
                 $('#error_modal-title-id').text("Error");
                 $('#error_modal-p-id').text('Current password is incorrect.');
                 $('#error_modal').modal('show');
               }
             },
             error: function (err) {
               alert("Unable to login")
             }
           });
          },
          error: function (err) {
            alert("Unable to login")
          }
        });
        },
        error: function (err) {
          alert("Unable to save wishlist")
        }
      })
    }
    catch (e) {alert("Error!!! - "+e)}
  }


  function doLogin(action) {
    $('#processingModal').modal('show');
    $('#processingMessage').html('Logging in...');
    try {
      //alert("logging in with " + $(login_username).val() + " and " + $(login_password).val());
      var t_sha256 = new jsSHA('SHA-256', 'TEXT');
      t_sha256.update($('#login_username').val());
      var uid_hash = t_sha256.getHash("HEX");
      //alert(uid_hash);
      $.ajax({
        type: 'POST',
        url: '/getSaltForUser',
        data: {user: uid_hash},
        success: function (salt) {
         //alert(salt);
         var sha256 = new jsSHA('SHA-256', 'TEXT');
         sha256.update($('#login_password').val() + salt);
         var hash = sha256.getHash("HEX");
         //alert("Hashed val" + hash);
         $.ajax({
           type: 'POST',
           url: '/getsalt',
           success: function (newsalt) {
            //alert(newsalt);
            var sha2562 = new jsSHA('SHA-256', 'TEXT');
            sha2562.update(newsalt + hash);
            var newhash = sha2562.getHash("HEX");
            //alert("New calculated Salt" + newhash);
            $.ajax({
              type: 'POST',
              url: '/plogin',
              data: {attempt: newhash,gensalt: newsalt,user: uid_hash,email: $('#login_username').val()},
              success: function (data) {
               //alert("Performing Login: Result is " + data);
               if (data == "Login Success") {
                 if (action == 'saveWishList') {
                   var eventDate = getCookie("event_date");
                   var eventType = getCookie("event_category");
                   var selProducts = getCookie("ProdID");
                   var event_name = getCookie("event_name");
                   var wishList = '{"EventName" :"'+ event_name +'", "EventDate" : "'+eventDate+'", "EventType" : "'+eventType+'", "UsrName" : "'+$('#login_username').val()+'",';
                   wishList = wishList + ' "ProductIDs" : "'+ selProducts+ '"}';
                   $.ajax({
                       type : 'POST',
                       url :"/saveWishlist",
                       data : {"Wishlist":wishList},
                       success : function(res) {
                         //The following alert will need to be replaced by a modal dialog
                         document.getElementById("wishListLink").innerHTML = res;
                         signuporlogin = "login";
                         //alert('Wish list ref ID is ' + $('#wishlistIdReference').val())
                         setCookie("wishlistIdReference",$('#wishlistIdReference').val(),2);
                         setCookie("UIDReference",$('#UIDReference').val(),2);
                         setCookie("eventID",$('#refID').val(),2);
                         $("#signUpOrNot").modal('hide');
                         $("#wishListURLModal").modal('show');


                       },
                       error : function(res) {alert("Error in saving wishlist!")}
                     })
                 }
                 else if(action == "") {
                   window.location.href = "/home";
                 }
               } else {
                 $('#processingModal').modal('hide');
                 $('#invalid_password').modal('show');
               }
             },
             error: function (err) {
               alert("Unable to login")
             }
           });
          },
          error: function (err) {
            alert("Unable to login")
          }
        });
        },
        error: function (err) {
          alert("Unable to save wishlist")
        }
      })
    }
    catch (e) {alert("Error!!! - "+e)}
  }

  function dateDifferenceInDays(date1, date2) {
    var utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    var utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc1 - utc2) / _MS_PER_DAY);
  }

  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
  }

  function setCookie(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      var expires = "expires="+ d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }


  //3/31/2017 -trznt- Delete cookie function

  function deleteCookie(name) {
      document.cookie = name +'=;path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }

 function getCustomerDetails() {
   var htmlStr = "";
   var eventName = getCookie("event_name");
   //alert("Inside Save Wishlist, event Name :"+eventName);
   htmlStr = '<div class = "container-fluid" style="padding-top:120px" id="mainContentPage">';
   htmlStr = htmlStr+'<form class="form" name="save_wishlist_form" action="/home" method="POST" id="signup" onsubmit="saveWishlist();return false;" ><div class="row"><div class="col-md-2">';
   htmlStr = htmlStr+'<button type="button" class = "btn btn-responsive" onclick="loadNewCart()">Search more products</button></div></div><hr>';
   htmlStr = htmlStr+'<div class="row"><div class="container save_wishlist"><input style="display:none" type="text" name="fakeusernameremembered"/><input style="display:none" type="password" name="fakepasswordremembered"/><div class="list-group-create-registry">';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "event_name">Name of the event: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="text" class="form-control" name="the_new_event_name" id="event_name" value="'+eventName+'"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "hostfullname">Your name: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><div class="form-group" id="form_group_hostfullname"><input type="text" class="form-control" id="hostfullname" name="tempname" placeholder="e.g. Will Smith"></div></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "receiver">Gift receiver\'s name: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="text" class="form-control" id="rcvrname" placeholder="e.g. John Doe"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "cellphnum">Mobile number: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><div class="form-group" id="form_group_cellphnum"><input type="text" class="form-control" id="cellphnum" placeholder="e.g. 9845012345"></div></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "emailaddr">Email address: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><div class="form-group" id="form_group_email"><input type="email" class="form-control" id="emailaddr" placeholder="e.g. will.smith@gmail.com"></div></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group" id="form_group"><label for "password">Password: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><div class="form-group" id="form_group_password"><input type="password" class="form-control" id="password"></div></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group" id="form_group"><label for "retype-password">Re-Type Password: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><div class="form-group" id="form_group_retype_password"><input type="password" class="form-control" id="retype-password"></div></div></div>';
   htmlStr = htmlStr + '<input type="hidden" name="emailvalidate" id="emailvalidate" value="0" >'
   htmlStr = htmlStr+'<button type="submit" class="btn btn-primary btn-lg">Save your Wishlist!</button></form>';
   htmlStr = htmlStr+'</div></div><div class="row"><div class="col-sm-12"><hr></div></div></form>'
   htmlStr = htmlStr+'</div>';
   $('#mainContentPage').replaceWith(htmlStr);
   $(".fake-autofill-fields").show();
        // some DOM manipulation/ajax here
        window.setTimeout(function () {
            $(".fake-autofill-fields").hide();
        },1);
   $( "#emailaddr" )
    .focusout(function() {
      if ($('#emailaddr').val().length > 0)
      $.ajax({
        type: 'GET',
        url: '/checkIfEmailExists',
        data: {email: $('#emailaddr').val()},
        success: function (res) {
          //alert ("Email is " + res);
          if (res == "EmailDoesNotExist") {
            $('#emailvalidate').val("1");
          }
            else {
              document.getElementById("modalMessage").innerHTML = "The email ID provided already exists.";
              $("#validateModal").modal('show');
              $('#emailvalidate').val("0");
            }
        },
        error: function (res) {
          alert ("unable to reach server");
        }
    });
  });
   //$("#event_name").val() = eventName;
 }

function validFields() {
  var valid = true;
  if ($('#hostfullname').val() ==  "") {
    $('#form_group_hostfullname').addClass('has-error');
    valid = false;
  } else {
    $('#form_group_hostfullname').removeClass('has-error');
  }
  if ($('#cellphnum').val() ==  "") {
    $('#form_group_cellphnum').addClass('has-error');
    valid = false;
  } else {
    $('#form_group_cellphnum').removeClass('has-error');
  }
  if ($('#password').val() ==  "") {
    $('#form_group_password').addClass('has-error');
    valid = false;
  } else {
    $('#form_group_password').removeClass('has-error');
    if ($('#password').val() != $('#retype-password').val()) {
      alert ('Passwords dont match');
      //alert ($('#password').val() + '-' + $('#retype-password').val())
      $('#form_group_retype_password').addClass('has-error');
      $('#form_group_password').addClass('has-error');
      valid = false;
    } else {
      $('#form_group_retype_password').removeClass('has-error');
      $('#form_group_password').removeClass('has-error');
    }
  }
  if ($('#emailaddr').val() ==  "") {
    $('#form_group_email').addClass('has-error');
    valid = false;
  } else {
    $('#form_group_email').removeClass('has-error');
  }
  if ($('#retype-password').val() ==  "") {
    $('#form_group_retype_password').addClass('has-error');
    valid = false;
  } else {
    $('#form_group_retype_password').removeClass('has-error');
    if ($('#password').val() != $('#retype-password').val()) {
      alert ('Passwords dont match');
      //alert ($('#password').val() + '-' + $('#retype-password').val())
      $('#form_group_retype_password').addClass('has-error');
      $('#form_group_password').addClass('has-error');
      valid = false;
    } else {
      $('#form_group_retype_password').removeClass('has-error');
      $('#form_group_password').removeClass('has-error');
    }
  }
  if ($('#emailvalidate').val() == "0") {
    $('#form_group_email').addClass('has-error');
    valid = false;
  } else {
    $('#form_group_email').removeClass('has-error');
  }

  return valid;
}



 function saveWishlist() {
   try {
     //alert("SaveWishList function");
     if (validFields())
     {
       var eventDate = getCookie("event_date");
       var eventType = getCookie("event_category");
       var selProducts = getCookie("ProdID");
       //alert("date is " + eventDate);
    //   var wishList = '{"EventName" :"'+$("#event_name").val()+'", "EventDate" : "'+eventDate+'", "EventType" : "'+eventType+'", "UsrName" : "'+$("#emailaddr").val()+'", "HostName" : "'+$("#hostfullname").val()+'",';
    //   wishList = wishList +' "ContactName" : "'+$("#rcvrname").val()+'", "HostEmail" : "'+$("#emailaddr").val()+'", "HostPhone" : "'+$("#cellphnum").val()+'", "ProductIDs" : "'+selProducts+'", "Password" : "'+$("#password").val()+'"}';

       $.ajax({
         type: 'POST',
         url: '/getsalt',
         success: function (salt) {
          //alert(salt);
          var sha256 = new jsSHA('SHA-256', 'TEXT');
          sha256.update($("#password").val() + salt);
          var hash = sha256.getHash("HEX");
          //alert("Hashed val" + hash);
          var wishList = '{"EventName" :"'+$("#event_name").val()+'", "EventDate" : "'+eventDate+'", "EventType" : "'+eventType+'", "UsrName" : "'+$("#emailaddr").val()+'", "HostName" : "'+$("#hostfullname").val()+'",';
          wishList = wishList +' "ContactName" : "'+$("#rcvrname").val()+'", "HostEmail" : "'+$("#emailaddr").val()+'", "HostPhone" : "'+$("#cellphnum").val()+'", "ProductIDs" : "'+selProducts+'", "Password" : "'+ hash +'", "Uppu": "' + salt + '"}';
          $.ajax({
              type : 'POST',
              url :"/saveWishlist",
              data : {"Wishlist":wishList},
              success : function(res) {
                document.getElementById("wishListLink").innerHTML = res;
                signuporlogin = "signup";
                setCookie("wishlistIdReference",$('#wishlistIdReference').val(),2);
                setCookie("UIDReference",$('#UIDReference').val(),2);
                $("#login").modal('hide');
                $("#signUpOrNot").modal('hide');
                $("#wishListURLModal").modal('show');
              },
              error : function(res) {alert("Error in saving wishlist!")}
            })
         },
         error: function (err) {
           alert("Unable to save wishlist")
         }
       })
     } /*valid fields*/
   }
   catch (e) {alert("Error --!!!\n"+e)}
 }

function showDisclaimer() {
  alert('');
}

function showSendNotification() {
  //$('#bmgNotificationModal').modal('show');
}

function sendNotification() {

  var note = $('#notification_message').val();
  if ($('#notification_message').val().length == 0) {
    document.getElementById("modalMessage").innerHTML = '"' + emails[i] + '" is an invalid email.';
    document.getElementById("validate_modal_title").innerHTML = 'Invalid Input';
    $("#validateModal").modal('show');
  }
  var emails = note.split(',');
  var realmails = [];
  var valid = true;
  for (var i = 0;i < emails.length;i++) {
    if(emails[i] != "") {
      if(!validateEmail(emails[i])) {
        document.getElementById("modalMessage").innerHTML = '"' + emails[i] + '" is an invalid email.';
        document.getElementById("validate_modal_title").innerHTML = 'Invalid Input';
        $("#validateModal").modal('show');
        valid = false;
      }
      else {
        realmails[i] = emails[i];
      }
    }
  }

  if (realmails.length > 50) {
    document.getElementById("modalMessage").innerHTML = 'You can only send the notification to a maximum of 50 email addresses.';
    document.getElementById("validate_modal_title").innerHTML = 'Too many email IDs';
    $("#validateModal").modal('show');
    valid = false;
  }

  if (valid) {
  //

    $.ajax({
      type: 'POST',
      url: '/sendMailerNotification',
      data: {event_id_num: getCookie('eventID'), email_adds: realmails, username: $('#username').val()},
      success: function (res) {
        if (res == "AllSaved"){
          $.ajax({
            type : 'POST',
            url :"/updateSentNotification",
            data : {"EventUID":getCookie('eventUID'),"EventWID":getCookie('eventWID')},
            success : function(res) {
              if (res == "NotificationUpdated")
                  $('#options').html('<div class="col-sm-12" style="text-align:center;font-size:30px;">Sending Emails...<br>Thank You for using bemygenie invites!<br><button class="btn btn-default" onclick="location.href=\'/home\'">Home</button>  </div>')
            },
            error : function(res) {alert("Error addint!")}
          })
        }
      },
      error: function (err) {
        alert(err);
      }
    });
  }
}

//4/22/2017 - trznt
//Getting Data of WishList item
function getListData(wid,uid,name,event_id,notification_sent,mode) {
  //$('#wishListLink').html("");
  $('#event_ID_notification').val("");
  $('#event_URL_notification').val("");
  $('#summaryDescription').html("");
  if (mode) {
    $('#wishlistname').text(name);
    $('#wishlistsummary').html('<div style="text-align:center">Loading Wishlist...<br> <i class="fa fa-circle-o-notch fa-spin" style="font-size:48px"></i></div>');
  }
  else {
    $('#wishlistoldname').text(name);
    $('#wishlistoldsummary').html('<div style="text-align:center">Loading Wishlist...<br> <i class="fa fa-circle-o-notch fa-spin" style="font-size:48px"></i></div>');
  }

  $.ajax({
      type : 'GET',
      url :"/getWishListItems",
      data : {"wid":wid,"uid":uid},
      success : function(res) {
        //The following alert will need to be replaced by a modal dialog
            $('#event_ID_notification').val(event_id);
            $('#event_URL_notification').val("http://" + window.location.hostname + "/showWishList?eventID=" + wid + "\&u=" + uid);
            $('#event_notification_status').val(notification_sent);
            if (notification_sent == 0) {
              $('#sendNotificationButton').prop('disabled', false);
            } else {
              $('#sendNotificationButton').prop('disabled', true);
            }
            var data = '';
            var boughtCount = 0;
            //alert(JSON.stringify(res));
            //alert(res);
            data += '<table>';
            for (i = 0;i < res.Products.length; i++) {
                data += '<tr>';
                data += '<td><a href="' + res.Products[i].ProdData[0].ProdDsc + '" target="_blank"><img src="' + res.Products[i].ProdData[0].ImageURL + '"></a></td>';
                data += '<td style="padding:10px">';
                data += '<a href="' + res.Products[i].ProdData[0].ProdDsc + '" target="_blank"><font color="#2B547E" size="3">' +  res.Products[i].ProdData[0].ProdNm + '</font></a><br>';
                if (res.Products[i].ProdData[0].InStock == 1 ) {
                  data += '<table><tr><td>Price:  &#8377;' +  res.Products[i].ProdData[0].MRP + '<td><td style="font-size:8px;padding-left:10px"> (as of ' + getDateFromUTC(res.Products[i].ProdData[0].UpdDate) + ' IST - </td><td class="help-tip-details" style="font-size:8px;padding-left:10px">	<p>Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon.in at the time of purchase will apply to the purchase of this product.</p></td><td style="font-size:8px">)</td></tr></table><br>';
                  if (res.Products[i].Status == "Available")
                    data += 'Gift Status: <b><font color="#FFA62F">Pending Purchase</font></b>';
                  else
                     data += 'Gift Status: <b><font color="#348781">Purchased</font></b>';
                } else {
                  data += '<table><tr><td>Not Available<td><td style="font-size:8px;padding-left:10px"> (as of ' + getDateFromUTC(res.Products[i].ProdData[0].UpdDate) + ' IST - </td><td class="help-tip-details" style="font-size:8px;padding-left:10px">	<p>This product is presently not avaialble. You may choose to remove it from your wishlist. If you retain it, however, when the product becomes available, it will be available for purchase on your registry.</p></td><td style="font-size:8px">)</td></tr></table><br>';
                  data += 'Gift Status: <b><font color="#FFA62F">N/A</font></b>';
                }

                data += '</td>';
                data += '</tr>';
                data += '<tr><td><hr></td><td><hr></td></tr>';
                if (res.Products[i].Status == "Bought")
                  boughtCount++;
            }
            data += '</table>';
            if (mode) {
              if (boughtCount == res.Products.length) {
                $('#summaryDescription').html('<p class="summary">Awesome! All ' + res.Products.length + ' item(s) in your wishlist has been bought.</p>')
              }
              else if (boughtCount == 1) {
                $('#summaryDescription').html('<p class="summary">Your wishlist has ' + res.Products.length + ' items of which ' + boughtCount + ' has already been purchased.</p>')
              } else if (boughtCount > 1){
                $('#summaryDescription').html('<p class="summary">Your wishlist has ' + res.Products.length + ' items of which ' + boughtCount + ' have already been purchased.</p>')
              } else if (boughtCount == 0) {
                $('#summaryDescription').html('<p class="summary">There are ' + res.Products.length + ' item(s) in your wishlist. No items have been purchased yet.</p>')
              }
              $('#wishlistsummary').html(data);
            } else {
              if (boughtCount == res.Products.length) {
                $('#summaryOldDescription').html('<p class="summary">Awesome! All ' + res.Products.length + ' item(s) in your wishlist had been bought.</p>')
              }
              else if (boughtCount == 1) {
                $('#summaryOldDescription').html('<p class="summary">Your wishlist had ' + res.Products.length + ' items of which ' + boughtCount + ' were  purchased.</p>')
              } else if (boughtCount > 1){
                $('#summaryOldDescription').html('<p class="summary">Your wishlist had ' + res.Products.length + ' items of which ' + boughtCount + ' were purchased.</p>')
              } else if (boughtCount == 0) {
                $('#summaryOldDescription').html('<p class="summary">There were ' + res.Products.length + ' item(s) in your wishlist. No items were purchased unfortunately.</p>')
              }
              $('#wishlistoldsummary').html(data);
            }
            if (mode) {
              $('#wishListLink').html('<table><tr><td><p class="summary" style="padding-top:8px">Link to this wishlist: </p></td><td><div class="help-tip">	<p>To share this wishlist with your friends and family, pass along this link - or you can use the BMG notification system.</p> </div></td></tr></table> <input class="form-control" value="http://'+ window.location.hostname + '/showWishList?eventID=' + res.wid + '\&u=' + res.uid + '" id="wishListLinkUrl" readonly><br><div style="text-align:center"></div><p style="font-size:15px">This wishlist\'s ID: <b>' + event_id + '<b></p><br><hr><br>');
              $("#wishListLinkUrl").focus(function() { $(this).select(); } );
            }
            //$('#' + div).text("You have " + res[0].EventName);
            //$('#' + div).text("Event Name: " + res[0].EventName);
      },
      error : function(res) {alert("Error in retrieving user informaton!")}
    })
}



// 26/4/2017
// Getting Profile information form the DB
function getUserProfileDetails(user,div) {
  div = "#" + div;
  $(div).html("");
  //alert("Getting User information");
  $.ajax({
      type : 'GET',
      url :"/getUserProfileDetails",
      data : {"userid":user},
      success : function(res) {
        var data = "";
        data += '<br><br><form action="/saveProfileChanges" method="POST"><div class="row"><div class="col-sm-4" style="text-align:right"><div class="form-group"><label for="name">Name:</label></div></div>';
        data += '<div class="col-sm-6" style="text-align:center"><div class="form-group"><input type="text" class="form-control" value="' + res[0].HostName + '" name="hostname"></div></div></div>';
        data += '<div class="row"><div class="col-sm-4" style="text-align:right"><div class="form-group"><label for="phone">Mobile:</label></div></div>';
        data += '<div class="col-sm-6" style="text-align:center"><div class="form-group"><input type="text" class="form-control" value="' + res[0].HostPhone + '" name="hostphone"></div></div></div>';
        data += '<div class="row"><div class="col-sm-4" style="text-align:right"><div class="form-group"><label for="email">Email:</label></div></div>';
        data += '<div class="col-sm-6" style="text-align:center"><div class="form-group"><input type="text" class="form-control" value="' + res[0].HostEmail + '" name="email" id="email" readonly><input type="hidden" name="uid" id="uid" value="' + res[0].uid + '"></div></div></div>';
        data += '<div class="row"><div class="col-sm-4" style="text-align:right"><div class="form-group"><label for="password">Password:</label></div></div>';
        data += '<div class="col-sm-6" style="text-align:center"><div class="form-group"><input type="password" class="form-control" value="******" id="password" readonly><a href="#" data-target="#changePassword" data-toggle="modal" style="font-size:10px;float:right">Change Password</a></div></div></div>';
        data += '<div class="row"></br></div><div class="row"><div class="col-sm-6" style="text-align:right">' + '<button class="btn btn-primary" name="Save" type="submit" style="background-color:#454282">Save Changes</button></div>';
        data += '<div class="col-sm-6" style="text-align:left">' + '<button class="btn btn-primary" name="Cancel" style="background-color:#454282" onclick="location.href=\'/home \';return false;">Cancel</button></div></div></form>';

        $(div).append('<h2>Your Profile. </h2>' + data);
      },
      error : function(res) { alert ("Error reading from server");}
  });

}

//27/3/2017 - trznt
 // The following function gets called from the Dashboards page to load user information
 // Things to load:
 //   1. Open and Completed WishLists
 //   2. User Profile information
 //   3. User Service Requests
 function getUserWishLists(user,divactive,mode) {
   //alert("getting wishlist data:" + user +divactive + mode);
   $('#' + divactive).html("");
   //alert(user);
   $.ajax({
       type : 'GET',
       url :"/getUserWishLists",
       data : {"userid":user,"mode":mode},
       success : function(res) {
         //The following alert will need to be replaced by a modal dialog
             //alert(JSON.stringify(res));
             if (res.length >=1) {
               var table_text = '<table class="table table-hover" style="background:#FFFFFF;color:#000000"><thead style="background:#454282;color:#FFFFFF"><tr><th>#</th><th>Event Name</th><th>Event Type</th><th>Event Date</th><th>Notify</th></tr></thead><tbody>';
               for (i = 0; i < res.length ;i++) {
                 var d = new Date(res[i].EventDate);
                 var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear();
                  if (mode) {
                    if (res[i].notification_sent == 0) {
                      table_text += '<tr ><th scope="row" data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + (i + 1) + '</th><td data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + res[i].EventName + '</td><td data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + res[i].EventType + '</td><td data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + datestring + '</td><td><a href="/invite_composer" onclick="setCookie(\'eventID\',\'' + res[i].event_id +  '\',2);setCookie(\'eventUID\',\'' + res[i].uid +  '\',2);setCookie(\'eventWID\',\'' + res[i].wid +  '\',2);setCookie(\'event_date\',\'' + datestring +  '\',2);">Send Invite</a></td></tr>';
                    } else {
                      table_text += '<tr ><th scope="row" data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + (i + 1) + '</th><td data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + res[i].EventName + '</td><td data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + res[i].EventType + '</td><td data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;">' + datestring + '</td><td data-toggle="modal" data-target="#viewWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',\'' + res[i].notification_sent +  '\',1)" style="cursor:pointer;"> Invite Sent </td></tr>';

                    }
                  }
                 else
                  table_text += '<tr data-toggle="modal" data-target="#viewOldWishListModal" onclick="$(\'#sendNotificationButton\').prop(\'disabled\', true);getListData(\'' + res[i].wid + '\',\'' + res[i].uid + '\',\'' + res[i].EventName +  '\',\'' + res[i].event_id +  '\',,\'' + res[i].notification_sent +  '\'0)" style="cursor:pointer;" ><th scope="row">' + (i + 1) + '</th><td>' + res[i].EventName + '</td><td>' + res[i].EventType + '</td><td>' + datestring + '</td><td><a href="#" onclick="alert(\'test\')">Send Invite</a></td></tr>';
               }
              table_text += '</tbody></table>';
              if (mode)
                $('#' + divactive).append("<h2>Here are the registries for your upcoming events. Click on an event to see what gifts have been purchased so far.</h2><br><br>" + table_text);
              else
                $('#' + divactive).append("<h2>These are registries for completed events. </h2><br><br>" + table_text);

             }
             else {
               if (mode)
                 $('#' + divactive).append("<h2>You have no upcoming events. </h2><br><br>");
               else
                 $('#' + divactive).append("<h2>You have no completed events yet. </h2><br><br>");
             }
             //For Asthetics
             if (res.length <= 2) {
               $('#userblock').css({"padding-bottom":"100px"})
             }
             //$('#' + div).text("You have " + res[0].EventName);
             //$('#' + div).text("Event Name: " + res[0].EventName);
       },
       error : function(res) {alert("Error in retrieving user informaton!")}
     })
 }

/* function AddToCartUserProd(Id,MRP,PrdGrp) {
   try {
     var bmgId = "";
     var cartProds = getCookie("ProdID");
     //alert("Name = "+PrdName);
     var prodArr = [];
     var cartLngth = 0;
     if (Id.substring(0,3) != "BMG") {
       bmgId = "BMG"+Id;
       var proddsc = document.getElementById("detURL_"+Id);
       var imageURL = document.getElementById("imgURL_"+Id).src;
       var prodnm = document.getElementById("ProdNm_"+Id).innerHTML;
       var evntType = getCookie("event_category");
       switch (PrdGrp) {
         case "Toy" : PrdGrp="Toys";break;
         case "Book" : PrdGrp="Books";break;
         case "Health & Personal Care" : PrdGrp="HealthPersonalCare";break;
         case "Office Products" : PrdGrp="OfficeProducts";break;
         case "PC Hardware" : PrdGrp="PCHardware";break;
         case "Gift Cards" : PrdGrp="GiftCards";break;
         case "Home & Garden" : PrdGrp="HomeGarden";break;
         case "Sporting Goods" : PrdGrp="SportingGoods";break;
         case "Video Games" : PrdGrp="VideoGames";break;
         case "Musical Instruments" : PrdGrp="MusicalInstruments";break;
       }
       var catg = getCatg(MRP,PrdGrp);
       //prodnm = prodnm.replace(/['"-()]+/g, ''); //need to handle escaping of /

       //trznt - Adding another item to prod called Status: Open
       var keywords = prodnm.split(' ');
       var keywordArr = "";
       for (var m = 0,n = 0; m < keywords.length; m++) {
         if (keywords[m].length >= 3) {
           if (n != 0) {
             keywordArr += ",";
           }
           keywords[m] = keywords[m].replace(/[^a-zA-Z0-9]/g, '');
           keywordArr += '"' + keywords[m].toLowerCase() + '"';
           n++;
         }
       }
       var prd = '{"ProdID":"'+bmgId+'","ProdDsc":"'+proddsc+'","ImageURL":"'+imageURL+'","ProdNm":"'+prodnm+'","Catg":"'+catg+'","MRP":"'+MRP+'","ProdGrp":"'+PrdGrp+'","Reviewed":"TBD","eventType":["'+evntType+'"],"prodNameKeyWords":[' + keywordArr  + ']}';
       //Throwing error if the name has quotes in it
       $.ajax({
         type : 'POST',
         url :"/addToDBByUser",
         data : {"Product":prd},
         success : function(res) {},
         error : function(res) {alert("Error in adding product to cart!")}
       })
     } //Amazon product -- write to DB
     else {bmgId = Id};

     if (cartProds != "") {
       if (cartProds.indexOf(",") >= 0) {prodArr = cartProds.split(',');cartLngth=prodArr.length}
       else {prodArr[0]=bmgId;cartLngth=1};
       cartProds = cartProds+','+bmgId;
     }
     else (cartProds=bmgId)
     cartLngth++;
     setCookie("ProdID",cartProds,2);

     document.getElementById("CartId").innerHTML="Cart ("+cartLngth+")";
   }
   catch (e) {alert(e)}
 };*/

 function productExists(prod) {
   //alert('in prod exists');
   var cartProds = getCookie("ProdID");
   var prodArr = cartProds.split(',');
   //alert('lenght is ' + prodArr.length);
   for (var i = 0; i < prodArr.length;i++) {
       if (('BMG' + prod) == prodArr[i])
        return true;
       if (prod == prodArr[i])
        return true;
   }
   return false;
 }

 function AddToCart(Id,MRP,PrdGrp) {
   var productAdded = false;
   try {
     var bmgId = "";
     var cartProds = getCookie("ProdID");
     if (productExists(Id)) {
       //alert('Product added already');
       return;
     }
     var prodArr = [];
     var cartLngth = 0;
     if (Id.substring(0,3) != "BMG") {
       bmgId = "BMG"+Id;
       var proddsc = document.getElementById("detURL_"+Id);
       var imageURL = document.getElementById("imgURL_"+Id).src;
       var prodnm = document.getElementById("ProdNm_"+Id).innerHTML;
       var evntType = getCookie("event_category");
       switch (PrdGrp) {
         case "Toy" : PrdGrp="Toys";break;
         case "Book" : PrdGrp="Books";break;
         case "Health & Personal Care" : PrdGrp="HealthPersonalCare";break;
         case "Office Products" : PrdGrp="OfficeProducts";break;
         case "PC Hardware" : PrdGrp="PCHardware";break;
         case "Gift Cards" : PrdGrp="GiftCards";break;
         case "Home & Garden" : PrdGrp="HomeGarden";break;
         case "Sporting Goods" : PrdGrp="SportingGoods";break;
         case "Video Games" : PrdGrp="VideoGames";break;
         case "Musical Instruments" : PrdGrp="MusicalInstruments";break;
       }
       var catg = getCatg(MRP,PrdGrp);
       var gender = getCookie("gender");
       if (gender == "Male")
         genderVal = "m";
       else
         genderVal = "f";
       var age = getCookie("age_group");
       var ageCat = [];
        if (age == '0 - 5')
          ageCat[0] = 0;
        if (age == '6 - 10')
          ageCat[0] = 1;
        if (age == '11 - 14')
          ageCat[0] = 2;
        if (age == '15 - 17')
          ageCat[0] = 3;
        if (age == '18 - 25')
          ageCat[0] = 4;
        if (age == '26 - 34')
          ageCat[0] = 5;
        if (age == '35 - 45')
          ageCat[0] = 6;
        if (age == '46 - 55')
          ageCat[0] = 7;
        if (age == '> 55')
          ageCat[0] = 8;
       //prodnm = prodnm.replace(/['"-()]+/g, ''); //need to handle escaping of /

       //trznt - Adding another item to prod called Status: Open
       var keywords = prodnm.split(' ');
       var keywordArr = "";
       for (var m = 0,n = 0; m < keywords.length; m++) {
         if (keywords[m].length >= 3) {
           if (n != 0) {
             keywordArr += ",";
           }
           keywords[m] = keywords[m].replace(/[^a-zA-Z0-9]/g, '');
           keywordArr += '"' + keywords[m].toLowerCase() + '"';
           n++;
         }
       }
       var prd = '{"ProdID":"'+bmgId+'","ProdDsc":"'+proddsc+'","ImageURL":"'+imageURL+'","ProdNm":"'+prodnm+'","Catg":"'+catg+'","MRP":"'+MRP+'","Reviewed":"TBD","MfrID":1,"InStock" : 1,"created_by":"customer","ProdGrp":"'+PrdGrp+'","eventType":["'+evntType+'"],"prodNameKeyWords":[' + keywordArr  + '], "ageCat":['+ ageCat +'], "genderCat":["' + genderVal + '"]}';
       //Throwing error if the name has quotes in it
       $.ajax({
         type : 'POST',
         url :"/addToDBByUser",
         data : {"Product":prd},
         success : function(res) {productAdded = true;},
         error : function(res) {alert("Error in adding product to cart!");return;}
       })
     } //Amazon product -- write to DB
     else {bmgId = Id};

     if (cartProds != "") {
       if (cartProds.indexOf(",") >= 0) {prodArr = cartProds.split(',');cartLngth=prodArr.length}
       else {prodArr[0]=bmgId;cartLngth=1};
       cartProds = cartProds+','+bmgId;
     }
     else (cartProds=bmgId)
     cartLngth++;
     setCookie("ProdID",cartProds,2);
     $('#addToCartComplete').modal('show');

     document.getElementById("CartId").innerHTML="Registry <span class=\"glyphicon glyphicon-gift\" aria-hidden=\"true\"></span> ("+cartLngth+")";
   }
   catch (e) {alert(e)}
 };

 function loadNewCart() {
   $.get('/New-Cart.html',function(req,res){
     //alert("Loaded");
     location.reload();
   })
 }

 function deletefrmcart(Id) {
   //var bmgId = "";
   var cartProds = getCookie("ProdID");
   var prodArr = [];
   var cartLngth = 0; var newCartLngth=0;

   if (cartProds != "") {
     if (cartProds.indexOf(",") >= 0) {prodArr = cartProds.split(',');cartLngth=prodArr.length}
     else {prodArr[0]=cartProds;cartLngth=1};
   }
   cartProds = "";
   for(var i=0;i<cartLngth;i++){if (prodArr[i] != Id) {cartProds=cartProds+prodArr[i]+',';newCartLngth++}}
   if (cartProds != "") {cartProds = cartProds.substring(0,cartProds.length-1)}
   setCookie("ProdID",cartProds,2);

   document.getElementById("CartId").innerHTML="Registry ("+newCartLngth+")";
   $("#CartId").click();
 };

function sendInvite() {
  window.location.href = "/send_invite";
}

function redirectToHome() {
  //4/16/2017 - higsboson - moved redirection to home in separate fuction & called on OK button of modal
  //3/31/2017 - trznt - Deleting cookies as they have now been stored in the database.
  deleteCookie('ProdID');
  deleteCookie('age_group');
  deleteCookie('event_date');
  deleteCookie('event_category');
  deleteCookie('gender');
  deleteCookie('eventID');

  $("#wishListURLModal").modal('hide');
  signuporlogin = "";
  // Posting to Home.
  if (signuporlogin = "login") {setCookie("NewRegistryCreated","True",2),window.location.href = "/home"}
  else if (signuporlogin = "signup") {setCookie("NewRegistryCreated","True",2),document.getElementById("signup").submit()}
}

//Amazon Search Tags need to be - [ 'All','Beauty','Grocery','Industrial','PetSupplies','OfficeProducts','Electronics','Watches','Jewelry','Luggage','Shoes','Furniture','KindleStore','Automotive','Pantry','MusicalInstruments','GiftCards','Toys','SportingGoods','PCHardware','Books','LuxuryBeauty','Baby','HomeGarden','VideoGames','Apparel','Marketplace','DVD','Appliances','Music','LawnAndGarden','HealthPersonalCare','Software' ].
// get Catg has been updated.
 function getCatg(MRP,PrdGrp) {
   var catg="";
   try {
     switch(PrdGrp) {
       case "Apparel":
       case "Books":
       case "Toys":
       case "DVD":
       case "HealthPersonalCare":
       case "Luggage":
       case "Music":
       case "OfficeProducts":
       case "PCHardware":
       case "Shoes":
       case "Jewelry":
       case "Watches": catg=PrdGrp.slice(0,1);break;
       case "Automotive": catg='C';break;
       case "Baby": catg="Y";break;
       case "Beauty": catg="U";break;
       case "Electronics": catg="E";break;//Electronics
       case "LuxuryBeauty": catg="X";break;
       case "GiftCards": catg="V";break;
       case "HomeGarden": catg="G";break;
       case "MusicalInstruments": catg="N";break;
       case "Software": catg="F";break;
       case "SportingGoods": catg="R";break;
       case "VideoGames": catg="I";break;
       case "Appliances": catg:"Q";break;
       case "Furniture": catg="K";break;
       default: catg="TBD";break;
     };
     if (MRP<=500) {catg=catg+'0'}
     else if (MRP>500 && MRP<=1000) {catg=catg+'5'}
     else if (MRP>1000 && MRP<=2000) {catg=catg+'1'}
     else if (MRP>2000 && MRP<=3000) {catg=catg+'2'}
     else {catg=catg+'3'}
  }
  catch (e) {error = e;alert("Error - "+e)};
  return catg;
 }

 function srchInAmazon(min,max,pageNum,prdGrpSel) { //called from New-Cart.html to search products in Amazon forcefully

   var srchprod = $("#searchitem").val();
   //var pageNum = $("#page-number").val();
   $('#searchingFor').text('Searching for "' + $("#searchitem").val() + '"');
   try {
     var regex = new RegExp("^[a-zA-Z0-9\\s]+$");
     if (regex.test(srchprod)) {
       $('#carousel-wrapper').replaceWith('<div class = "carousel-wrapper" id="carousel-wrapper"><div class="row"><div class="col-sm-12" style="text-align:center;padding-top:100px"><i class="fa fa-circle-o-notch fa-spin" style="font-size:96px;"></i></div></div></div>');
       $('#pageNavigation').html('');
       //alert('Page num is ' + pageNum);
       $.get( "/srchInAmazon",{PageNumber:pageNum,ProdNm:srchprod,ProdGrp:prdGrpSel,min:min,max:max}, function( data, status ) {
         if (status == 'success'){
           //alert(data);
           var htmlStr = "";
           var endStr = "";
           var prdName ="";
           var prdName1="";
           var cnt =0;
           htmlStr = '<div class = "carousel-wrapper" id="carousel-wrapper">';
           //alert(data);
           if(data.length != 0) {
             if (data != "Error in fetching products"){
               $.each(data, function(key,doc){
                 try {
                   prdName1 = doc.ProdNm.toString();
                   if (prdName1.length>60) {prdName=prdName1.slice(0,30)+'...'+prdName1.slice(-25)}
                   else {prdName=prdName1};
                   if (cnt%4 == 0){htmlStr = htmlStr + '<div class = "row">'}
                   htmlStr = htmlStr + '<div class="col-sm-3"><div class="thumbnail">';
                   htmlStr = htmlStr + '<div class="thumbnail" style="height:215px;border:0;">';
                   htmlStr = htmlStr + '<a id = "detURL_'+doc.ProdID+'" href='+doc.ProdDsc+' target="_blank">';
                   htmlStr = htmlStr + '<img id = "imgURL_'+doc.ProdID+'" src='+doc.ImageURL+'>';
                   htmlStr = htmlStr + '<div class="caption"><p id="ProdNm_'+doc.ProdID+'" align="middle">'+prdName+'</p></div></div>';
                   htmlStr = htmlStr + '<div class="caption"><p align="middle"> &#8377;'+doc.MRP+'</p></div></a>';
                   htmlStr = htmlStr + '<p align="middle"><button type="button" class="btn btn-warning" id="addtocart_'+cnt+'" onclick="AddToCart(\''+doc.ProdID+'\',\''+doc.MRP+'\',\''+doc.ProdGrp+'\')">Add to registry</button></p>';
                   //htmlStr = htmlStr + '<p align="middle"><button type="button" class="btn btn-default" id="addtocart_'+cnt+'" onclick="AddToCartUserProd(\''+doc.ProdID+'\',\''+doc.MRP+'\',\''+doc.ProdGrp+'\',\''+prdName1+'\')">Add to wishlist</button></p>';
                   htmlStr = htmlStr + '</div></div>'
                   cnt++;
                   if (cnt%4 == 0){htmlStr = htmlStr + "</div>"};
                 }
                 catch (e) {}
               }) //for eachs
               if (cnt%4 != 0) {htmlStr = htmlStr + '</div>'};
               htmlStr = htmlStr +'<div class="row"><div class="col-sm-2">';
               var prevPage=pageNum-1;
               var nextPage=pageNum+1;
               if (pageNum > 1) {htmlStr = htmlStr +'<button type="button" class="btn btn-primary" id="prevButton" onclick="srchInAmazon(' + min + ',' + max + ','+prevPage+',\''+prdGrpSel+'\')">Previous Page</button>'}
               htmlStr = htmlStr +'</div><div class="col-sm-8"></div>';
               if ($('#amazonLastPage').val() == "100" || $('#amazonLastPage').val() != pageNum) {
                 htmlStr = htmlStr + '<div class="col-sm-2"><button type="button" class="btn btn-primary" id="nextButton" onclick="srchInAmazon(' + min + ',' + max + ','+nextPage+',\''+prdGrpSel+'\')">Next Page</button></div>';
               } else if ($('#amazonLastPage').val() == pageNum) {
                 htmlStr = htmlStr + '<div class="col-sm-2"></div>';
               }
               htmlStr = htmlStr + '<hr></div><br><br>';
               $("#page-number").val(pageNum);
               //alert(htmlStr);
               $('#carousel-wrapper').replaceWith(htmlStr);
             } else {
               alert('Search has failed. Please try again');
             }
           } else {
             if(pageNum > 1) {
              htmlStr += '<div class="row"><div class="col-sm-12" style="padding-top:100px;text-align:center"><h2>Sorry, we were unable to find any more matches. Why not search for something different?</h2>' + '<button type="button" class="btn btn-primary" id="prevButton" onclick="srchInAmazon(' + min + ',' + max + ','+(parseInt(pageNum) - 1)+',\''+prdGrpSel+'\')">Previous</button>' + '</div></div></div>';
              $('#amazonLastPage').val((parseInt(pageNum) - 1));
             }
             else
              htmlStr += '<div class="row"><div class="col-sm-12" style="padding-top:100px;text-align:center"><h2>Sorry, we were unable to find a match. Why not search for something different?</h2></div></div></div>'
             $('#carousel-wrapper').replaceWith(htmlStr);
           }

         }
         else {
           alert('There as been an error');
         }
       })
     }
     else {
       $('#pageNavigation').html('');
       if (prdGrpSel == 'All') {
         $('#searchHeading').text("Searching all products:")
       } else {
         $('#searchHeading').text("Searching in " + prdGrpSel)
       }
       $("#textSearchKeyModal").modal('show')}
       document.body.scrollTop = document.documentElement.scrollTop = 0;
       $("#searchItemForm").addClass("has-error");
       $("#searchbutton").attr("onclick","$('#amazonLastPage').val('" + 100 + "');srchInAmazon(" + min + "," + max + "," + pageNum + ",'" + prdGrpSel + "')");
       $("#searchbutton").unbind("click");
    } catch (e) {alert(e.message)}
 }

function logout() {
  $.ajax({
    type : 'GET',
    url :"/logout",
    success : function(res) {window.location.href = "/";},
    error : function(res) {alert("Error logging out")}
  })
}



function getDateFromUTC(date) {

  var utcdate = new Date(date);
  var ist = utcdate;
  return moment(ist).format("DD-MMM-YYYY h:mm a");

}

function getFeaturedProducts(event_type,div,holder) {
  $.ajax({
    type: 'GET',
    url: '/getFeaturedProducts',
    data : {"event":event_type},
    success : function(res) {
      //alert('Prod list is ' + JSON.stringify(res));
      var htmlContent = "";
      for (var i = 0;i < res.length;i++) {
        htmlContent += "<div class='featured featured-products'>";
        if (res[i].ProdNm.length > 30) {
          //alert('size greater than 30');
          var dislaydata = res[i].ProdNm.substring(0,27);
          dislaydata += "...";
          var condensed_array = res[i].ProdNm.split(' ').join('_ ').split(' ');
          var condensed = "";
          var linelength = 0;;
          for (var n = 0;n < condensed_array.length;n++) {
            if ((condensed_array[n].length + linelength) < 30) {
              condensed += condensed_array[n];
              linelength += condensed_array[n].length;
            } else {
              linelength = condensed_array[n].length;
              condensed = condensed + '<br>' + condensed_array[n];
            }
          }
          htmlContent += '<div class="tooltip1">' + dislaydata + '<span class="tooltiptext">' + condensed.split('_').join(' ') + '</span></div>'
        } else {
          htmlContent += "<div>" + res[i].ProdNm + "</div>";
        }
        //res[i].ImageURL = res[i].ImageURL.replace(/\//g, "\\/");
        htmlContent += "<br/><div class='featured-image' style=\"background:url(\'" + res[i].ImageURL + "\') no-repeat center center\"></div>";
        htmlContent += "<br/><div class=\"featured-price\"> &#8377;" + res[i].MRP + "</div>"
        htmlContent += "<br/><div class=\"amz-note\">(as of " + getDateFromUTC(res[i].UpdDate) + " IST - <a data-toggle='modal' href='#amzDisclaimer'>Details</a>)</div></div>"

      }
      $('#' + holder).addClass("featured-container");
      $('#' + div).html(htmlContent);
    },
    error : function(res) {
      alert('Unable to get product list');
    }
  })
}

function toggleTrending(cat) {

    //alert('loc hash ' + location.hash.length)
    if (location.hash == '' &&  $('#showTrending').val() == "False") {
      $('#showTrending').val(cat);
      location.hash = cat;
    } else if (location.hash == '#Birthday' &&  $('#showTrending').val() == "Birthday"){
      //alert('replacing bday')
      $('#showTrending').val("False");
      location.hash = '';
    } else if (location.hash == '#HouseWarming' &&  $('#showTrending').val() == "HouseWarming"){
      //alert('replacing bday')
      $('#showTrending').val("False");
      location.hash = '';
    } else if (location.hash == '#Baby' &&  $('#showTrending').val() == "Baby"){
      //alert('replacing bday')
      $('#showTrending').val("False");
      location.hash = '';
    } else if (location.hash == '#Wedding' &&  $('#showTrending').val() == "Wedding"){
      //alert('replacing bday')
      $('#showTrending').val("False");
      location.hash = '';
    } else if (location.hash == '#Special' &&  $('#showTrending').val() == "Special"){
      //alert('replacing bday')
      $('#showTrending').val("False");
      location.hash = '';
    }


    /*if ($('#showTrending').val() == "True") {
      alert('replacing' + location.hash);
      location.hash.replace('#','');
      $('#showTrending').val("False");
    }
    else {
      $('#showTrending').val("True");
      location.hash = cat;
    }*/

}


function showBdayProducts() {
  toggleTrending('Birthday');
  $('html, body').animate({
        scrollTop: $("#marketing-row").offset().top - 100
    }, 400);
  if($("#bdayProducts").css('display') == 'none') {
    $('#marketing-row2').css("display","none");
    getFeaturedProducts("Birthday","bdayProductsInfo","bdayProducts");
    $("#bdayProducts").slideDown();
    $("#house-marketing").slideUp();
    $("#baby-marketing").slideUp('fast', function() {
      if ($("#bday-side-bar").length == 0)
        $("#marketing-row").append('<div class="col-lg-8 marketing-headlines" id="bday-side-bar"><p style="text-align:right;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>On your<br> special day. </b></p></div>')
      else
        $("#bday-side-bar").css("display","block");
      })
      $('#bday-a-link').text("Back");
  }
  else if($("#bdayProducts").css('display') == 'block') {
      $('#marketing-row2').css("display","block");
      $("#bdayProducts").slideUp();
      $("#house-marketing").slideDown();
      $("#baby-marketing").slideDown();
      $("#bday-side-bar").css("display","none");
      $('#bday-a-link').text("Trending Gifts " + $('#raqval').text());
    }
}

function showHomeProducts() {
  toggleTrending('HouseWarming');
  $('html, body').animate({
        scrollTop: $("#marketing-row").offset().top - 100
    }, 400);
  if($("#homeProducts").css('display') == 'none') {
    $('#marketing-row2').css("display","none");
    getFeaturedProducts("House Warming","homeProductsInfo","homeProducts");
    $("#homeProducts").slideDown();
    $("#baby-marketing").slideUp();
  //  $("#house-marketing").css("-webkit-transform","translateX(-200px)");
  //  $("#house-marketing").css("transform","translateX(-200px)");
    $("#bday-marketing").slideUp('fast', function() {
      if ($("#home-side-bar").length == 0)
        $("#marketing-row").append('<div class="col-lg-8 marketing-headlines" id="home-side-bar"><p style="text-align:right;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>Home,<br> Sweet Home. </b></p></div>')
      else
        $("#home-side-bar").css("display","block");
      })
      $('#house-a-link').text("Back");
  }
  else if($("#homeProducts").css('display') == 'block') {
    $('#marketing-row2').css("display","block");
      $("#homeProducts").slideUp();
      $("#bday-marketing").slideDown();
      $("#baby-marketing").slideDown();
      $("#home-side-bar").css("display","none");
      $('#house-a-link').text("Trending Gifts " + $('#raqval').text());
    }
}

function showBabyProducts() {
  toggleTrending('Baby');
  $('html, body').animate({
        scrollTop: $("#marketing-row").offset().top - 100
    }, 400);
  if($("#babyProducts").css('display') == 'none') {
    $('#marketing-row2').css("display","none");
    getFeaturedProducts("Baby Shower","babyProductsInfo","babyProducts");
    $("#babyProducts").slideDown();
    $("#bday-marketing").slideUp();
  //  $("#house-marketing").css("-webkit-transform","translateX(-200px)");
  //  $("#house-marketing").css("transform","translateX(-200px)");
    $('#backup').val($("#marketing-row").html());
    $("#house-marketing").slideUp('fast', function() {
      if ($("#baby-side-bar").length == 0) {
        $("#marketing-row").html('<div class="col-lg-8 marketing-headlines" id="baby-side-bar"><p style="text-align:left;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For your<br> bundle of joy. </b></p></div><div class="col-lg-4" id="baby-marketing">                 <a href="#" onclick="checkEvents(\'Baby Shower\');"><img class="img-circle" src="images/babyshower.png" alt="Generic placeholder image" width="140" height="140"></a> <h2 class="marketing-headlines"><b><a href="#" style="text-decoration:none;color:#000000" onclick="checkEvents(\'Baby Shower\');">Baby Showers!</a></b></h2>  <p>For the mom-to-be. One of the most special days of your life! Build your baby shower gift list with clothes and toys for the little one and also for the new Mommy! Check out our very special range of gifts. </p> <p><a class="btn btn-default" id="baby-a-link"  role="button" onclick="showBabyProducts();">Back</a></p>    </div>')
        //$("#marketing-row").append('<div class="col-lg-8 marketing-headlines" id="baby-side-bar"><p style="text-align:right;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For your<br> bundle of joy. </b></p></div>')
      }
      else
        $("#baby-side-bar").css("display","block");
      })
      $('#baby-a-link').text("Back");
  }
  else if($("#babyProducts").css('display') == 'block') {
    $('#marketing-row2').css("display","block");
      $("#marketing-row").html($('#backup').val());
      $("#babyProducts").slideUp();
      $("#bday-marketing").slideDown();
      $("#house-marketing").slideDown();
      $("#baby-side-bar").css("display","none");
      $('#baby-a-link').text("Trending Gifts " + $('#raqval').text());
    }
}

function showWeddingProducts() {
  toggleTrending('Wedding');
  $('html, body').animate({
        scrollTop: $("#marketing-row2").offset().top - 100
    }, 400);
  if($("#wedProducts").css('display') == 'none') {
    $('#marketing-row').css("display","none");
    getFeaturedProducts("Wedding","wedProductsInfo","wedProducts");
    $("#wedProducts").slideDown();
  //  $("#house-marketing").css("-webkit-transform","translateX(-200px)");
  //  $("#house-marketing").css("transform","translateX(-200px)");
    $('#backup').val($("#marketing-row2").html());
    $("#spcl-marketing").slideUp('fast', function() {
      if ($("#wed-side-bar").length == 0) {
        $("#marketing-row2").html('<div class="col-lg-4" id="wed-marketing"> <a href="#" onclick="checkEvents(\'Wedding\');"><img class="img-circle" src="images/wedding1.jpeg" alt="Generic placeholder image" width="140" height="140"></a> <h2 class="marketing-headlines"><b><a href="#" style="text-decoration:none;color:#000000" onclick="checkEvents(\'Wedding\');">Weddings!</a></b></h2>  <p>The biggest party of your life! The beginning of a great new adventure with the one you love! Let\'s make sure you are all set to begin this journey. Have a look at our amazing wedding gift collection.  </p> <p><a class="btn btn-default" id="wed-a-link"  role="button" onclick="showWeddingProducts();">Back</a></p>    </div><div class="col-lg-8 marketing-headlines" id="wed-side-bar"><p style="text-align:right;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For your<br> Happily Everafter. </b></p></div>')
        //$("#marketing-row").append('<div class="col-lg-8 marketing-headlines" id="baby-side-bar"><p style="text-align:right;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For your<br> bundle of joy. </b></p></div>')
      }
      else
        $("#wed-side-bar").css("display","block");
      })
      $('#wed-a-link').text("Back");
  }
  else if($("#wedProducts").css('display') == 'block') {
    $('#marketing-row').css("display","block");
      $("#marketing-row2").html($('#backup').val());
      $("#wedProducts").slideUp();
      $("#spcl-marketing").slideDown();
      $("#wed-side-bar").css("display","none");
      $('#wed-a-link').text("Trending Gifts " + $('#raqval').text());
    }
}

function showSpclProducts() {
  toggleTrending('Special');
  $('html, body').animate({
        scrollTop: $("#marketing-row2").offset().top - 100
    }, 400);
  if($("#spclProducts").css('display') == 'none') {
    $('#marketing-row').css("display","none");
    getFeaturedProducts("Special Category","spclProductsInfo","spclProducts");
    $("#spclProducts").slideDown();
  //  $("#house-marketing").css("-webkit-transform","translateX(-200px)");
  //  $("#house-marketing").css("transform","translateX(-200px)");
    $('#backup').val($("#marketing-row2").html());
    $("#wed-marketing").slideUp('fast', function() {
      if ($("#spcl-side-bar").length == 0) {
        $("#marketing-row2").html('<div class="col-lg-8 marketing-headlines" id="spcl-side-bar"><p style="text-align:left;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For every<br> Special Occasion. </b></p></div><div class="col-lg-4" id="spcl-marketing"> <a href="#" onclick="checkEvents(\'A Special Event\');"><img class="img-circle" src="images/special_events.jpeg" alt="Generic placeholder image" width="140" height="140"></a> <h2 class="marketing-headlines"><b><a href="#" style="text-decoration:none;color:#000000" onclick="checkEvents(\'A Special Event\');">Special Events!</a></b></h2>  <p>Celebrating a bridal shower, a graduation or for the holiday season, create a gift registry with us to let people know what to get you for the occasion. Take a peek to see our cool selection of gifts. </p> <p><a class="btn btn-default" id="spcl-a-link"  role="button" onclick="showSpclProducts();">Back</a></p>    </div>')
        //$("#marketing-row").append('<div class="col-lg-8 marketing-headlines" id="baby-side-bar"><p style="text-align:right;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For your<br> bundle of joy. </b></p></div>')
      }
      else
        $("#spcl-side-bar").css("display","block");
      })
      $('#spcl-a-link').text("Back");
  }
  else if($("#spclProducts").css('display') == 'block') {
    $('#marketing-row').css("display","block");
      $("#marketing-row2").html($('#backup').val());
      $("#spclProducts").slideUp();
      $("#wed-marketing").slideDown();
      $("#spcl-side-bar").css("display","none");
      $('#spcl-a-link').text("Trending Gifts " + $('#raqval').text());
    }
}

function doAdminLogin(action) {
  try {
    //alert("logging in with " + $(login_username).val() + " and " + $(login_password).val());
    $.ajax({
      type: 'POST',
      url: '/getSaltForAdminUser',
      data: {user: $('#admin_username').val()},
      success: function (salt) {
       //alert(salt);
       var sha256 = new jsSHA('SHA-256', 'TEXT');
       //alert("admin password is " + $('#admin_password').val());
       sha256.update($('#admin_password').val() + salt);
       var hash = sha256.getHash("HEX");
       //alert("Hashed val" + hash);
       $.ajax({
         type: 'POST',
         url: '/getsalt',
         success: function (newsalt) {
          //alert(newsalt);
          var sha2562 = new jsSHA('SHA-256', 'TEXT');
          sha2562.update(newsalt + hash);
          var newhash = sha2562.getHash("HEX");
          //alert("New calculated Salt" + newhash);
          $.ajax({
            type: 'POST',
            url: '/pAdminLogin',
            data: {attempt: newhash,gensalt: newsalt,user: $('#admin_username').val()},
            success: function (data) {
             //alert("Performing Login: Result is " + data);
             if (action == "") {
               window.location.href = "/admin";
             }
           },
           error: function (err) {
             alert("Unable to login")
           }
         });
        },
        error: function (err) {
          alert("Unable to login")
        }
      });
      },
      error: function (err) {
        alert("Unable to save wishlist")
      }
    })
  }
  catch (e) {alert("Error!!! - "+e)}
}


function getCheckBoxCategory(val) {
  if ("A" == val) return "Apparel";
  if ("C" == val) return "Automobile";
  if ("Q" == val) return "Appliances";
  if ("Y" == val) return "Baby Items";
  if ("U" == val) return "Beauty Products";
  if ("B" == val) return "Books";
  if ("D" == val) return "DVD";
  if ("E" == val) return "Electronics";
  if ("K" == val) return "Furniture";
  if ("V" == val) return "Gift Cards";
  if ("H" == val) return "Health & Personal Care";
  if ("G" == val) return "Home & Garden";
  if ("J" == val) return "Jewelry";
  if ("L" == val) return "Luggage";
  if ("X" == val) return "Luxury Beauty";
  if ("M" == val) return "Music";
  if ("N" == val) return "Musical Instruments";
  if ("O" == val) return "Office Products";
  if ("P" == val) return "PC Hardware";
  if ("S" == val) return "Shoes";
  if ("F" == val) return "Software";
  if ("R" == val) return "Sports Goods";
  if ("T" == val) return "Toys";
  if ("I" == val) return "Video Games";
  if ("W" == val) return "Watches";
  else return "All";
}

function getAmazonSearchCode(val) {
  if ("A" == val) return "Apparel";
  if ("C" == val) return "Automobile";
  if ("Q" == val) return "Appliances";
  if ("Y" == val) return "Baby";
  if ("U" == val) return "Beauty";
  if ("B" == val) return "Books";
  if ("D" == val) return "DVD";
  if ("E" == val) return "Electronics";
  if ("K" == val) return "HomeGarden";
  if ("V" == val) return "GiftCards";
  if ("H" == val) return "HealthPersonalCare";
  if ("G" == val) return "HomeGarden";
  if ("J" == val) return "Jewelry";
  if ("L" == val) return "Luggage";
  if ("X" == val) return "Beauty";
  if ("M" == val) return "Music";
  if ("N" == val) return "MusicalInstruments";
  if ("O" == val) return "OfficeProducts";
  if ("P" == val) return "PCHardware";
  if ("S" == val) return "Shoes";
  if ("F" == val) return "Software";
  if ("R" == val) return "SportingGoods";
  if ("T" == val) return "Toys";
  if ("I" == val) return "VideoGames";
  if ("W" == val) return "Watches";
  else return "All";
}


function clean(input) {
  var regEx = /<|>/g;
  return input.replace(regEx," ");
}

function saveMessage(id,uid) {
  //alert('Saving Message for ' + id);
  var message = clean($('#message').val());
  $.ajax({
    url: '/saveMessage',
    method: 'POST',
    data: {message: message,id :id,uid: uid},
    success :  function (res) {
      //alert("Message Saved " + res);
    },
    error : function (err) {
      //alert("Message Not Saved " + err)
    }
  });
  deleteCookie("NewRegistryCreated");
  deleteCookie('event_name');
  deleteCookie('wishlistIdReference');
  deleteCookie('UIDReference');
}

function saveMessageDefault(id,uid) {
  var text = "Hello, \n\n Thanks very much for taking the time to go through my gift registry. \n\n See you Soon :)"
  $.ajax({
    url: '/saveMessage',
    method: 'POST',
    data: {message: text,id :id,uid :uid},
    success :  function (res) {
      //alert("Message Saved " + res);
    },
    error : function (err) {
      //alert("Message Not Saved " + err)
    }
  });
  deleteCookie("NewRegistryCreated");
  deleteCookie('event_name');
  deleteCookie('wishlistIdReference');
  deleteCookie('UIDReference');
}

function stringDivider(str, width, spaceReplacer) {//splits the string after specified characters
  if (str.length>width) {
    var p=width
    for (;p>0 && str[p]!=' ';p--) {
    }
    if (p>0) {
        var left = str.substring(0, p);
        var right = str.substring(p+1);
        return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
    }
  }
  return str;
}
