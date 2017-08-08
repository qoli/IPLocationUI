var express = require('express');
var request = require('request');
var maxmind = require('maxmind');
var srequest = require('sync-request');

var router = express.Router();
var session = null;
var stok = null;

/* GET home page. */
router.get('/', function(req, res, next) {

  request.post({
    url: 'http://10.0.0.1/cgi-bin/luci/web/index',
    form: {
      username: 'admin',
      password: 'admin'
    }
  }, function(err, httpResponse, body) {

    session = httpResponse.headers['set-cookie']; //获取set-cookie字段值
    j = JSON.stringify(session);
    o = j.match(/stok=.{32}/g);
    stok = o[0];
    url = "http://" + "10.0.0.1/cgi-bin/luci/;" + stok + "/api/sys/dump_conntrack?ipaddr=10.0.0.203";

    console.log(url);
    console.log(stok);

    res.render('index', {
      title: 'IP Location',
      stok: stok
    });

  })

});

router.get('/json', function(req, res) {

  console.log('> json...');

  request({
    url: url,
    headers: {
      Cookie: session
    }
  }, function(error, response, body) {
    json = JSON.parse(body);

    list = json.connections;

    output = [];

    for (var attributename in list) {
      i = list[attributename];
      l = getip_maxmind(i.dst);

      if (l != null) {

        if (l.hasOwnProperty('city')) {
          c_name = l.city.names;
        } else {
          c_name = ' ';
        }

        if (l.hasOwnProperty('country')) {
          c_country = l.country.names;
        } else {
          c_country = ' '
        }

        c = c_name['en'] + ' / ' + c_country['zh-CN'];
      } else {
        c = ''
      }

      output[attributename] = {
        state: i.state,
        src: i.src,
        sport: i.sport,
        dst: i.dst,
        local: c,
        dport: i.dport,
        proto: i.proto
      }
    }

    // console.log(output);

    res.render('ip', {
      title: 'IP Location',
      json: output
    });
  });
});



router.get('/getip/:ip', function(req, res) {
  var i = req.params.ip;
  var ipq = srequest('GET', 'https://ipapi.co/' + i + '/json/');
  ip = ipq.getBody();
  ip = JSON.parse(ip);
  res.json(ip);
});

router.get('/get/:ip', function(req, res) {
  res.json(getip_maxmind(req.params.ip));
});

module.exports = router;

function getip(i) {
  var ipq = srequest('GET', 'https://ipapi.co/' + i + '/json/');
  ip = ipq.getBody();
  ip = JSON.parse(ip);
  return ip
}

function getip_maxmind(i) {
  var cityLookup = maxmind.openSync('./GeoLite2-City.mmdb');
  var city = cityLookup.get(i);
  return city;
}
