const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';

export class UsersApi {
	ssb: CTSsb;
	users: { [key: string] : User } = {};
	
    constructor(nssb: CTSsb) {
        this.ssb = nssb;
    }

    getAppInfo(): CTAppInfo {
    	var self = this;
    	var info: CTAppInfo = new CTAppInfo();
    	
    	info.name = "users";
    	
    	info.api = (exp: express.Application) => {
    		exp.get("/" + info.name, function(req, res) {
    			if(Object.keys(self.users).length == 0) {
    				console.log("Users list empty. Responding later.");
    				setTimeout(() => {
    					res.send(JSON.stringify(self.getFollowing()));    				
    				}, 2000);
    			} else {
    				res.send(JSON.stringify(self.getFollowing()));
    			}
    		});

    		exp.get("/user/:userid", function(req, res) {
    			res.send(JSON.stringify(self.getUser(req.params.userid)));
    		});
    		
    		exp.get("/me", function(req, res) {
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
    
    getFollowing(): any[] {	
    	var list: any[] = [];
    	
		var count:number = 0;
		for(var i in this.users) {
			var key = i;
			var user:User = this.users[key];
			if(user.following) {
				list[count++] = user;
			}
		}
    	
    	return list;
    }
    
    async init() {
       	await this.initContacts();
       	await this.initAbout();
    }

    async initContacts() {
       	await this.ssb.getMessagesByType("contact", (err: string, smsg: string) => {
    		var msg: any = JSON.parse(smsg);
    		
    		if(!msg.value.content) {
    			console.log("no content");
    			return;
    		}

    		var content: any = msg.value.content;
    		if(content) {
    			var author = msg.value.author;
    			this.handleContact(author, content);
    		}
    	});
    }
    
    async initAbout() {
    	await this.ssb.getMessagesByType("about", (err: string, smsg: string) => {
    		var msg: any = JSON.parse(smsg);
    		
    		if(!msg.value.content) {
    			console.log("no content");
    			return;
    		}

    		var content: any = msg.value.content;
    		if(content) {
    			console.log("about msg:" + JSON.stringify(content));
    			var author = msg.value.author;
    			console.log("about msg by " + author);
    			this.handleAbout(author, content);
    		}
    	});
    }
    
    public checkAuthor(author:string) {
    	// typical ssb ID?
    	if(author.length<20 || !author.startsWith("@") || author.indexOf("/")<0 || author.indexOf("=.ed")<10) {
    		console.log("user id not accepted " + author);
    	} else if(typeof(this.users[author]) == 'undefined') {
    		console.log("adding user " + author);
    		var user:User = new User();
    		this.users[author] = user;
    		user.userid = author;
    	} 
    }
 
    public getUser(author:string): User {
		this.checkAuthor(author);
		return this.users[author];
    }
    
    handleContact(author:string, content: any) {
		if(author == this.ssb.getUserID()) {
			console.log("contact msg:" + JSON.stringify(content));
			if(content.following == true) {
				this.getUser(content.contact).following = true;
			} else if(content.following == false) {
				this.getUser(content.contact).following = false;
			} else {
				console.log("unknown following value");
			}
		}
    }
    
    handleAbout(author:string, content: any) {
    	var user:User =  this.getUser(author);
    	
    	if(content.name) {
    		user.name = content.name;
    	}
    	
    	if(content.description) {
    		user.description = content.description;
    	}
    	
    	console.log("About handled. user now " + JSON.stringify(user));
    }
    
    async delay(ms: number) {
    	return new Promise( resolve => setTimeout(resolve, ms) );
    }

    stop() { }
}

class User {
	userid: string;
	name: string;
	description: string;
	following: boolean;
}
