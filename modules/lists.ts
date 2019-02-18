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
    	
    	info.following = (author:string, following:boolean) => {
    	    this.ssb.createAuthorStream(author, "list", (err: string, smsg: string) => {
                this.handleListMessage(err, smsg);
    	    });
    	};
    	
    	return info;
    }
    
    async init() {
    	console.log("******************** LISTS INIT");
    	await this.ssb.createFeedStreamByCTType("list", (err: string, smsg: string) => {
    	    this.handleListMessage(err, smsg);
    	});
    }
 
    async handleListMessage(err: string, smsg: string) {
        var msg: any = JSON.parse(smsg);
    
        if(!msg.value.content) {
            console.log("no content");
            return;
        }
        
        var values: any = msg.value.content.values;
        if(values && values.method && values.value && values.listname) {
            console.log("list msg:" + JSON.stringify(values));
            var author = msg.value.author;
            console.log("list msg by " + author);
            var list: CTList = this.getOrCreateListWithAuthor(author, values.listname);             
            list.add(values.value);
        }

    }
    
    private getOrCreateList(name: string): CTList {
    	var author = this.ssb.getUserID();
    	return this.getOrCreateListWithAuthor(author, name);
    }
    
    private getOrCreateListWithAuthor(author: string, name: string) {
    	if(typeof(this.lists[author]) == 'undefined') {
    		this.lists[author] = {};
    	}

    	if(typeof(this.lists[author][name]) == 'undefined') {
    		this.lists[author][name] = new CTList();
    	}
		
		return this.getList(author, name);
    }
    
    async delay(ms: number) {
    	return new Promise( resolve => setTimeout(resolve, ms) );
    }

    async add(name: string, value: string) {
    	await this.addWithAuthor(this.ssb.getUserID(), name, value);
    }
    
    async addWithAuthor(author: string, name: string, value: string) {
    	console.log("*************** LISTS ADD *****************")
    	await this.waitIfEmptyWithAuthor(author, name);
    	
    	if(typeof(this.getAuthorLists(author)[name]) == 'undefined' || !this.getAuthorLists(author)[name].includes(value)) {
	    	console.log("adding to list " + name + " value " + value);
	    	var content: common.CTMessageContent = new common.CTMessageContent();
	    	content.values.method = "add";
	    	content.values.addedAt = "" + new Date();
	    	content.values.value = value;
	    	content.values.listname = name;
	    	
	    	await this.ssb.addMessage(content, "list");
	    	
	    	this.getOrCreateListWithAuthor(author, name).add(value);
	    	
	    	console.log("value added");
	    } else {
	    	console.log("value already there");
	    }
    }
    
    async waitIfEmpty(name: string ) {
    	await this.waitIfEmptyWithAuthor(this.ssb.getUserID(), name);
    }
    
    async waitIfEmptyWithAuthor(author: string, name: string) {
    	var counter: number = 0;
        while(counter++ < 10 && (this.isEmpty() || this.listWithAuthor(author, name).length==0)) {
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

    listWithAuthor(author: string, name: string): string[] {
    	return this.getOrCreateListWithAuthor(author, name).values;
    }
    
    private getList(author: string, name: string): CTList {
    	return this.getAuthorLists(author)[name];
    }
    
    private createList(name: string): CTList {
    	return this.createListWithAuthor(this.ssb.getUserID(), name);
    }
    
    private createListWithAuthor(author: string, name: string): CTList {
    	console.log("Creating a new list " + name);
    	var list: CTList = new CTList();
    	this.getAuthorLists(author)[name] = list;
    	return list;
    }

    private getAuthorLists(author: string): {[key: string]: CTList} {
    	var l = this.lists[author];
    	if (l == null) {
    		l = {};
    		this.lists[author] = l;
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

