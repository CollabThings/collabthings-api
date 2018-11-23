const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import CTApi from './api';

export class CTApps {
    api: CTApi;
	list: { [key: string]: CTAppInfo };
	
    constructor(napi: CTApi) {
        this.api = napi;
        this.list = {};
        
        var ctapp = new CTAppInfo();
        ctapp.name = "test";
        ctapp.type = "default";
        ctapp.settings = {
        	settingstest: "ok?"
        };
        
        this.addApp(ctapp);

    }

	addApp(app: CTAppInfo) {
		this.list[app.name] = app;
	}
	
	getList() {
		return this.list;
	}
	
    stop() { }
}

export class CTAppInfo {
	name: string;
	type: string;
	settings: any;
}
