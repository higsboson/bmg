  // Added for all date calculations
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  var signuporlogin = "";

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
              data: {attempt: newhash,gensalt: newsalt,user: $('#user').val()},
              success: function (data) {
               //alert("Performing Login: Result is " + data);
               if (data == "Login Success") {
                 //alert('login with existing password is success.');
                 $.ajax({
                   type: 'POST',
                   url: '/getPasswordChangeSalt',
                   success: function (salt_for_new_pass) {
                    alert("Got Salt for new Password" + salt);
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
                          alert("Password Change is " + res);
                        },
                        error : function(res) {alert("Error Changing Password!")}
                      })
                   },
                   error: function (err) {
                     alert("Unable to save wishlist")
                   }
                 })
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
    try {
      //alert("logging in with " + $(login_username).val() + " and " + $(login_password).val());
      $.ajax({
        type: 'POST',
        url: '/getSaltForUser',
        data: {user: $(login_username).val()},
        success: function (salt) {
         //alert(salt);
         var sha256 = new jsSHA('SHA-256', 'TEXT');
         sha256.update($(login_password).val() + salt);
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
              data: {attempt: newhash,gensalt: newsalt,user: $(login_username).val()},
              success: function (data) {
               //alert("Performing Login: Result is " + data);
               if (data == "Login Success") {
                 if (action == 'saveWishList') {
                   var eventDate = getCookie("event_date");
                   var eventType = getCookie("event_category");
                   var selProducts = getCookie("ProdID");
                   var event_name = getCookie("event_name");
                   var wishList = '{"EventName" :"'+ event_name +'", "EventDate" : "'+eventDate+'", "EventType" : "'+eventType+'", "UsrName" : "'+$(login_username).val()+'",';
                   wishList = wishList + ' "ProductIDs" : "'+ selProducts+ '"}';
                   $.ajax({
                       type : 'POST',
                       url :"/saveWishlist",
                       data : {"Wishlist":wishList},
                       success : function(res) {
                         //The following alert will need to be replaced by a modal dialog
                         document.getElementById("wishListLink").innerHTML = res;
                         signuporlogin = "login";
                         $("#signUpOrNot").modal('hide');
                         $("#wishListURLModal").modal('show');

                       },
                       error : function(res) {alert("Error in saving wishlist!")}
                     })
                 }
                 else if(action == "") {
                   window.location.href = "/home";
                 }
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
   htmlStr = htmlStr+'<div class="row"><div class="container save_wishlist"><div class="list-group-create-registry">';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "event_name">Name of the event: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="text" class="form-control" id="event_name" value="'+eventName+'"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "hostfullname">Your name: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><div class="form-group" id="form_group_hostfullname"><input type="text" class="form-control" id="hostfullname" placeholder="e.g. Will Smith"></div></div></div>';
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
   $( "#emailaddr" )
    .focusout(function() {
      if ($('#emailaddr').val().length > 0)
      $.ajax({
        type: 'GET',
        url: '/checkIfEmailExists',
        data: {email: $('#emailaddr').val()},
        success: function (res) {
          alert ("Email is " + res);
          if (res == "EmailDoesNotExist")
            $('#emailvalidate').val("1");
            else
              $('#emailvalidate').val("0");
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


//4/22/2017 - trznt
//Getting Data of WishList item
function getListData(id,name,mode) {
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
      data : {"id":id},
      success : function(res) {
        //The following alert will need to be replaced by a modal dialog
            var data = '';
            var boughtCount = 0;
            //alert(JSON.stringify(res));
            //alert(res);
            data += '<table>';
            for (i = 0;i < res.Products.length; i++) {
                data += '<tr>';
                data += '<td><a href="' + res.Products[i].ProdDsc + '" target="_blank"><img src="' + res.Products[i].ImageURL + '"></a></td>';
                data += '<td style="padding:10px">';
                data += '<a href="' + res.Products[i].ProdDsc + '" target="_blank"><font color="#2B547E" size="3">' +  res.Products[i].ProdNm + '</font></a><br>';
                data += 'Price:  &#8377;' +  res.Products[i].MRP + '<br>';
                if (res.Products[i].Status == "Available")
                  data += 'Gift Status: <b><font color="#FFA62F">Pending Purchase</font></b>';
                else
                   data += 'Gift Status: <b><font color="#348781">Purchased</font></b>';
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
              $('#wishListLink').html('<table><tr><td><p class="summary" style="padding-top:8px">Link to this wishlist: </p></td><td><div class="help-tip">	<p>To share this wishlist with your friends and family, pass along this link.</p> </div></td></tr></table> <input class="form-control" value="http://'+ window.location.hostname + ':8080/showWishList?eventID=' + id + '" id="wishListLinkUrl" readonly>');
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
        data += '<div class="col-sm-6" style="text-align:center"><div class="form-group"><input type="text" class="form-control" value="' + res[0].HostEmail + '" name="email" readonly><input type="hidden" name="_id" value="' + res[0]._id + '"></div></div></div>';
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
   $.ajax({
       type : 'GET',
       url :"/getUserWishLists",
       data : {"userid":user,"mode":mode},
       success : function(res) {
         //The following alert will need to be replaced by a modal dialog
             //alert(JSON.stringify(res));
             if (res.length >=1) {
               var table_text = '<table class="table table-hover" style="background:#FFFFFF;color:#000000"><thead style="background:#454282;color:#FFFFFF"><tr><th>#</th><th>Event Name</th><th>Event Type</th><th>Event Date</th></tr></thead><tbody>';
               for (i = 0; i < res.length ;i++) {
                 var d = new Date(res[i].EventDate);
                 var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear();
                 if (mode)
                  table_text += '<tr data-toggle="modal" data-target="#viewWishListModal" onclick="getListData(\'' + res[i]._id + '\',\'' + res[i].EventName +  '\',1)" style="cursor:pointer;" ><th scope="row">' + (i + 1) + '</th><td>' + res[i].EventName + '</td><td>' + res[i].EventType + '</td><td>' + datestring + '</td></tr>';
                 else
                  table_text += '<tr data-toggle="modal" data-target="#viewOldWishListModal" onclick="getListData(\'' + res[i]._id + '\',\'' + res[i].EventName +  '\',0)" style="cursor:pointer;" ><th scope="row">' + (i + 1) + '</th><td>' + res[i].EventName + '</td><td>' + res[i].EventType + '</td><td>' + datestring + '</td></tr>';
               }
              table_text += '</tbody></table>';
              if (mode)
                $('#' + divactive).append("<h2>Here are the wishlists for your upcoming events. </h2><br><br>" + table_text);
              else
                $('#' + divactive).append("<h2>These are wishlists for completed events. </h2><br><br>" + table_text);

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


 function AddToCart(Id,MRP,PrdGrp) {
   try {
     var bmgId = "";
     var cartProds = getCookie("ProdID");
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
       var prd = '{"ProdID":"'+bmgId+'","ProdDsc":"'+proddsc+'","ImageURL":"'+imageURL+'","ProdNm":"'+prodnm+'","Catg":"'+catg+'","MRP":"'+MRP+'","ProdGrp":"'+PrdGrp+'","eventType":["'+evntType+'"]}';
       //Throwing error if the name has quotes in it
       $.ajax({
         type : 'POST',
         url :"/addToDB",
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

   document.getElementById("CartId").innerHTML="Cart ("+newCartLngth+")";
   $("#CartId").click();
 };

function redirectToHome() {
  //4/16/2017 - higsboson - moved redirection to home in separate fuction & called on OK button of modal
  //3/31/2017 - trznt - Deleting cookies as they have now been stored in the database.
  deleteCookie('ProdID');
  deleteCookie('age_group');
  deleteCookie('event_date');
  deleteCookie('event_category');
  deleteCookie('event_name');
  deleteCookie('gender');

  $("#wishListURLModal").modal('hide');
  signuporlogin = "";
  // Posting to Home.
  if (signuporlogin = "login") {window.location.href = "/home"}
  else if (signuporlogin = "signup") {document.getElementById("signup").submit()}
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
       case "Watches": catg=PrdGrp.slice(0,1);break;
       case "Automotive": catg='C';break;
       case "Baby": catg="Y";break;
       case "Beauty": catg="U";break;
       case "Electronics": catg="E";break;//Electronics
       case "Experiences": catg="X";break;
       case "GiftCards": catg="V";break;
       case "HomeGarden": catg="G";break;
       case "MusicalInstruments": catg="N";break;
       case "Software": catg="F";break;
       case "SportingGoods": catg="R";break;
       case "VideoGames": catg="I";break;
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

 function srchInAmazon() { //called from New-Cart.html to search products in Amazon forcefully
   var srchprod = $("#searchitem").val();

   $.get( "/srchInAmazon",{ProdNm:srchprod}, function( data, status ) {
     if (status == 'success'){
       var htmlStr = "";
       var endStr = "";
       var prdName ="";
       var cnt =0;
       htmlStr = '<hr><div class = "carousel-wrapper" id="carousel-wrapper">';
       $.each(data, function(key,doc){
         try {
           prdName = doc.ProdNm;
           if (cnt%4 == 0){htmlStr = htmlStr + '<div class = "row">'}
           htmlStr = htmlStr + '<div class="col-sm-3"><div class="thumbnail">';
           htmlStr = htmlStr + '<div class="thumbnail" style="height:215px;border:0;">';
           htmlStr = htmlStr + '<a id = "detURL_'+doc.ProdID+'" href='+doc.ProdDsc+' target="_blank">';
           htmlStr = htmlStr + '<img id = "imgURL_'+doc.ProdID+'" src='+doc.ImageURL+'>';
           htmlStr = htmlStr + '<div class="caption"><p id="ProdNm_'+doc.ProdID+'" align="middle">'+prdName+'</p></div></div>';
           htmlStr = htmlStr + '<div class="caption"><p align="middle"> INR '+doc.MRP+'</p></div></a>';
           htmlStr = htmlStr + '<p align="middle"><button type="button" class="btn btn-default" id="addtocart_'+cnt+'" onclick=AddToCart("'+doc.ProdID+'","'+doc.MRP+'","'+doc.ProdGrp+'")>Add to wishlist</button></p>';
           htmlStr = htmlStr + '</div></div>'
           cnt++;
           if (cnt%4 == 0){htmlStr = htmlStr + "</div>"};
        }
        catch (e) {}
      }) //for eachs
       if (cnt%4 != 0) {htmlStr = htmlStr + "</div>"};

       htmlStr = htmlStr + '<hr></div>';

       $('#carousel-wrapper').replaceWith(htmlStr);
   }
 })
}

function logout() {
  $.ajax({
    type : 'GET',
    url :"/logout",
    success : function(res) {window.location.href = "/";},
    error : function(res) {alert("Error logging out")}
  })
}

function getFeaturedProducts(event_type,div) {
  $.ajax({
    type: 'GET',
    url: '/getFeaturedProducts',
    data : {"event":event_type},
    success : function(res) {
      //alert('Prod list is ' + JSON.stringify(res));
      var htmlContent = "";
      for (var i = 0;i < res.length;i++) {
        htmlContent += "<div class='featured featured-products'>";
        htmlContent += "<div>" + res[i].ProdNm + "</div>";
        //res[i].ImageURL = res[i].ImageURL.replace(/\//g, "\\/");
        htmlContent += "<br/><div class='featured-image' style=\"background:url(\'" + res[i].ImageURL + "\') no-repeat center center\"></div>";
        htmlContent += "<br/><div class=\"featured-price\"> &#8377;" + res[i].MRP + "</div></div>"
      }
      $('#' + div).html(htmlContent);
    },
    error : function(res) {
      alert('Unable to get product list');
    }
  })
}

function showBdayProducts() {
  $('html, body').animate({
        scrollTop: $("#marketing-row").offset().top - 100
    }, 400);
  $("#bdayProducts").addClass("featured-container");
  if($("#bdayProducts").css('display') == 'none') {
    getFeaturedProducts("Birthday","bdayProductsInfo");
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
      $("#bdayProducts").slideUp();
      $("#house-marketing").slideDown();
      $("#baby-marketing").slideDown();
      $("#bday-side-bar").css("display","none");
      $('#bday-a-link').text("View Gifts " + $('#raqval').text());
    }
}

function showHomeProducts() {
  $('html, body').animate({
        scrollTop: $("#marketing-row").offset().top - 100
    }, 400);
  $("#homeProducts").addClass("featured-container");
  if($("#homeProducts").css('display') == 'none') {
    getFeaturedProducts("House Warming","homeProductsInfo");
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
      $("#homeProducts").slideUp();
      $("#bday-marketing").slideDown();
      $("#baby-marketing").slideDown();
      $("#home-side-bar").css("display","none");
      $('#house-a-link').text("View Gifts " + $('#raqval').text());
    }
}

function showBabyProducts() {
  $('html, body').animate({
        scrollTop: $("#marketing-row").offset().top - 100
    }, 400);
  $("#babyProducts").addClass("featured-container");
  if($("#babyProducts").css('display') == 'none') {
    getFeaturedProducts("Baby Shower","babyProductsInfo");
    $("#babyProducts").slideDown();
    $("#bday-marketing").slideUp();
  //  $("#house-marketing").css("-webkit-transform","translateX(-200px)");
  //  $("#house-marketing").css("transform","translateX(-200px)");
    $('#backup').val($("#marketing-row").html());
    $("#house-marketing").slideUp('fast', function() {
      if ($("#baby-side-bar").length == 0) {
        $("#marketing-row").html('<div class="col-lg-8 marketing-headlines" id="baby-side-bar"><p style="text-align:left;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For your<br> bundle of joy. </b></p></div><div class="col-lg-4" id="baby-marketing">                 <img class="img-circle" src="images/babyshower.png" alt="Generic placeholder image" width="140" height="140"> <h2 class="marketing-headlines">Baby Showers!</h2>  <p>For the mom-to-be. One of the most special days of your life! Build your baby shower gift list with clothes and toys for the little one and also for the new Mommy! Check out our very special range of gifts. </p> <p><a class="btn btn-default" id="baby-a-link"  role="button" onclick="showBabyProducts();">Back</a></p>    </div>')
        //$("#marketing-row").append('<div class="col-lg-8 marketing-headlines" id="baby-side-bar"><p style="text-align:right;padding:20px;padding-bottom:100px;background-color:#ffffff;font-size:100px;color:#454282"> <b>For your<br> bundle of joy. </b></p></div>')
      }
      else
        $("#baby-side-bar").css("display","block");
      })
      $('#baby-a-link').text("Back");
  }
  else if($("#babyProducts").css('display') == 'block') {
      $("#marketing-row").html($('#backup').val());
      $("#babyProducts").slideUp();
      $("#bday-marketing").slideDown();
      $("#house-marketing").slideDown();
      $("#baby-side-bar").css("display","none");
      $('#baby-a-link').text("View Gifts " + $('#raqval').text());
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
       alert(salt);
       var sha256 = new jsSHA('SHA-256', 'TEXT');
       alert("admin password is " + $('#admin_password').val());
       sha256.update($('#admin_password').val() + salt);
       var hash = sha256.getHash("HEX");
       alert("Hashed val" + hash);
       $.ajax({
         type: 'POST',
         url: '/getsalt',
         success: function (newsalt) {
          alert(newsalt);
          var sha2562 = new jsSHA('SHA-256', 'TEXT');
          sha2562.update(newsalt + hash);
          var newhash = sha2562.getHash("HEX");
          alert("New calculated Salt" + newhash);
          $.ajax({
            type: 'POST',
            url: '/pAdminLogin',
            data: {attempt: newhash,gensalt: newsalt,user: $('#admin_username').val()},
            success: function (data) {
             alert("Performing Login: Result is " + data);
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
