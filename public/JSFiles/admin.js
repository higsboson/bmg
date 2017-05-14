function getFeaturedProducts (cat,div) {
  alert('getting featured products' + $('#catSelectHolder').val());
  $.ajax({
    method: 'GET',
    url :"/getFeaturedProducts",
    data : {"event":cat},
    success : function (res) {
      alert(JSON.stringify(res));
      var htmlContent = "";
      $('#' + div).addClass("featured-container");
      var i;
      for (i = 0;i < res.length;i++) {
        htmlContent += "<div class='featured featured-products'>";
        htmlContent += "<div>" + res[i].ProdNm + "</div>";
        //res[i].ImageURL = res[i].ImageURL.replace(/\//g, "\\/");
        htmlContent += "<br/><div class='featured-image' style=\"background:url(\'" + res[i].ImageURL + "\') no-repeat center center\"></div>";
        htmlContent += "<br/><div class=\"featured-price\"> &#8377;" + res[i].MRP + "</div>";
        htmlContent += "<br/><input type=\"checkbox\" name=\"featured" + i + "\" value=\"" + res[i]._id + "\"  checked />Featured<br></div>"
      }
      if(i == 0) {
        alert('No Featured Products');

      }

      $('#' + div).html(htmlContent);

      $('#' + div).on('change', 'input[type="checkbox"]', function() {
        alert('changing' + JSON.stringify($(this)));
          if(this.checked == false) {
            alert ("removing " + this.value);
            var removed_prods_array = [];
            if ($('#removed_prods').val().length != 0) {
              removed_prods_array = $('#removed_prods').val().split("|");
              var index = removed_prods_array.indexOf(this.value);
              if (index == -1) {
                  $('#removed_prods').val($('#removed_prods').val() + this.value + "|");
              }
            } else {
              $('#removed_prods').val($('#removed_prods').val() + this.value + "|");
            }
          }
          else {
            alert ("adding " + this.value);
            var removed_prods_array = [];
            var updated_prods_array = [];
            if ($('#removed_prods').val().length != 0) {
              removed_prods_array = $('#removed_prods').val().split("|");
              var index = removed_prods_array.indexOf(this.value);
              if (index > -1) {
                var k,l;
                  for (k = 0,l = 0;k < removed_prods_array.length;k++) {
                    if (removed_prods_array[k] != this.value) {
                      if (removed_prods_array[k].length != 0) {
                        updated_prods_array[l] = removed_prods_array[k];
                        l++;
                      }
                    }
                  }
              }
              $('#removed_prods').val("");
              alert("length of removed array " + updated_prods_array.length)
              for (var j = 0;j < updated_prods_array.length; j++)
              {
                $('#removed_prods').val($('#removed_prods').val() + updated_prods_array[j] + "|");
              }
            }
          }
      });
    },
    error : function (res) {
        alert("Error getting featured Products");
    }
  })
}

function getAllProductsForCat(cat,div) {
  var prod_per_page = 4;
  var orig_skip_val;
  $.ajax({
    method: 'GET',
    url :"/getAllProdsForCatPaged",
    data : {"event":cat,"prod_per_page":prod_per_page,"skip":$('#skip').val()},
    success : function (res) {
      orig_skip_val = $('#skip').val();
      $('#skip').val((parseInt($('#skip').val()) + prod_per_page))
      alert(JSON.stringify(res));
      var htmlContent = "";
      $('#' + div).addClass("featured-container");
      var i;
      for (i = 0;i < res.length;i++) {
        htmlContent += "<div class='featured featured-products'>";
        htmlContent += "<div>" + res[i].ProdNm + "</div>";
        //res[i].ImageURL = res[i].ImageURL.replace(/\//g, "\\/");
        htmlContent += "<br/><div class='featured-image' style=\"background:url(\'" + res[i].ImageURL + "\') no-repeat center center\"></div>";
        htmlContent += "<br/><div class=\"featured-price\"> &#8377;" + res[i].MRP + "</div>"
        htmlContent += "<br/><input type=\"checkbox\" name=\"featured" + i + "\" id=\"" + res[i]._id + "\" value=\"" + res[i]._id + "\"  />Featured<br></div>"
      }
      if(i == 0) {
        alert('No Featured Products');
        $('#more_prods').hide();

      } else {
        $('#cached_prods').val($('#cached_prods').val() + htmlContent);
        htmlContent = "<div  id='more_prods' style='padding:20px'>";
        //htmlContent += "<div>" + res[i].ProdNm + "</div>";
        //res[i].ImageURL = res[i].ImageURL.replace(/\//g, "\\/");
        htmlContent += "<br/><button type=\"button\"  class=\"btn btn-info btn-lg\" onclick=\"getProds();\" >Load More</button>";
        //htmlContent += '<br/><div ><button type="button"  class="btn btn-info btn-lg" onclick="getProds();" >Load More</button></div>'
        htmlContent += "<br/></div>"
        if (orig_skip_val == "0")
          $('#' + div).html("");
        $('#more_prods').hide();
        $('#' + div).html($('#cached_prods').val());
        if ($('#added_prods').val() != "") {
          var existing_added = $('#added_prods').val().split("|");
          $('#' + div).unbind('change');
          for (var m = 0;m < existing_added.length - 1;m++) {
            alert ('#' + existing_added[m]);
            $('#' + existing_added[m]).prop('checked',true);
          }
          $('#' + div).bind('change');
        }
        $('#' + div).append(htmlContent);
        $('#' + div).on('change', 'input[type="checkbox"]', function() {
          alert('changing' + JSON.stringify($(this)));
            if(this.checked) {
              alert ("adding " + this.value);
              var added_prods_array = [];
              if ($('#added_prods').val().length != 0) {
                added_prods_array = $('#added_prods').val().split("|");
                var index = added_prods_array.indexOf(this.value);
                if (index == -1) {
                    $('#added_prods').val($('#added_prods').val() + this.value + "|");
                }
              } else {
                $('#added_prods').val($('#added_prods').val() + this.value + "|");
              }
            }
            else {
              alert ("Removing " + this.value);
              var added_prods_array = [];
              var updated_prods_array = [];
              if ($('#added_prods').val().length != 0) {
                added_prods_array = $('#added_prods').val().split("|");
                var index = added_prods_array.indexOf(this.value);
                if (index > -1) {
                  var k,l;
                    for (k = 0,l = 0;k < added_prods_array.length;k++) {
                      if (added_prods_array[k] != this.value) {
                        if (added_prods_array[k].length != 0) {
                          updated_prods_array[l] = added_prods_array[k];
                          l++;
                        }
                      }
                    }
                }
                $('#added_prods').val("");
                alert("length of removed array " + updated_prods_array.length)
                for (var j = 0;j < updated_prods_array.length; j++)
                {
                  $('#added_prods').val($('#added_prods').val() + updated_prods_array[j] + "|");
                }
              }
            }
        });
      }
    },
    error : function (res) {
        alert("Error getting featured Products");
    }
  })
}

function saveFeaturedList() {
  alert('Saving Featured Prods');
  $.ajax({
    url: '/saveFeaturedList',
    method: 'POST',
    data: {"remove":$('#removed_prods').val(),"add":$('#added_prods').val()},
    success: function (res) {
      alert ("Saved Successfully ServerCode:" + res);
      window.location.href = "/admin";
    },
    error : function (err) {
      alert ("Unable to save");
    }
  })
}
