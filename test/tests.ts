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
import BasicTests from './testbasic';
import ListTests from './testlists';
import UsersTests from './testusers';

const request = require('request-promise');

var config = {};

interface UserInfo {
    userid: string
}

var userone: UserInfo;
var usertwo: UserInfo;

async function runtests() {
	console.log("ASYNC");
	
	var app = await new CTApp().init();
	try {
		app.getApi().start();
		
		console.log("TESTS: LAUNCHING BASIC");
	    var basictests = new BasicTests(app);
	    await basictests.run();
		    
        await request.get("http://localhost:14001/me", function(err:any, response:any, body:any) {
            console.log("TESTS userone response " + body);
            userone = JSON.parse(body)
        });

        await request.get("http://localhost:14002/me", function(err:any, response:any, body:any) {
            console.log("TESTS usertwo response " + body);
            usertwo = JSON.parse(body)
        });

        await request.get("http://localhost:14001/users", function(err:any, response:any, body:any) {
            console.log("users1 " + JSON.stringify(userone) + " users:" + body);
        });

        await request.get("http://localhost:14002/users", function(err:any, response:any, body:any) {
            console.log("users2 " + JSON.stringify(usertwo) + " users:" + body);
        });

        console.log("TESTS userone " + JSON.stringify(userone));
        console.log("TESTS usertwo " + JSON.stringify(usertwo));

        await request.get("http://localhost:14002/users/follow/" + encodeURIComponent(userone.userid), function(err:any, response:any, body:any) {
            console.log("followed " + body);
        });

        await request.get("http://localhost:14001/users/follow/" + encodeURIComponent(usertwo.userid), function(err:any, response:any, body:any) {
            console.log("followed " + body);
        });

        console.log("TESTS: LAUNCHING USERS");
        await new UsersTests(app).run();
        
        console.log("TESTS: LAUNCHING LISTS");
        await new ListTests(app).run();
        
	    
	} finally {	
		app.stop();
		console.log("END");
	}

	console.log("ASYNC END");
}

runtests();

console.log("TESTS END");
