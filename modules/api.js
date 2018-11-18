'use strict';

const PORT = 14881;

var apimodule = {
	setup: function () {
		console.log("api setup");
	},
	init: function () {
		return initApi();
	}
};

apimodule.setup();
module.exports = apimodule;

var express = require('express'),
	serveStatic = require('serve-static');

var api = new Api();

function initApi() {
	return api;
}

function Api() {
	var exp = express();
	var expserver;

	this.info = function () {
		var info = {};
		info.hello = "Hello!";
		return info;
	}

	this.stop = function() {
		api.expserver.close();
	}

	exp.get("/info", function (req, res) {
		console.log("\"info\" called");
		res.send(JSON.stringify(api.info()));
	});

	exp.get("/news", function (req, res) {
		var newscontent = app.news.get_content(function (newscontent) {
			res.send(newscontent);
		});
	});

	this.expserver = exp.listen(PORT);

	console.log("Listening to port " + PORT);
}