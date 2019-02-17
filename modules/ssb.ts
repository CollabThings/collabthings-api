import * as common from './common';
const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'
var ssbClient = require('ssb-client')
var ssbKeys = require('ssb-keys')
var Server = require('ssb-server')
var Config = require('ssb-config/inject')

export default class CTSsb {
    home: string;
    appname: string;
    ssbpath: string;
    
    sbot: any;

	config: any;
	runserver: boolean = false;
	
    constructor() {
        this.home = process.env.HOME || "tmp";
        this.appname = process.env.ssb_appname || "ssb-collabthings"
        this.ssbpath = this.home + "/." + this.appname;
        console.log("home: " + this.home + " ssb_appname:" + this.appname + " ssbpath:" + this.ssbpath);

	//
        var settings: any = { 
        		host: "localhost", 
        		port: 9999, 
        		ssb_appname: this.appname,
        		local: true 
        };
        
        this.config = Config(this.appname, settings);
        
        console.log("ssb config " + JSON.stringify(this.config));        
    }

    async init(): Promise<String> {
    	if(this.runserver) {
	    	var keys = ssbKeys.loadOrCreateSync(this.home + "/." + this.appname + "/secret")
	  
	        var server = Server(this.config);
	        var manifest = server.getManifest()
			fs.writeFileSync(
					path.join(this.config.path, 'manifest.json'), 
					JSON.stringify(manifest)
			)
	
			await this.delay(2000);
    	}
    	
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

    async delay(ms: number) {
    	return new Promise( resolve => setTimeout(resolve, ms) );
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