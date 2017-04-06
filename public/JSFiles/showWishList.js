function buyNow(prodid,prodURL) {
  //alert("Buy Now");
  //setCookie("BuyingPrdName",prdname);
  //setCookie("BuyingPrdID",prodid);
  //setCookie("BuyingPrdURL",prodURL);
  buyingProdID = prodid;
  buyingProdURL = prodURL;
  $("#myModal").modal('show');
}

window.onload = function() {
  //var eventID = <%= eventID %>;
  eventID = $("#evntID").val();
  //alert("Value of event ID is "+eventID);
  $.get("/showListProducts",{eventID:eventID}, function (data,status) {
    if (status == 'success'){
      var htmlStr = "";
      var endStr = "";
      var cnt = 0;
      var
      htmlStr = '<div class = "carousel-wrapper" id="carousel-wrapper">';
      $.each(data, function(key,doc){
        if (cnt%4 == 0){htmlStr = htmlStr + '<div class = "row">'}
        htmlStr = htmlStr + '<div class="col-sm-3"><div class="thumbnail">';
        htmlStr = htmlStr + '<img id = "imgURL_'+doc.ProdID+'" src="'+doc.ImageURL+'">';
        htmlStr = htmlStr + '<div class="caption"><p id="ProdNm_'+doc.ProdID+'" align="middle">'+doc.ProdNm+'</p>';
        htmlStr = htmlStr + '<p align="middle"> INR '+doc.MRP+'</p></div>';
        htmlStr = htmlStr + '<p align="middle"><button class="btn btn-info" onclick=buyNow("'+doc.ProdID+'","'+doc.ProdDsc+'")>Buy Now</button></p>'
        htmlStr = htmlStr + '</div></div>';
        cnt++;
        if (cnt%4 == 0){htmlStr = htmlStr + "</div>"};
      }) //for each
      if (cnt%4 != 0) {htmlStr = htmlStr + "</div>"};
      htmlStr = htmlStr + '<hr></div>';
      alert(htmlStr);
      $('#carousel-wrapper').replaceWith(htmlStr);
   }
   else {
    alert("Error in fetching data from server");
   }
  })
} //getWishList
