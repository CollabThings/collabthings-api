import express from 'express';
import * as serveStatic from 'serve-static';
import * as bodyParser from 'body-parser';
import * as App from './app';
import CTSsb from './ssb';
import CTApps from './apps';
import { Server } from 'net';
import { MessageContent, Info } from './common';
import { ListsApi } from './lists';

var PORT: number = 14881;

export default class Api {
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
        var info = new Info();
        info.hello = "Hello!";
        return info;
    }

	appsList() {
		return this.apps.getList();
	}

    async addMessage(content: MessageContent, type: string, callback: Function) {
        await this.ssb.addMessage(content, type);
    }

    stop() {
    	if(this.expserver) {
        	this.expserver.close();
        }
    }

    initExp() {
        var self: Api = this;

        var urlencodedParser = bodyParser.urlencoded({
            extended: false
        });

        this.exp.post("/send", urlencodedParser, function(req, res) {
            console.log("\"info\" called " + JSON.stringify(req.body));
            var content: MessageContent = req.body;
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
