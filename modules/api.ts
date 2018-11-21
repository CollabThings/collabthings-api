import express from 'express';
import * as serveStatic from 'serve-static';
import * as bodyParser from 'body-parser';
import * as App from './app';
import CTSsb from './ssb';
import { Server } from 'net';
import { MessageContent, Info } from './common';
import ListsApi from './lists';

var PORT: number = 14881;

export default class Api {
    ssb: CTSsb;
    exp: express.Application;
    expserver: Server;
    lists: ListsApi;

    setSsb(nssb: CTSsb) {
        this.ssb = nssb;

        this.exp = express();
        this.exp.use(bodyParser.json());
        this.initExp();

        this.lists = new ListsApi(this);
        this.lists.init(this.exp);

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


    addMessage(content: MessageContent, type: string, callback: Function) {
        this.ssb.addMessage(content, type, callback);
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

        this.exp.get("/info", function(req, res) {
            console.log("\"info\" called");
            res.send(JSON.stringify(self.info()));
        });
    }
}
