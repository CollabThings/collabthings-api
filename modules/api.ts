"use strict";

import express from 'express';
import * as serveStatic from 'serve-static';
import * as bodyParser from 'body-parser';
import * as App from './app';
import CTSsb from './ssb';
import { Server } from 'net';
import { MessageContent } from './common';

var PORT: number = 14881;

export default class Api {
    ssb: CTSsb;
    exp: express.Application;
    expserver: Server;

    constructor(nssb: CTSsb) {
        this.ssb = nssb;

        this.exp = express();
        this.exp.use(bodyParser.json());
        this.initExp();
        this.expserver = this.exp.listen(PORT);
        console.log("Listening to port " + PORT);

    }

    info() {
        class Info {
            hello: String = "hello";
        }

        var info = new Info();
        info.hello = "Hello!";
        return info;
    }


    addMessage(content: MessageContent, callback: Function) {
        this.ssb.addMessage(content, callback);
    }

    stop() {
        this.expserver.close();
    }

    initExp() {
        var self: Api = this;

        var urlencodedParser = bodyParser.urlencoded({
            extended: false
        });

        this.exp.post("/send", urlencodedParser, function(req, res) {
            console.log("\"info\" called " + JSON.stringify(req.body));
            var content: MessageContent = req.body;
            self.addMessage(content, (err: string, msg: string, hash: string) => {
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
