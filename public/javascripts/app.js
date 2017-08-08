var num = 0;

$(document).ready(function() {
  setInterval(function() {
    $('#ipList').load('/json');
  }, 4000);
});
