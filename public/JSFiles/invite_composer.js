function startComposing(){
  var uid = getCookie('eventUID');
  var wid = getCookie('eventWID');
  alert(uid);
  $.ajax({
    type : 'POST',
    url :"/updateEventDetailsForWishList",
    data : {"EventUID":uid,"EventWID":wid,"inviteGreeting": $('#event_greeting').val(),"addr":$('#event_address').val(),"invite_date":$('#event_date').val(),"invite_time":$('#event_time').val()},
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
