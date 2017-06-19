var eventTypeList = ['Birthday','Anniversary','Baby Shower','Wedding','House Warming','Farewell'];

function getFeaturedProducts (cat,div) {
  //alert('getting featured products' + $('#catSelectHolder').val());
  $.ajax({
    method: 'GET',
    url :"/getFeaturedProducts",
    data : {"event":cat},
    success : function (res) {
      //alert(JSON.stringify(res));
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
        //alert('No Featured Products');
        showWarningModal('Warning!','You presently have no featured products')

      }

      $('#' + div).html(htmlContent);

      $('#' + div).on('change', 'input[type="checkbox"]', function() {
        //alert('changing' + JSON.stringify($(this)));
          if(this.checked == false) {
            //alert ("removing " + this.value);
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
            //alert ("adding " + this.value);
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
              //alert("length of removed array " + updated_prods_array.length)
              for (var j = 0;j < updated_prods_array.length; j++)
              {
                $('#removed_prods').val($('#removed_prods').val() + updated_prods_array[j] + "|");
              }
            }
          }
      });
    },
    error : function (res) {
        //alert("Error getting featured Products");
        showErrorModal('Error!','There is an error getting the featured products from the server')
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
      //alert(JSON.stringify(res));
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
        //alert('No Featured Products');
        showWarningModal('Warning!','You presently have no featured products')
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
            //alert ('#' + existing_added[m]);
            $('#' + existing_added[m]).prop('checked',true);
          }
          $('#' + div).bind('change');
        }
        $('#' + div).append(htmlContent);
        $('#' + div).on('change', 'input[type="checkbox"]', function() {
          //alert('changing' + JSON.stringify($(this)));
            if(this.checked) {
              //alert ("adding " + this.value);
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
              //alert ("Removing " + this.value);
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
                //alert("length of removed array " + updated_prods_array.length)
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
        showErrorModal('Error!','There is an error getting the featured products from the server')
    }
  })
}

function saveFeaturedList() {
  //alert('Saving Featured Prods');
  $.ajax({
    url: '/saveFeaturedList',
    method: 'POST',
    data: {"remove":$('#removed_prods').val(),"add":$('#added_prods').val()},
    success: function (res) {
      //alert ("Saved Successfully ServerCode:" + res);
      showInformationModal('Saved!','The featured products list has been saved.');
      $('#saveButton').html('<a href="/admin" style="color:#FFFFFF;font-size:30px;"><button class="btn btn-default btn-lg">Done!</button></a>')
    },
    error : function (err) {
      //alert ("Unable to save");
      showErrorModal('Error!','Unable to save the featured product list.')
    }
  })
}


function getProductReview() {
  $.ajax({
    url: '/getProductReview',
    method: 'GET',
    success: function (res) {
      //alert ("Count is " + res);
      $('#unreviewed').text("Review Products(" +  res + ")")
      if (parseInt(res) == 0) {
        $('#unreviewed').attr('href','#');
      }
    },
    error : function (err) {
      //alert ("Unable to get product");
      showErrorModal('Error!','Unable to get review product count.')
    }
  })
}


function getProductItems() {
  $.ajax({
      method: 'GET',
      url: '/getProductReviewItems',
      success : function (res) {
        var txt = "<table class='table'>"
        //alert(JSON.stringify(res));
        $('#review_count').val(res.length);
        for (var i = 0;i < res.length;i++) {
          txt += '<tr><td><a class="product-review" href="' + res[i].ProdDsc + '" target="_blank"><img src="' + res[i].ImageURL + '"  /></a></td>'
          txt += '<td style="width:300px"><a class="product-review" href="' + res[i].ProdDsc + '" target="_blank">' + res[i].ProdNm + '</a></td>';
          txt += '<td>MRP ' + res[i].MRP + '</td>';
          var eventType = res[i].eventType;
          txt += "<td><ul style='text-align:left'>";
          for (var j = 0;j < eventTypeList.length;j++) {
            var found = 0;
            for (var k = 0; k < eventType.length;k++) {
                if (eventType[k] == eventTypeList[j]) {
                found = 1;
                break;
              }
            }
            if (found == 1)
             txt += '<li>' + '<div class="checkbox"><input type="checkbox" id = "eventTypeCheckProd' + eventTypeList[j].replace(/ /gi, "_") + i + '" value="' + eventTypeList[j].replace(/ /gi, "_") + i + '" checked>' + eventTypeList[j] + '</label><br />' + '</div></li>';
           else
             txt += '<li>' + '<div class="checkbox"><input type="checkbox" id = "eventTypeCheckProd' + eventTypeList[j].replace(/ /gi, "_") + i + '" value="' + eventTypeList[j].replace(/ /gi, "_") + i + '" >' + eventTypeList[j] + '</label><br />' + '</div></li>';

          }
          txt += "</ul></td>";
          txt += "<td><input type='hidden' name='prod" + i + "' id='prod" + i + "' value='"+ res[i]._id  + "' /></td>"

          txt += '</tr>';
        }
        txt += '</table>';
        $('#preview').html(txt);
      },
      error : function (err) {
        //alert(err);
        showErrorModal('Error!','Unable to get items for review.')
      }
  })
}

function calcProductReviewEvents() {
  //alert('calculating');
  var arr = [];

  for (var i = 0;i < parseInt($('#review_count').val()); i++) {
    var obj = {};
    obj.Prod = $('#prod' + i).val();
    obj.events = [];
    for (var j=0; j < eventTypeList.length;j++) {
      if ( $("#eventTypeCheckProd" + eventTypeList[j].replace(/ /gi, "_") + i).prop( "checked" ) )
        obj.events.push(eventTypeList[j]);
    }
    arr[i] = obj;
  }
  if ($('#review_count').val() != "0") {
    $.ajax({
      url: '/saveReviewedProducts',
      method: 'POST',
      data: {array: arr},
      success : function (res) {
        showInformationModal('Saved!','The changes to reviewed products has been saved.');
        $('#review_form').hide();
        $('#review_save_button').html('<a href="/admin" style="color:#FFFFFF;font-size:30px;"><button class="btn btn-default btn-lg">Done!</button></a>')
        //window.location.href = "/admin";
      },
      error : function (err) {
        alert(err);
      }
    })
  }
}

function showWarningModal(heading,desc) {
  $('#warning_modal-title-id').text(heading);
  $('#warning_modal-p-id').text(desc);
  $('#warning_modal').modal('show');
}

function showInformationModal(heading,desc) {
  $('#information_modal-title-id').text(heading);
  $('#information_modal-p-id').text(desc);
  $('#information_modal').modal('show');
}

function showErrorModal(heading,desc) {
  $('#error_modal-title-id').text(heading);
  $('#error_modal-p-id').text(desc);
  $('#error_modal').modal('show');
}
