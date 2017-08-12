var express = require('express');
var request = require('request');
var maxmind = require('maxmind');
var srequest = require('sync-request');

var router = express.Router();
var session = null;
var stok = null;
var url_prefix = "http://" + "10.0.0.1/cgi-bin/luci/;";

/* GET home page. */
router.get('/', function(req, res, next) {

  get_stok(function(err, httpResponse, body) {
    url = url_prefix + stok + "/api/sys/get_clients"
    lg('請求網址', url);
    request({
      url: url,
      headers: {
        Cookie: session
      }
    }, function(error, response, body) {
      json = JSON.parse(body);

      console.log(json.clients);

      res.render('list', {
        title: 'IP Location',
        stok: stok,
        list: json.clients
      });

    });
  })

});

router.get('/:ip', function(req, res) {

  if (stok == null) {

    error = {
      status: 501,
      stack: '找不到參數'
    }

    res.render('error', {
      message: "stok 值不存在",
      error: error
    });

    return
  }

  res.render('index', {
    title: 'IP Location',
    stok: stok
  });
});

router.get('/json/:ip', function(req, res) {
  var i = req.params.ip;
  url = url_prefix + stok + "/api/sys/dump_conntrack?ipaddr=" + i;

  lg('IP', i)
  lg('請求網址', url)

  if (stok != null) {

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
            c_name = {
              en: '-'
            }
          }

          if (l.hasOwnProperty('country')) {
            c_country = l.country.names;
          } else {
            c_country = {
              'zh-CN': '-'
            }
          }

          c = c_name['en'] + ' / ' + c_country['zh-CN'];
        } else {
          c = '-'
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

      res.render('ip', {
        title: 'IP Location',
        json: output
      });
    });
  } else {

    output[0] = {
      local: 'stok 不存在'
    }

    res.render('ip', {
      title: 'IP Location',
      json: output
    });
  }
});


router.get('/get/:ip', function(req, res) {
  res.json(getip_maxmind(req.params.ip));
});

module.exports = router;

function getip_maxmind(i) {
  var cityLookup = maxmind.openSync('./GeoLite2-City.mmdb');
  var city = cityLookup.get(i);
  return city;
}

function lg(name, text) {
  console.log('> ' + name + ': ' + text);
}

function get_stok(callback) {
  request.post({
    url: 'http://10.0.0.1/cgi-bin/luci/web/index',
    form: {
      username: 'admin',
      password: 'admin'
    }
  }, function(err, httpResponse, body) {

    if (stok == null) {
      session = httpResponse.headers['set-cookie']; //获取set-cookie字段值
      j = JSON.stringify(session);
      o = j.match(/stok=.{32}/g);
      stok = o[0];

      lg('stok', stok);
    }


    callback(err, httpResponse, body);

  })
}
