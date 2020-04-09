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
import IPFSTests from './testipfs';

const bent = require('bent')
const getJSON = bent('json')

var config = {};

interface UserInfo {
    userid: string
}

var userone: UserInfo;
var usertwo: UserInfo;

async function runtests() {
	console.log("ASYNC");

    var app = null;
	try {
        console.log("launching CTApp");
        app = new CTApp();
        await app.init();
	
    	app.getApi().start();
        console.log("launching CTApp - done");
		
		console.log("TESTS: LAUNCHING BASIC");
	    var basictests = new BasicTests(app);
	    await basictests.run();

        console.log("Stopping app")
        await app.stop();
        
        var userone = await getJSON("http://localhost:14001/me");
        var usertwo = await getJSON("http://localhost:14002/me");

        var users = await getJSON("http://localhost:14001/users");
        console.log("users1 " + JSON.stringify(userone) + " users:" + users);
        
        users = await getJSON("http://localhost:14002/users");
        console.log("users2 " + JSON.stringify(usertwo) + " users:" + users);
        
        console.log("TESTS userone " + JSON.stringify(userone));
        console.log("TESTS usertwo " + JSON.stringify(usertwo));

        console.log("followed " + 
        await getJSON("http://localhost:14002/users/follow/" + encodeURIComponent(userone.userid)));
        console.log("followed " + 
        await getJSON("http://localhost:14001/users/follow/" + encodeURIComponent(usertwo.userid)));

        console.log("TESTS: LAUNCHING USERS");
        await new UsersTests(app).run();
        
        console.log("TESTS: LAUNCHING LISTS");
        await new ListTests(app).run();
        
        console.log("TESTS: LAUNCHING IPFS");
	    await new IPFSTests(app).run();
	} catch(e) {
        console.log("END TESTS " + e);
        if(app) {
            app.stop();
        }
	} finally {	
        console.log("END");
	}

	console.log("ASYNC END");
}

runtests();

console.log("TESTS sync END");
