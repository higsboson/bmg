window.onload = function() {
  //var eventID = <%= eventID %>;
  var eventID = $("#evntID").val();
  //alert("Value of event ID is "+eventID);
  $.get("/showListProducts",{eventID:eventID}, function (data,status) {
    if (status == 'success'){
      var htmlStr = "";
      var endStr = "";
      htmlStr = '<div class = "carousel-wrapper" id="carousel-wrapper">';
      $.each(data, function(key,doc){
        if (key%4 == 0){htmlStr = htmlStr + '<div class = "row">';endStr = endStr + '</div>'}
        htmlStr = htmlStr + '<div class="col-md-3">';
        htmlStr = htmlStr + doc.ProdLnk;
        htmlStr = htmlStr + '</div>'
      }) //for each

      htmlStr = htmlStr + endStr + "</div>";
      $('#carousel-wrapper').replaceWith(htmlStr);
   }
   else {
    alert("Error in fetching data from server");
   }
  })
} //getWishList
