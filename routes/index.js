var express = require('express');
var request = require('request');
var maxmind = require('maxmind');
var srequest = require('sync-request');

const url_prefix = "http://" + "10.0.0.1/cgi-bin/luci/;";
const appTitle = '網絡地址轉換器'

var router = express.Router();
var session = null;
var stok = null;
var lg_i = 0;

/* GET home page. */
router.get('/', function(req, res, next) {

  get_stok(function(err, httpResponse, body) {
    url = url_prefix + stok + "/api/sys/get_clients"
    lg('請求網址', url);

    getByCookie(url, function(error, response, body) {
      json = JSON.parse(body);

      res.render('list', {
        title: appTitle,
        stok: stok,
        list: json.clients
      });

    })

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

    return;
  }

  res.render('index', {
    title: appTitle,
    stok: stok
  });
});

router.get('/json/:ip', function(req, res) {
  var i = req.params.ip;
  url = url_prefix + stok + "/api/sys/dump_conntrack?ipaddr=" + i;

  lg('IP', i)
  // lg('請求網址', url)

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

      // 循環 IP 列表并附加地址信息
      for (var attributename in list) {
        i = list[attributename];
        l = getip_maxmind(i.dst);

        if (l != null) {

          c_name = ifNameNull('city')
          c_country = ifNameNull('country')

          c = c_name['name'] + ' / ' + c_country['name'];
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
        title: appTitle,
        json: output
      });
    });
  } else {

    output[0] = {
      local: 'stok 不存在'
    }

    res.render('ip', {
      title: appTitle,
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
  console.log('');
  console.log('> Log: ' + lg_i++);
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

function getByCookie(url, callback) {
  request({
    url: url,
    headers: {
      Cookie: session
    }
  }, function(error, response, body) {
    callback(error, response, body)
  });

}

function ifNameNull(name) {
  if (l.hasOwnProperty(name)) {
    o = eval("l." + name + ".names");

    if (o.hasOwnProperty('en')) {
      r = {
        'name': o['en']
      }
    }
    if (o.hasOwnProperty('zh-CN')) {
      r = {
        'name': o['zh-CN']
      }
    }

  } else {
    r = {
      'name': '-'
    }
  }
  return r;
}
