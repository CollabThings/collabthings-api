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
    
    public getAuthorMessagesByType(author: string, stype: string, callback: Function) {
		pull(
		    this.sbot.createUserStream({ id: author }),
		    pull.collect(function(err: string, msgs: []) {
		    	if(err) {
		    	    console.log("ERROR getAuthorMessagesByType author:" + author + " type:\"" + stype + "\" error:" + JSON.stringify(err) + " msgs:" + JSON.stringify(msgs));
		    		callback(err, "");
		    	} else {
					for(var i in msgs) {
						var msg: string = JSON.stringify(msgs[i]);
					    var omsg:any = msgs[i]; 
					    
					    var msgtype:string = omsg.value.content.type;
					
			        	if(msgtype == stype) {
			        	    callback(err, msg);
			        	} else {
			        	   // console.log("NOOOO!!!! message type not wanted " + msgtype);
			        	   // console.log(msg);
			        	}
			        }
			    }
		    }));
    }

    public getMessagesByType(stype: string, callback: Function) {
        pull(
            this.sbot.messagesByType(stype),
            pull.collect(function(err: string, msgs: []) {
                if(err) {
                    console.log("ERROR getMessagesByType type:\"" + stype + "\" error:" + JSON.stringify(err));
                    callback(err, "");
                } else {
                    for(var i in msgs) {
                        var msg: string = JSON.stringify(msgs[i]);
                        var omsg:any = msgs[i]; 
                        
                        if(omsg.value.content.type == stype) {
                            callback(err, msg);
                        }
                    }
                }
            }));
    }

    public createAuthorStream(author: string, type: string, callback: Function) {
        this.getAuthorMessagesByType(author, "collabthings-" + type, callback);
    }
    
    public createFeedStreamByType(type: string, callback: Function) {
        this.getMessagesByType(type, callback);
    };
    
    public createFeedStreamByCTType(type: string, callback: Function) {
    	this.getMessagesByType("collabthings-" + type, callback);
    }

    public addMessage(content: common.CTMessageContent, type: string): Promise<string> {
        content.type = "collabthings-" + type;
		content.module = type;

		return new Promise((resolve, reject) => {
	        console.log("sending message " + JSON.stringify(content));
	        this.sbot.publish(JSON.parse(JSON.stringify(content)), function(err: string, msg: string) {
	        	if(err) {
	            	console.log("ERROR addMessage " + err);
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