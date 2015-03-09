var express = require('express')
var multiparty = require('connect-multiparty')
var ogr2ogr = require('ogr2ogr')
var fs = require('fs')
var urlencoded = require('body-parser').urlencoded
var tmp = require('tmp')
var request = require('request')


function enableCors (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
  next()
}

function optionsHandler (methods) {
  return function (req, res, next) {
    res.header('Allow', methods)
    res.send(methods)
  }
}

exports.createServer = function (opts) {
  if (!opts)
    opts = {}

  var app = express()
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')

  app.options('/convert', enableCors, optionsHandler('POST'))
  app.options('/convertJson', enableCors, optionsHandler('POST'))

  app.use(express.static(__dirname + '/public'))
  app.get('/', function (req, res) {
    res.render('home', { trackcode: opts.gaCode || '' })
  })

  app.use(urlencoded({ extended: false, limit: 3000000 }))
  app.use(multiparty())

  app.post('/convert', enableCors, function (req, res, next) {
    var ogr = ogr2ogr(req.files.upload.path)

    if (req.body.targetSrs) {
      ogr.project(req.body.targetSrs, req.body.sourceSrs)
    }

    if ('skipFailures' in req.body) {
      ogr.skipfailures()
    }

    res.header('Content-Type', 'forcePlainText' in req.body ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8')

    ogr.exec(function (er, data) {
      fs.unlink(req.files.upload.path)
      if (er) return res.json({ errors: er.message.replace('\n\n','').split('\n') })
      if (req.body.callback) res.write(req.body.callback + '(')
      res.write(JSON.stringify(data))
      if (req.body.callback) res.write(')')
      res.end()
    })
  })

  app.post('/convertJson', enableCors, function (req, res, next) {
    if (!req.body.jsonUrl && !req.body.json) return next(new Error('No json provided'))

    var ogr
    if (req.body.jsonUrl) {
      ogr = ogr2ogr(req.body.jsonUrl)
    }
    else {
      ogr = ogr2ogr(JSON.parse(req.body.json))
    }
    if ('skipFailures' in req.body) {
      ogr.skipfailures()
    }

    ogr.format('shp').exec(function (er, buf) {
      if (er) return res.json({ errors: er.message.replace('\n\n','').split('\n') })
      res.header('Content-Type', 'application/zip')
      res.header('Content-Disposition', 'filename=' + (req.body.outputName || 'ogre.zip'))
      res.end(buf)
    })
  })


  app.get('/csv', function(req, res, next){
    if (!req.query.url) return res.send('No url provided')
    console.log("Get: " + req.query.url);

    var regexp = /filename=\"(.*)\"/gi;

    var fileName = '', path, file, gotFileName = false;

    request
      .get(req.query.url)
      .on('response', function(response) {
        // console.log("Headers:" + JSON.stringify(response.headers));
        //check if we have extension
        var contentType = response.headers['content-type'];
        if (contentType)
          fileName = "." + contentType.split('/')[1];
        //check if we have file name, even better
        var contentDisposition = response.headers['content-disposition'];
        if (contentDisposition){
          fileName = regexp.exec(contentDisposition)[1];
          gotFileName = true;
        }

        console.log('File name/ext:' + fileName)
        path = tmp.tmpNameSync({postfix: fileName});
        file = fs.createWriteStream(path);

        response.pipe(file);
        response.on('end', function (){
          var ogr
          ogr = ogr2ogr(path);

          if ('skipFailures' in req.query) {
            ogr.skipfailures()
          }

          ogr.format('csv').exec(function (er, buf) {
            if (er) return res.json({ errors: er.message.replace('\n\n','').split('\n') })
            res.header('Content-Type', 'application/csv')
            var tempFileName = 'result.csv';
            if (gotFileName){
              var tempSplit = fileName.split('.');
              tempSplit[tempSplit.length - 1] = 'csv';
              tempFileName = tempSplit.join('.');
            }
            res.header('Content-Disposition', 'filename=' + (req.query.outputName || tempFileName))
            res.write(buf)
            res.end();
            fs.unlink(path);
          })
        })
      });
  })

  app.use(function (er, req, res, next) {
    console.error(er.stack)
    res.header('Content-Type', 'application/json')
    res.json({ error: true, msg: er.message })
  })

  return app
}
