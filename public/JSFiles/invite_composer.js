function calcLength(div,max) {
  var length = $('#' + div).val().length;
  if (length > max) {
    $('#' + div + "_count").text(length + '/' + max + ' characters');
    $('#' + div + "_count").css('color','#FF0000');
  } else {
    $('#' + div + "_count").text(length + '/' + max + ' characters');
    $('#' + div + "_count").css('color','#000000');
  }
}

function startComposing(){
  if ($('#event_greeting').val() == "") {
    $('#warning_modal-title-id').text('Warning');
    $('#warning_modal-p-id').text('Please provide an invite greeting.');
    $('#warning_modal').modal('show');
    return false;
  }
  if ($('#event_greeting').val().length > 100) {
    $('#warning_modal-title-id').text('Warning');
    $('#warning_modal-p-id').text('The greeting for the invite needs to be less that 100 characters.');
    $('#warning_modal').modal('show');
    return false;
  }
  if ($('#event_address').val() == "") {
    $('#warning_modal-title-id').text('Warning');
    $('#warning_modal-p-id').text('Please provide the address/venue for your event.');
    $('#warning_modal').modal('show');
    return false;
  }
  if ($('#event_address').val().length > 120) {
    $('#warning_modal-title-id').text('Warning');
    $('#warning_modal-p-id').text('The address location for the invite needs to be less that 120 characters.');
    $('#warning_modal').modal('show');
    return false;
  }
  if ($('#event_date').val() == "") {
    $('#warning_modal-title-id').text('Warning');
    $('#warning_modal-p-id').text('Please provide the date for your event.');
    $('#warning_modal').modal('show');
    return false;
  }
  if ($('#event_time').val() == "") {
    $('#warning_modal-title-id').text('Warning');
    $('#warning_modal-p-id').text('Please provide a time for your event.');
    $('#warning_modal').modal('show');
    return false;
  }
  var uid = getCookie('eventUID');
  var wid = getCookie('eventWID');
  //alert(uid);
  $.ajax({
    type : 'POST',
    url :"/updateEventDetailsForWishList",
    data : {"EventUID":uid,"EventWID":wid,"inviteGreeting": clean($('#event_greeting').val()),"addr":clean($('#event_address').val()),"invite_date":clean($('#event_date').val()),"invite_time":clean($('#event_time').val())},
    success : function(res) {
      window.location.href = "/invite.html"
    },
    error : function(res) {alert("Error addint!")}
  })
}


function getFile() {
  $.ajax({
    type : 'GET',
    url :"/downloadFile",
    success : function(res) {
      //window.location.href = "/"
    },
    error : function(res) {alert("Error with download!")}
  })
}


function showThanks() {
  var uid = getCookie('eventUID');
  var wid = getCookie('eventWID');
  $.ajax({
    type : 'POST',
    url :"/updateSentNotification",
    data : {"EventUID":uid,"EventWID":wid},
    success : function(res) {
      if (res == "NotificationUpdated")
        $('#options').html('<div class="col-sm-12" style="text-align:center;font-size:30px;">Downloading...<br>Thank You for using bemygenie invites!<br><button class="btn btn-default" onclick="location.href=\'/home\'">Home</button>  </div>')
    },
    error : function(res) {alert("Error addint!")}
  })

}
