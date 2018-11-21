import * as common from './common';
const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'
const ssbkeys = require('ssb-keys');
const ssbfeed = require('ssb-feed');
const SSB = require('ssb-db/create');
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
		        console.log("error " + err);	
		        ready(err);
				return;
			}
			
            this.sbot = sbot;
            
            var content: common.MessageContent = new common.MessageContent();
            content.text = "hello from a constuctor " + new Date();
            this.addMessage(content, "hello", (err: string, msg: string) => {
            	if(err) {
                	console.log("message sent err:" + err);
                	ready(err);
                } else {
                	setTimeout(() => {
                    	ready(err);
	                }, 2000);
	            }
            });

	        pull(
	            this.sbot.createFeedStream(),
	            pull.collect(function(err: string, msgs: Object) {
	                console.log(JSON.stringify(msgs));
	            }));
        });
        
    }

    public addMessage(content: common.MessageContent, type: string, callback: Function): void {
        content.type = "collabthings-" + type;
		content.module = type;

        console.log("sending message " + JSON.stringify(content));
        this.sbot.publish(JSON.parse(JSON.stringify(content)), function(err: string, msg: string) {
        	if(err) {
            	console.log("ERROR " + err)
            } else {
	            // the message as it appears in the database:
	            console.log("Message published");
			}
            callback(err, msg);
        });
    }

    stop() { 
    	this.sbot.close();
    }
}