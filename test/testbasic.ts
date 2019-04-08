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

const request = require('request-promise');

var messages = new TestMessages();

export default class BasicTests {
    api: CTApi;
    app: CTApp;

    constructor(napp: CTApp) {
        this.app = napp;
        this.api = napp.getApi();
    }

    async run() {
        assert.equal("hello", this.api.info().hello);
        var self = this;
        
        var message = messages.getBasic();
        message.content = "Important message";
        var mc = new CTMessageContent();
        
        console.log("basictest addMessage");
        await this.api.addMessage(mc, "test", (err: string, msg: string) => {
        	assert.ifError(err);
			console.log("test message added");
        });
        
        console.log("basictest get users");
        await request.get("http://localhost:14881/me", function(err:any, response:any, body:any) {
        	assert.ifError(err);
        	console.log("basictest users response " + body);
        	var users = JSON.parse(body);
        	assert.equal(self.app.getSsb().getUserID(), users.userid);
        });
        
    }
}