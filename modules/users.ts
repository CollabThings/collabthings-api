const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';

export class UsersApi {
	ssb: CTSsb;

    constructor(nssb: CTSsb) {
        this.ssb = nssb;
    }

    getAppInfo(): CTAppInfo {
    	var self = this;
    	var info: CTAppInfo = new CTAppInfo();
    	
    	info.name = "users";
    	
    	info.api = (exp: express.Application) => {
    		exp.get("/" + info.name, function(req, res) {
    			res.send(JSON.stringify(self.getInfo()));
    		});
    		
    		exp.get("/self", function(req, res) {
    			res.send(JSON.stringify(self.getInfo()));
    		});
    	};
    	
    	return info;
    }
    
    getInfo(): any {
		var selfinfo: {[key: string] : string } = {};
		
		selfinfo['userid'] = this.ssb.getUserID();
		selfinfo['hello'] = "Hello!!!";  
		return selfinfo;  	
    }
    
    async init() {
    }
    
    async delay(ms: number) {
    	return new Promise( resolve => setTimeout(resolve, ms) );
    }

    stop() { }
}

