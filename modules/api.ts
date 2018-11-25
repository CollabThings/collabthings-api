import express from 'express';
import * as serveStatic from 'serve-static';
import * as bodyParser from 'body-parser';
import * as CTApp from './app';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';
import { Server } from 'net';
import { CTMessageContent, CTInfo } from './common';
import { ListsApi } from './lists';

var PORT: number = 14881;

class CTApi {
    ssb: CTSsb;
    exp: express.Application;
    expserver: Server;
    lists: ListsApi;
	apps: CTApps;
	
    setSsb(nssb: CTSsb) {
        this.ssb = nssb;

        this.exp = express();
        this.exp.use(bodyParser.json());
        this.initExp();

        this.lists = new ListsApi(this.ssb);
        this.lists.init(this.exp);

		this.apps = new CTApps(this);
		
        this.expserver = this.exp.listen(PORT);
        console.log("Listening to port " + PORT);
    }

    getLists(): ListsApi {
        return this.lists;
    }
    
    info() {
        var info = new CTInfo();
        info.hello = "Hello!";
        return info;
    }

    addApp(appinfo: CTAppInfo) {
    	this.apps.addApp(appinfo);
    }
    
	appsList() {
		return this.apps.getList();
	}

    async addMessage(content: CTMessageContent, type: string, callback: Function) {
        await this.ssb.addMessage(content, type);
    }

    stop() {
    	if(this.expserver) {
        	this.expserver.close();
        }
    }

    initExp() {
        var self: CTApi = this;

        var urlencodedParser = bodyParser.urlencoded({
            extended: false
        });

        this.exp.post("/send", urlencodedParser, function(req, res) {
            console.log("\"info\" called " + JSON.stringify(req.body));
            var content: CTMessageContent = req.body;
            self.addMessage(content, content.module, (err: string, msg: string, hash: string) => {
                console.log("message added " + JSON.stringify(msg));
                res.send(JSON.stringify(msg));
            });
        });

        this.exp.get("/apps", function(req, res) {
            res.send(JSON.stringify(self.appsList()));
        });

        this.exp.get("/info", function(req, res) {
            console.log("\"info\" called");
            res.send(JSON.stringify(self.info()));
        });
    }
}

export default CTApi;

