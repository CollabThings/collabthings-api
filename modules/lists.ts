const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';

export class CTList {
	values: string[];
	
	constructor() {
		this.values = [];
	}
	
	add(value: string) {
		if(!this.includes(value)) {
			this.values.push(value);
			console.log("list now \"" + this.values + "\"");
		}
	}

	includes(value: string) {
		return this.values.includes(value);
	}
}

export class ListsApi {
	ssb: CTSsb;
	lists: { [key: string] : { [key: string]: CTList } };

    constructor(nssb: CTSsb) {
        this.ssb = nssb;
        this.lists = {};
    }

    getAppInfo(): CTAppInfo {
    	var self = this;
    	var info: CTAppInfo = new CTAppInfo();
    	
    	info.name = "lists";
    	info.api = (exp: express.Application) => {
    		exp.get("/lists", function(req, res) {
    			var bookmarks = self.list("info")
    			if(bookmarks.length==0) {
    				self.add("info", "created at " + new Date());
    			}
    			
    			res.send(JSON.stringify(self.lists));
    		});
    	};
    	
    	return info;
    }
    
    async init() {
    	console.log("******************** LISTS INIT");
    	await this.ssb.createFeedStream("list", (err: string, smsg: string) => {
    		var msg: any = JSON.parse(smsg);
    		
    		var values: any = msg.value.content.values;
    		if(values && values.method && values.value && values.listname) {
    			console.log("list msg:" + JSON.stringify(values));
    			
    			var list: CTList = this.getOrCreateList(values.listname);    			
    			list.add(values.value);
    		}
    	});
    }
    
    private getOrCreateList(name: string): CTList {
    	if(typeof(this.getOwnLists()[name]) == 'undefined') {
    		this.createList(name);
    	}
		
		return this.getList(name);
    }
    
    async delay(ms: number) {
    	return new Promise( resolve => setTimeout(resolve, ms) );
    }

    async add(name: string, value: string) {
    	console.log("*************** LISTS ADD *****************")
    	await this.waitIfEmpty(name);
    	
    	if(typeof(this.getOwnLists()[name]) == 'undefined' || !this.getOwnLists()[name].includes(value)) {
	    	console.log("adding to list " + name + " value " + value);
	    	var content: common.CTMessageContent = new common.CTMessageContent();
	    	content.values.method = "add";
	    	content.values.addedAt = "" + new Date();
	    	content.values.value = value;
	    	content.values.listname = name;
	    	
	    	await this.ssb.addMessage(content, "list");
	    	
	    	this.getOrCreateList(name).add(value);
	    	
	    	console.log("value added");
	    } else {
	    	console.log("value already there");
	    }
    }
    
    async waitIfEmpty(name: string ) {
    	var counter: number = 0;
        while(counter++ < 10 && (this.isEmpty() || this.list(name).length==0)) {
    		// TODO this is stupid but I'm not sure how this should be done.
    		console.log("lists empty!");
    		await this.delay(200);
    	}
    }
    
    private isEmpty(): Boolean {
    	return Object.keys(this.lists).length == 0;
    }
    
    list(name: string): string[] {
    	return this.getOrCreateList(name).values;
    }
    
    private getList(name: string): CTList {
    	return this.getOwnLists()[name];
    }
    
    private createList(name: string): CTList {
    	console.log("Creating a new list " + name);
    	var list: CTList = new CTList();
    	this.getOwnLists()[name] = list;
    	return list;
    }

    private getOwnLists(): {[key: string]: CTList} {
    	var l = this.lists[this.ssb.getUserID()];
    	if (l == null) {
    		l = {};
    		this.lists[this.ssb.getUserID()] = l;
    	}
    	
    	return l;
    }
    
    private async newList(name: string): Promise<CTList> {
    	return new Promise<CTList>((resolve, reject) => {
	    	console.log("Creating a new list " + name);
	    	var list: CTList = this.createList(name);
	    	
	    	var content: common.CTMessageContent = new common.CTMessageContent();
	    	content.values.method = "init";
	    	content.values.addedAt = "" + new Date();
	    	content.values.listname = name;
	    	
	    	this.ssb.addMessage(content, "list").then(() => {
		    	resolve(list);
		    });
		});    	
    }

    stop() { }
}

