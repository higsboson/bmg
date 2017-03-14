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

 function getCustomerDetails() {
   var htmlStr = "";
   var eventName = getCookie("event_name");
   //alert("Inside Save Wishlist, event Name :"+eventName);
   htmlStr = '<div class = "container-fluid" style="padding-top:120px" id="mainContentPage">';
   htmlStr = htmlStr+'<div class="row"><div class="col-md-2">';
   htmlStr = htmlStr+'<button type="button" class = "btn btn-responsive" onclick="loadNewCart()">Search more products</button></div></div><hr>';
   htmlStr = htmlStr+'<div class="row"><div class="container save_wishlist"><div class="list-group-create-registry"><form class="form" name="save_wishlist_form" action="/saveWishlist.html" method="POST" onsubmit="saveWishlist();return false;">';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "event_name">Name of the event: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="text" class="form-control" id="event_name" value="'+eventName+'"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "hostfullname">Your name: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="text" class="form-control" id="hostfullname" placeholder="e.g. Will Smith"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "receiver">Gift receiver\'s name: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="text" class="form-control" id="rcvrname" placeholder="e.g. John Doe"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "cellphnum">Mobile number: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="text" class="form-control" id="cellphnum" placeholder="e.g. 9845012345"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "emailaddr">Email address: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="email" class="form-control" id="emailaddr" placeholder="e.g. will.smith@gmail.com"></div></div>';
   htmlStr = htmlStr+'<div class="row"><div class="col-sm-4" style="text-align:right;font-size:20px"><div class="form-group"><label for "password">Password: </label></div></div>';
   htmlStr = htmlStr+'<div class="col-sm-6" style="text-align:center;font-size:20px"><input type="password" class="form-control" id="password"></div></div>';
   htmlStr = htmlStr+'<button type="submit" class="btn btn-primary btn-lg" onclick="">Save your Wishlist!</button></form>';
   htmlStr = htmlStr+'</div></div><div class="row"><div class="col-sm-12"><hr></div></div>'
   htmlStr = htmlStr+'</div>';
   $('#mainContentPage').replaceWith(htmlStr);
   //$("#event_name").val() = eventName;
 }

 function saveWishlist() {
   var eventType = getCookie("event_category");
   var selProducts = getCookie("ProdID");
   var wishList = '{"EventName" :"'+$("#event_name").val()+'", "EventType" : "'+eventType+'", "UsrName" : "'+$("#emailaddr").val()+'", "HostName" : "'+$("#hostfullname").val()+'",';
   wishList = wishList +' "ContactName" : "'+$("#rcvrname").val()+'", "HostEmail" : "'+$("#emailaddr").val()+'", "HostPhone" : "'+$("#cellphnum").val()+'", "ProductIDs" : "'+selProducts+'", "Password" : "'+$("#password").val()+'"}';
   $.ajax({
     type : 'POST',
     url :"/saveWishlist",
     data : {"Wishlist":wishList},
     success : function(res) {alert(res)},
     error : function(res) {alert("Error in saving wishlist!")}
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
