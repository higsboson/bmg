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
   try {
     var genMap = [];genMap["Apparel"] = "A";genMap["Automotive"]="C";genMap["Baby"]="Y";genMap["Beauty"]="U";genMap["Books"]="B";
     genMap["DVD"]="D";genMap["Electronics"]="E";genMap["Gift Cards"]="V";genMap["Health and Personal Care"]="H";
     genMap["Home and Garden"]="G";genMap["Jewelry"]="J";genMap["Kindle Store"]="K";genMap["Luggage"]="L";genMap["Music"]="M";
     genMap["Musical Instruments"]="N";genMap["Office Products"]="O";genMap["PC Hardware"]="P";genMap["Shoes"]="S";genMap["Software"]="F";
     genMap["Sporting Goods"]="R";genMap["Toys"]="T";genMap["Video Game"]="I";genMap["Watches"]="W";

     var sCatg = genMap[genre];
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
