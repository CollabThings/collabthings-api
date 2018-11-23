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
import CTApp from '../modules/app';
import CTApi from '../modules/api';
import CTSsb from '../modules/ssb';
import { CTMessageContent } from '../modules/common';
import { Message, TestMessages } from './messages';

var messages = new TestMessages();

export default class BasicTests {
    api: CTApi;
    app: CTApp;

    constructor(napp: CTApp) {
        this.app = napp;
        this.api = napp.getApi();
    }

    run() {
        assert.equal("Hello!", this.api.info().hello);

        var message = messages.getBasic();
        message.content = "Important message";
        var mc = new CTMessageContent();
        
        this.api.addMessage(mc, "test", (err: string, msg: string) => {
        	assert.ifError(err);
			console.log("test message added");
        });
    }
}