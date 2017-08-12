var num = 0;

$(document).ready(function() {

  var ip = getUrlParam('ip');
  console.log(ip);

  if (ip != null) {
    if ($("#ipList")[0]) {
      setInterval(function() {
        $('#ipList').load('/json/' + ip);
      }, 4000);
    }
  }



});

function getUrlParam(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
  var r = window.location.search.substr(1).match(reg); //匹配目标参数
  if (r != null) return unescape(r[2]);
  return null; //返回参数值
}
