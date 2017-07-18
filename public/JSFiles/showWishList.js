function buyNow(prodid,prodURL) {
  $("#buyer_email").attr('readonly', false);
  if (getCookie("buyer_email") !== 'undefined')
    $("#buyer_email").val(getCookie("buyer_email"));
  //alert("Buy Now");
  //setCookie("BuyingPrdName",prdname);
  //setCookie("BuyingPrdID",prodid);
  //setCookie("BuyingPrdURL",prodURL);
  buyingProdID = prodid;
  buyingProdURL = prodURL;
  if (validateEmail($("#buyer_email").val())) {
    $("#buyBtn").html('<a href="' + prodURL + '" target="_blank"><button type="button" class="btn btn-success" style="display:default" onclick="openAmznPage()">Proceed to Buy</button></a>');
  }
  else {
    $("#buyBtn").html('<a href="' + prodURL + '" target="_blank"><button type="button" class="btn btn-success" style="display:default" onclick="openAmznPage()" disabled>Proceed to Buy</button></a>');
  }
  $("#myModal").modal('show');
}

function openAmznPage() {
  setCookie("buyer_email",$('#buyer_email').val(),2);
  try {
    //alert("Open Amazon Page");
    var uid_val = $("#uid_val").val();
    var buyer_email = $("#buyer_email").val();
    $("#buyer_email").attr('readonly', true);
    var dataStr = '{"WishListID":"'+eventID+'","ProductID":"'+buyingProdID+'","Status":"Blocked","u":"'+uid_val+'","emailaddr":"'+buyer_email+'"}';
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
  var dataStr;
  var buyer_email = $("#buyer_email").val();
  try {
    var uid_val = $("#uid_val").val();
    if (strStatus == "Bought")
      dataStr = '{"WishListID":"'+eventID+'","ProductID":"'+buyingProdID+'","Status":"'+strStatus+'","u":"'+uid_val+'","emailaddr":"'+buyer_email+'"}';
    else
      dataStr = '{"WishListID":"'+eventID+'","ProductID":"'+buyingProdID+'","Status":"'+strStatus+'","u":"'+uid_val+'","emailaddr":"NA"}';
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
        //alert('doc is ' + JSON.stringify(doc));
        if (doc.ProdData.length != 0) {
          if (cnt%4 == 0){htmlStr = htmlStr + '<div class = "row">'}
          htmlStr = htmlStr + '<div class="col-sm-3"><div class="thumbnail">';
          htmlStr = htmlStr + '<div class="thumbnail" style="height:215px;border:0;">';
          htmlStr = htmlStr + '<img id = "imgURL_'+doc._id+'" src="'+doc.ProdData[0].ImageURL+'">';
          htmlStr = htmlStr + '<div class="caption"><p id="ProdNm_'+doc._id+'" align="middle">'+doc.ProdData[0].ProdNm+'</p></div></div>';
          htmlStr = htmlStr + '<div class="caption"><p align="middle"> INR '+doc.ProdData[0].MRP+'</p><div class="amz-note" style="text-align:center">(as of ' + getDateFromUTC(doc.ProdData[0].UpdDate) + ' IST - <a data-toggle="modal" href="#amzDisclaimer">Details</a>)</div></div>';
          if (doc.Status == "Blocked")
           {htmlStr = htmlStr + '<p align="middle"><button class="btn btn-info disabled" id="btn_'+doc._id+'">Blocked</button></p>'}
          else if (doc.Status == "Bought")
           {htmlStr = htmlStr + '<p align="middle"><button class="btn btn-info disabled" id="btn_'+doc._id+'">Already Bought</button></p>'}
          else
           {htmlStr = htmlStr + '<p align="middle"><button class="btn btn-info" onclick=buyNow("'+doc._id+'","'+doc.ProdData[0].ProdDsc+'") id="btn_'+doc._id+'">Grant Wish</button></p>'}
          htmlStr = htmlStr + '</div></div>';
          cnt++;
          if (cnt%4 == 0){htmlStr = htmlStr + "</div>"};
        }
      }) //for each
      if (cnt%4 != 0) {htmlStr = htmlStr + "</div>"};
      htmlStr = htmlStr + '<hr><p style="color:#454282">Except where mentioned, the price shown here is list price for the particular item. The price that will utilmately be applicable for the item will be what is shown on the third party site.</p></div>';
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
      //alert('event ID read' + JSON.stringify(res));
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
