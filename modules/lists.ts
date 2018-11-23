const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import CTSsb from './ssb';

export class CTList {
	values: string[];
	
	constructor() {
		this.values = [];
	}
	
	add(value: string) {
		if(!this.values.includes(value)) {
			this.values.push(value);
			console.log("list now \"" + this.values + "\"");
		}
	}
}

export class ListsApi {
	ssb: CTSsb;
	lists: { [key: string]: CTList };
	
    constructor(nssb: CTSsb) {
        this.ssb = nssb;
        this.lists = {};
    }

    async init(exp: express.Application) {
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
    	if(typeof(this.lists[name]) == 'undefined') {
    		this.createList(name);
    	}
		
		return this.getList(name);
    }
    
    async add(name: string, value: string) {
    	console.log("adding to list " + name + " value " + value);
    	var content: common.CTMessageContent = new common.CTMessageContent();
    	content.values.method = "add";
    	content.values.addedAt = "" + new Date();
    	content.values.value = value;
    	content.values.listname = name;
    	
    	await this.ssb.addMessage(content, "list");
    	
    	this.getOrCreateList(name).add(value);
    	
    	console.log("value added");
    }
    
    list(name: string): string[] {
    	return this.getOrCreateList(name).values;
    }
    
    private getList(name: string): CTList {
    	return this.lists[name];
    }
    
    private createList(name: string): CTList {
    	console.log("Creating a new list " + name);
    	var list: CTList = new CTList();
    	this.lists[name] = list;
    	return list;
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

