function buyNow(prodid,prodURL) {
  //alert("Buy Now");
  //setCookie("BuyingPrdName",prdname);
  //setCookie("BuyingPrdID",prodid);
  //setCookie("BuyingPrdURL",prodURL);
  buyingProdID = prodid;
  buyingProdURL = prodURL;
  $("#buyBtn").html('<a href="' + prodURL + '" target="_blank"><button type="button" class="btn btn-success" style="display:default" onclick="openAmznPage()">Proceed to Buy</button></a>')
  $("#myModal").modal('show');
}

function openAmznPage() {
  try {
    var dataStr = '{"WishListID":"'+eventID+'","ProductID":"'+buyingProdID+'","Status":"Blocked"}';
    $.ajax({
      type : 'POST',
      url :"/updProductStatus",
      data : {"Data":dataStr},
      success : function(res) {
        $("#boughtButton").toggle();
        $("#buyBtn").toggle();
        $("#didNotBuy").toggle();
        $("#closeBtn").toggle();
        //window.open(buyingProdURL);
      },
      error : function(res) {alert("Error in blocking product. Please try after sometime!")}
    })
  }
  catch (e) {alert("error - "+e)}
}

function changeGiftStatus(strStatus) {
  try {
    var dataStr = '{"WishListID":"'+eventID+'","ProductID":"'+buyingProdID+'","Status":"'+strStatus+'"}';
    $.ajax({
      type : 'POST',
      url :"/updProductStatus",
      data : {"Data":dataStr},
      success : function(res) {
        $("#myModal").modal('hide');
        location.reload();
      },
      error : function(res) {alert("Error in changing product status. Please try after sometime!")}
    })

  }
  catch (e) {alert("error - "+e)}
}

function showProducts() {
  eventID = $("#evntID").val();
  var uid_val = $("#uid_val").val();
  //alert("Value of event ID is "+eventID);
  $.get("/showListProducts",{eventID:eventID, u: uid_val}, function (data,status) {
    if (status == 'success'){
      var htmlStr = "";
      var endStr = "";
      var cnt = 0;
      var
      htmlStr = '<div class = "carousel-wrapper" id="carousel-wrapper">';
      $.each(data, function(key,doc){
        if (cnt%4 == 0){htmlStr = htmlStr + '<div class = "row">'}
        htmlStr = htmlStr + '<div class="col-sm-3"><div class="thumbnail">';
        htmlStr = htmlStr + '<div class="thumbnail" style="height:215px;border:0;">';
        htmlStr = htmlStr + '<img id = "imgURL_'+doc.ProdID+'" src="'+doc.ImageURL+'">';
        htmlStr = htmlStr + '<div class="caption"><p id="ProdNm_'+doc.ProdID+'" align="middle">'+doc.ProdNm+'</p></div></div>';
        htmlStr = htmlStr + '<div class="caption"><p align="middle"> INR '+doc.MRP+'</p></div>';
        if (doc.Status == "Blocked")
         {htmlStr = htmlStr + '<p align="middle"><button class="btn btn-info disabled" id="btn_'+doc.ProdID+'">Blocked</button></p>'}
        else if (doc.Status == "Bought")
         {htmlStr = htmlStr + '<p align="middle"><button class="btn btn-info disabled" id="btn_'+doc.ProdID+'">Already Bought</button></p>'}
        else
         {htmlStr = htmlStr + '<p align="middle"><button class="btn btn-info" onclick=buyNow("'+doc.ProdID+'","'+doc.ProdDsc+'") id="btn_'+doc.ProdID+'">Grant Wish</button></p>'}

        htmlStr = htmlStr + '</div></div>';
        cnt++;
        if (cnt%4 == 0){htmlStr = htmlStr + "</div>"};
      }) //for each
      if (cnt%4 != 0) {htmlStr = htmlStr + "</div>"};
      htmlStr = htmlStr + '<hr></div>';
      //alert(htmlStr);
      $('#carousel-wrapper').replaceWith(htmlStr);
   }
   else {
    alert("Error in fetching data from server");
   }
  })
}

function showEventDetails() {
  var eventID = $("#evntID").val();
  var uid_val = $("#uid_val").val();
  $.ajax({
    url: '/getEventInfo',
    method: 'GET',
    data: {eventID : eventID, u : uid_val},
    success: function (res) {
      alert('event ID read' + JSON.stringify(res));
      $('#pageTitle').text("Bemygenie Register: " + res.EventName)
      $('#title').text(res.EventName);
      $('#hostedby').text('Hosted by ' + res.HostName);
      var newline = String.fromCharCode(13, 10);
      var text = res.wishlistMsg;
      text =  text.replace(/(?:\r\n|\r|\n)/g, '<br />');
      $('#welcomeMessage').html(text);
    },
    error: function (err) {
      alert('Unable to read event information');
    }
  })
}

/*
function verifyCaptcha() {
  $.ajax({
     type  : 'POST',
     url   : '/verifyRecaptcha',
     data  : {"Response":grecaptcha.getResponse()},
     success: function(res) {
       if (res.success) {
         showProducts();
       }
     },
     error : function (res) {
       alert("Error in validating captcha response - "+res.error_codes);
     }
   })
}*/

window.onload = function() {
  showProducts();
} //getWishList
