/*
    Copyright (C) 2017  Juuso Vilmunen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var assert = require('assert');

var basictests_arguments = {
	setup: function () {
		console.log("basictests setup");
	},
	init: function (api) {
		return new BasicTests(api);
	}
};

var messages = require("./messages.js").init();

basictests_arguments.setup();
module.exports = basictests_arguments;

var api, app;

function BasicTests(napp) {
	api = napp.getApi();
	app = napp;


	this.run = function () {
		assert.equal("Hello!", api.info().hello);

		var message = messages.getBasic();
		message.content = "Important message";
		message.reply = function (s) {
			console.log("REPLY " + s);
		};
	}
}