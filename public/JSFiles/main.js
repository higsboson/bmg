  // Added for all date calculations
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;


  function doLogin(action) {
    alert("logging in with " + $(login_username).val() + " and " + $(login_password).val());
    $.ajax({
      type: 'POST',
      url: '/getSaltForUser',
      data: {user: $(login_username).val()},
      success: function (salt) {
       alert(salt);
       var sha256 = new jsSHA('SHA-256', 'TEXT');
       sha256.update($(login_password).val() + salt);
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
            url: '/plogin',
            data: {attempt: newhash,gensalt: newsalt,user: $(login_username).val()},
            success: function (data) {
             alert("Performing Login: Result is " + data);
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
                         alert(res);

                     //3/31/2017 - trznt - Deleting cookies as they have now been stored in the database.
                     deleteCookie('ProdID');
                     deleteCookie('age_group');
                     deleteCookie('event_date');
                     deleteCookie('event_category');
                     deleteCookie('event_name');
                     deleteCookie('gender');


                     // Posting to Home.

                     window.location.href = "/home";
                   },
                   error : function(res) {alert("Error in saving wishlist!")}
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
   htmlStr = htmlStr+'<button type="submit" class="btn btn-primary btn-lg">Save your Wishlist!</button></form>';
   htmlStr = htmlStr+'</div></div><div class="row"><div class="col-sm-12"><hr></div></div></form>'
   htmlStr = htmlStr+'</div>';
   $('#mainContentPage').replaceWith(htmlStr);
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
      alert ($('#password').val() + '-' + $('#retype-password').val())
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
      alert ($('#password').val() + '-' + $('#retype-password').val())
      $('#form_group_retype_password').addClass('has-error');
      $('#form_group_password').addClass('has-error');
      valid = false;
    } else {
      $('#form_group_retype_password').removeClass('has-error');
      $('#form_group_password').removeClass('has-error');
    }
  }

  return valid;
}

 function saveWishlist() {
   if (validFields())
   {
     var eventDate = getCookie("event_date");
     var eventType = getCookie("event_category");
     var selProducts = getCookie("ProdID");
     alert("date is " + eventDate);
  //   var wishList = '{"EventName" :"'+$("#event_name").val()+'", "EventDate" : "'+eventDate+'", "EventType" : "'+eventType+'", "UsrName" : "'+$("#emailaddr").val()+'", "HostName" : "'+$("#hostfullname").val()+'",';
  //   wishList = wishList +' "ContactName" : "'+$("#rcvrname").val()+'", "HostEmail" : "'+$("#emailaddr").val()+'", "HostPhone" : "'+$("#cellphnum").val()+'", "ProductIDs" : "'+selProducts+'", "Password" : "'+$("#password").val()+'"}';

     $.ajax({
       type: 'POST',
       url: '/getsalt',
       success: function (salt) {
        alert(salt);
        var sha256 = new jsSHA('SHA-256', 'TEXT');
        sha256.update($("#password").val() + salt);
        var hash = sha256.getHash("HEX");
        alert("Hashed val" + hash);
        var wishList = '{"EventName" :"'+$("#event_name").val()+'", "EventDate" : "'+eventDate+'", "EventType" : "'+eventType+'", "UsrName" : "'+$("#emailaddr").val()+'", "HostName" : "'+$("#hostfullname").val()+'",';
        wishList = wishList +' "ContactName" : "'+$("#rcvrname").val()+'", "HostEmail" : "'+$("#emailaddr").val()+'", "HostPhone" : "'+$("#cellphnum").val()+'", "ProductIDs" : "'+selProducts+'", "Password" : "'+ hash +'", "Uppu": "' + salt + '"}';
        $.ajax({
            type : 'POST',
            url :"/saveWishlist",
            data : {"Wishlist":wishList},
            success : function(res) {
              //The following alert will need to be replaced by a modal dialog
                  alert(res);

              //3/31/2017 - trznt - Deleting cookies as they have now been stored in the database.
              deleteCookie('ProdID');
              deleteCookie('age_group');
              deleteCookie('event_date');
              deleteCookie('event_category');
              deleteCookie('event_name');
              deleteCookie('gender');


              // Posting to Home.
              document.getElementById("signup").submit();
                //    window.location.href = "/home";
            },
            error : function(res) {alert("Error in saving wishlist!")}
          })
       },
       error: function (err) {
         alert("Unable to save wishlist")
       }
     })
   }
/*  */
 }


//27/3/2017 - trznt
 // The following function gets called from the Dashboards page to load user information
 // Things to load:
 //   1. Open and Completed WishLists
 //   2. User Profile information
 //   3. User Service Requests
 function getUserWishLists(user,div) {
   alert("getting wishlist");
   $.ajax({
       type : 'GET',
       url :"/getUserWishLists",
       data : {"userid":user},
       success : function(res) {
         //The following alert will need to be replaced by a modal dialog
             alert(JSON.stringify(res));
             if (res.length >=2) {
               $('#' + div).text("You have " + res.length + " active lists.");
             }
             else {
                $('#' + div).text("You have " + res.length + " active list.");
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
       var catg = "NPD";
       prodnm = prodnm.replace(/['"]+/g, '');
       var prd = '{"ProdID":"'+bmgId+'","ProdDsc":"'+proddsc+'","ImageURL":"'+imageURL+'","ProdNm":"'+prodnm+'","Catg":"'+catg+'","MRP":"'+MRP+'","ProdGrp":"'+PrdGrp+'"}';
       //Throwing error if the name has quotes in it
       $.ajax({
         type : 'POST',
         url :"/addToDB",
         data : {"Product":prd},
         success : function(res) {alert(res)},
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

 function getCatg(genre,price,event_type,callback) {
   var error;
   var sCatg = [];
   try {
     var genMap = [];genMap["Apparel"] = "A";genMap["Automotive"]="C";genMap["Baby"]="Y";genMap["Beauty"]="U";genMap["Books"]="B";
     genMap["DVD"]="D";genMap["Electronics"]="E";genMap["Gift Cards"]="V";genMap["Health and Personal Care"]="H";
     genMap["Home and Garden"]="G";genMap["Jewelry"]="J";genMap["Kindle Store"]="K";genMap["Luggage"]="L";genMap["Music"]="M";
     genMap["Musical Instruments"]="N";genMap["Office Products"]="O";genMap["PC Hardware"]="P";genMap["Shoes"]="S";genMap["Software"]="F";
     genMap["Sporting Goods"]="R";genMap["Toys"]="T";genMap["Video Game"]="I";genMap["Watches"]="W";

     sCatg = genMap[genre];
     var prc = Math.floor(price/500);
     switch (prc) {
       case 0:sCatg = sCatg + "0";break;
       case 1:sCatg = sCatg + "5";break;
       case 2:case 3:sCatg = sCatg + "1";break;
       case 4:case 5:sCatg = sCatg + "2";break;
       default:sCatg = sCatg + "3";
     }
     var evTypOrd=0;
     if (event_type.length == 4) {sCatg = "L"+sCatg}
     else {
       for (var i=0;i<event_type.length;i++) {
         if (event_type[i] == "Baby Shower") {evTypOrd = evTypOrd + (event_type[i].charCodeAt(5)-64)}
         else {evTypOrd = evTypOrd + (event_type[i].charCodeAt(0)-64)}
       }
       sCatg = String.fromCharCode(64+evTypOrd%26) + sCatg;
     }
  }
  catch (e) {error = e}
  callback(error,sCatg);
 }
