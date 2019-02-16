import express from 'express';
import path from 'path';
import * as serveStatic from 'serve-static';
import * as bodyParser from 'body-parser';
import * as CTApp from './app';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';
import { Server } from 'net';
import { CTMessageContent, CTInfo } from './common';
import { ListsApi } from './lists';
import { UsersApi } from './users';

var PORT: number = 14881;

class CTApi {
    ssb: CTSsb;
    exp: express.Application;
    expserver: Server;
    lists: ListsApi;
    users: UsersApi;
    
	apps: CTApps;
	
    init(nssb: CTSsb) {
        this.ssb = nssb;
		this.apps = new CTApps(this);
        this.lists = new ListsApi(this.ssb);
        this.addApp(this.lists.getAppInfo());
        this.lists.init();

        this.users = new UsersApi(this.ssb);
        this.addApp(this.users.getAppInfo());
        this.users.init();
    }
    
    start() {
        this.exp = express();
        this.initExp();

        var port:number;
        
        console.log("CT_API_PORT " + process.env.CT_API_PORT);
        if(process.env.CT_API_PORT) {
        	port = +process.env.CT_API_PORT;
        } else {
        	port = PORT;
        }
        
        this.expserver = this.exp.listen(port);
        console.log("Listening to port " + port);
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
        
        var staticdir: string = path.join(__dirname, '../static');
        console.log("Serve static in " + staticdir);
        
        this.exp.use("/static", express.static(staticdir, {
        	setHeaders: function(res, path) {
        		console.log("request " + path);
        		if (path.indexOf("download") !== -1) {
        			res.attachment(path)
        		}
        	},
		}));

        this.apps.initStatic(this.exp);

        this.exp.use(bodyParser.json());

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

        this.apps.initApi(this.exp);
    }
}

export default CTApi;

