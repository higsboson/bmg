window.onload = function() {
  //var eventID = <%= eventID %>;
  var eventID = $("#evntID").val();
  //alert("Value of event ID is "+eventID);
  $.get("/showListProducts",{eventID:eventID}, function (data,status) {
    if (status == 'success'){
      var htmlStr = "";
      var endStr = "";
      var cnt = 0;
      htmlStr = '<div class = "carousel-wrapper" id="carousel-wrapper">';
      htmlStr = htmlStr + '<hr>';
      $.each(data, function(key,doc){
        if (cnt%4 == 0){htmlStr = htmlStr + '<div class = "row">'}
        htmlStr = htmlStr + '<div class="col-sm-3"><div class="thumbnail">';
        htmlStr = htmlStr + '<a id = "detURL_'+doc.ProdID+'" href="'+doc.ProdDsc+'">';
        htmlStr = htmlStr + '<img id = "imgURL_'+doc.ProdID+'" src="'+doc.ImageURL+'">';
        htmlStr = htmlStr + '<div class="caption"><p id="ProdNm_'+doc.ProdID+'" align="middle">'+doc.ProdNm+'</p>';
        htmlStr = htmlStr + '<p align="middle"> INR '+doc.MRP+'</p></div></a>';
        htmlStr = htmlStr + '<p align="middle"><button type="button" class="btn btn-block btn-link" id="deleteFrmCart_'+cnt+'" onclick=deletefrmcart("'+doc.ProdID+'")>Delete</button></p>';
        htmlStr = htmlStr + '</div></div>';
        cnt++;
        if (cnt%4 == 0){htmlStr = htmlStr + "</div>"};
      }) //for each
      if (cnt%4 != 0) {htmlStr = htmlStr + "</div>"};
      htmlStr = htmlStr + '<hr></div>';
      $('#carousel-wrapper').replaceWith(htmlStr);
   }
   else {
    alert("Error in fetching data from server");
   }
  })
} //getWishList
