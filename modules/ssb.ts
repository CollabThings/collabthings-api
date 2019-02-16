import * as common from './common';
const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'
var ssbClient = require('ssb-client')
var ssbKeys = require('ssb-keys')

export default class CTSsb {
    home: string;
    appname: string;
    ssbpath: string;
    
    sbot: any;

    constructor() {
        this.home = process.env.HOME || "tmp";
        this.appname = process.env.ssb_appname || "ssb-collabthings"
        this.ssbpath = this.home + "/." + this.appname;
        console.log("home: " + this.home + " ssb_appname:" + this.appname + " ssbpath:" + this.ssbpath);
    }

    async init(): Promise<String> {
    	var keys = ssbKeys.loadOrCreateSync(this.home + "/." + this.appname + "/secret")
    
    	return new Promise<String>((resolve, reject) => {
	        ssbClient(keys, (err:string, sbot: any) => {
				if(err) {
			        console.log("Collabthings ssbClient " + err);   
			        reject(err);
				}
				
	            this.sbot = sbot;
	            console.log("sbot client create " + JSON.stringify(sbot));
		        resolve(err);
	         });
	     });
    }
    
    public getMessagesByType(type: string, callback: Function) {
		pull(
		    this.sbot.messagesByType(type),
		    pull.collect(function(err: string, msgs: []) {
		    	if(err) {
		    		callback(err, "");
		    	} else {
					for(var i in msgs) {
						var msg: string = JSON.stringify(msgs[i]);
			        	//console.log(msg);
			        	callback(err, msg);
			        }
			    }
		    }));
    }
    
    public createFeedStream(type: string, callback: Function) {
    	this.getMessagesByType("collabthings-" + type, callback);
    }

    public addMessage(content: common.CTMessageContent, type: string): Promise<string> {
        content.type = "collabthings-" + type;
		content.module = type;

		return new Promise((resolve, reject) => {
	        console.log("sending message " + JSON.stringify(content));
	        this.sbot.publish(JSON.parse(JSON.stringify(content)), function(err: string, msg: string) {
	        	if(err) {
	            	console.log("ERROR " + err);
					reject(err);
	            } else {
	            	console.log("messageAdded " + msg);
		            resolve(msg);
				}
	        });
        });
    }

    public getUserID(): string {
    	return this.sbot.id
    }
    
    stop() { 
    	this.sbot.close();
    }
}