/*
    Copyright (C) 2018  Juuso Vilmunen

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
import App from '../src/modules/app';
import Api from '../src/modules/api';
import CTSsb from '../src/modules/ssb';
import BasicTests from './testbasic';

var config = {};

var app = new App();

var basictests = new BasicTests(app);
basictests.run();

setTimeout(function () {
    app.stop();
}, 2000);

console.log("END");