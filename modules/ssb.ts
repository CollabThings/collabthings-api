import * as common from './common';
const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'
var ssbClient = require('ssb-client')

export default class CTSsb {
    home: string;
    appname: string;
    ssbpath: string;
    
    sbot: any;

    constructor() {
        this.home = process.env.HOME || "tmp";
        this.appname = process.env.ssb_appname || "ssb"
        this.ssbpath = this.home + "/." + this.appname;
        console.log("home: " + this.home + " ssb_appname:" + this.appname + " ssbpath:" + this.ssbpath);
    }

    init(ready: Function) {
        ssbClient((err:string, sbot: any) => {
			if(err) {
		        console.log(err);
			}
			
            this.sbot = sbot;
	        ready(err);
         });    
    }
    
    public createFeedStream(type: string, callback: Function) {
		pull(
		    this.sbot.messagesByType("collabthings-" + type),
		    pull.collect(function(err: string, msgs: []) {
		    	if(err) {
		    		callback(err, "");
		    	} else {
					for(var i in msgs) {
						var msg: string = JSON.stringify(msgs[i]);
			        	console.log(msg);
			        	callback(err, msg);
			        }
			    }
		    }));
    }

    public addMessage(content: common.CTMessageContent, type: string): Promise<string> {
        content.type = "collabthings-" + type;
		content.module = type;

		return new Promise((resolve, reject) => {
	        console.log("sending message " + JSON.stringify(content));
	        this.sbot.publish(JSON.parse(JSON.stringify(content)), function(err: string, msg: string) {
	        	if(err) {
	            	console.log("ERROR " + err)
					reject(err);
	            } else {
		            resolve(msg);
				}
	        });
        });
    }

    stop() { 
    	this.sbot.close();
    }
}