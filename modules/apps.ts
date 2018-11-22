const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import Api from './api';

export default class Apps {
    api: Api;
	list: { [key: string]: CTApp };
	
    constructor(napi: Api) {
        this.api = napi;
        this.list = {};
        
        var ctapp = new CTApp();
        ctapp.name = "test";
        ctapp.type = "default";
        ctapp.settings = {
        	settingstest: "ok?"
        };
        
        this.addApp(ctapp);

    }

	addApp(app: CTApp) {
		this.list[app.name] = app;
	}
	
	getList() {
		return this.list;
	}
	
    stop() { }
}

export class CTApp {
	name: string;
	type: string;
	settings: any;
}
