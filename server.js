"use strict";
var NO_DB = true;
var fs = require('fs');
var compression = require('compression');
var express = require('express');
//var munge = require('./data/dqcdm_munge');
require('babel-polyfill');
var _ = require('supergroup-es6').default; // why need default?
var webpack = require('webpack');
var config = require('./webpack.config');
var compiler = webpack(config);
var webpackDevMiddleware = require('webpack-dev-middleware');

var app = new express();
var port = process.env.PORT || 5000;
app.use(compression())
app.use(express.static('static/data/cms-synpuf'))

app.use(express.static('static'))
//app.use('/data', express.static('static/data'));

app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));

var isDevelopment = (process.env.NODE_ENV !== 'production');
if (isDevelopment) {
  var webpackHotMiddleware = require('webpack-hot-middleware');
  app.use(webpackHotMiddleware(compiler));
}

app.listen(port, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port);
  }
});


app.use(function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

