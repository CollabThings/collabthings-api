const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';
import * as bodyParser from 'body-parser';

import * as common from './common';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';

export class ListsApi {
    ssb: CTSsb;
    lists: { [key: string]: { [key: string]: string } };

    constructor(nssb: CTSsb) {
        this.ssb = nssb;
        this.lists = {};
    }

    getAppInfo(): CTAppInfo {
        var self = this;
        var info: CTAppInfo = new CTAppInfo();

        var urlencodedParser = bodyParser.urlencoded({
            extended: false
        });

        info.name = "lists";

        info.api = (exp: express.Application) => {
            exp.get("/lists", function(req, res) {
                var bookmarks = self.list("/info")
                if (Object.keys(bookmarks).length == 0) {
                    self.add("info", "created at " + new Date());
                }

                res.send(JSON.stringify(self.lists));
            });

            exp.get("/lists/get/:path", function(req, res) {
                var orgpath: string = req.params.path;
                console.log("lists/get org path:" + orgpath);
                var path: string = orgpath.replace(/\+/g, " ");
                console.log("lists/get path:" + path);
                //console.log(JSON.stringify(self.lists));

                path = decodeURIComponent(path);

                self.checkAuthorStream(self.parseUserId(path)).then(() => {
                    var list: { [key: string]: string } = self.list(path);
                    res.send(JSON.stringify(list));
                });
            });

            exp.post("/lists/write", urlencodedParser, function(req, res) {
                console.log("POST " + JSON.stringify(req.body));
                var path: string = self.formatPath(req.body.path);
                var data: string = req.body.data;

                self.add(path, data).then(() => {
                    res.send("OK");
                });
            });
        };

        info.following = (author: string, following: boolean) => {
            self.getOrCreateListWithAuthor(author);
        };

        return info;
    }

    async checkAuthorStream(author: string) {
        if (author.length == 0) {
            return;
        }

        var self: any = this;
        var list: { [key: string]: string } = this.getOrCreateListWithAuthor(author);
        if (typeof (list['initialized']) == 'undefined') {
            this.lists[author]['initialized'] = "intialized " + new Date();
            await this.waitIfEmptyWithAuthor(author);
            console.log("done creating author stream " + author);
        }
    }

    async init() {
        console.log("******************** LISTS INIT");
        await this.ssb.createFeedStreamByCTType("list", (err: string, smsg: string) => {
            this.handleListMessage(err, smsg);
        });
    }

    async handleListMessage(err: string, smsg: string) {
        if (err) {
            console.log("handleListMessage error:" + err);
            return;
        }
        if (smsg.length == 0) {
            console.log("empty msg!");
            return;
        }

        console.log("smsg " + smsg);
        var msg: any = JSON.parse(smsg);

        if (!msg.value.content) {
            console.log("no content");
            return;
        }

        var values: any = msg.value.content.values;
        if (values && values.method && values.value && values.path) {
            console.log("list msg:" + JSON.stringify(values));
            var author = msg.value.author;
            console.log("list msg by " + author);
            var list: { [key: string]: string } = this.getOrCreateListWithAuthor(author);
            list[values.path] = values.value;
        }

    }

    private getOrCreateList(): { [key: string]: string } {
        var author = this.ssb.getUserID();
        return this.getOrCreateListWithAuthor(author);
    }

    private getOrCreateListWithAuthor(author: string): { [key: string]: string } {
        if (typeof (this.lists[author]) == 'undefined') {
            console.log("unknown author " + author)
            this.lists[author] = {};
        }

        return this.lists[author];
    }

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async add(name: string, value: string) {
        await this.addWithAuthor(this.ssb.getUserID(), name, value);
    }

    async addWithAuthor(author: string, name: string, value: string) {
        console.log("*************** LISTS ADD *****************")
        await this.waitIfEmptyWithAuthor(author);

        name = this.formatPath(name);

        if (typeof (this.lists[author]) == 'undefined'
            || this.lists[author][name] != value) {
            console.log("adding to list " + name + " value " + value);
            var content: common.CTMessageContent = new common.CTMessageContent();
            content.values.method = "add";
            content.values.addedAt = "" + new Date();
            content.values.value = value;
            content.values.path = name;

            await this.ssb.addMessage(content, "list");

            this.getOrCreateListWithAuthor(author)[name] = value;

            console.log("value added");
        } else {
            console.log("value already there");
        }
    }

    async waitIfEmpty() {
        await this.waitIfEmptyWithAuthor(this.ssb.getUserID());
    }

    async waitIfEmptyWithAuthor(author: string) {
        var counter: number = 0;
        while (counter++ < 50 && (this.isEmpty() || Object.keys(this.lists[author]).length <= 1)) {
            // TODO this is stupid but I'm not sure how this should be done.
            console.log("lists empty!");
            await this.delay(400);
        }
    }

    private isEmpty(): Boolean {
        return Object.keys(this.lists).length == 0;
    }

    private formatPath(path: string): string {
        if (path.indexOf("/") != 0) {
            path = "/" + path;
        }

        path = path.replace(/\/\//g, "/");
        return path;
    }

    list(name: string): { [key: string]: string } {
        var userid: string = this.ssb.getUserID();
        var path: string = name;

        if (name.indexOf("@") == 0) {
            var edindex: any = name.indexOf("=.ed");
            var slashindex: any = name.indexOf("/", edindex + 3);

            userid = name.substr(0, slashindex);
            path = name.substr(slashindex);
            console.log("starts with a userid " + userid + " path:" + path);
        }

        return this.listWithAuthor(userid, this.formatPath(path));
    }

    parseUserId(path: string): string {
        if (path.indexOf("@") == 0) {
            var edindex: any = path.indexOf("=.ed");
            var slashindex: any = path.indexOf("/", edindex + 3);
            return path.substr(0, slashindex);
        } else {
            return "";
        }
    }

    listWithAuthor(author: string, name: string): { [key: string]: string } {
        var orglist: { [key: string]: string } = this.getOrCreateListWithAuthor(author);
        console.log("orglist " + JSON.stringify(orglist));

        var list: { [key: string]: string } = {};
        for (var ik in Object.keys(orglist)) {
            var k: string = Object.keys(orglist)[ik];
            console.log("checking key " + k + " to " + name);
            if (k.startsWith(name)) {
                list[k] = orglist[k];
            }
        }

        console.log("list " + JSON.stringify(list));

        return list;
    }

    private getList(author: string): { [key: string]: string } {
        var l = this.lists[author];
        if (l == null) {
            l = {};
            this.lists[author] = l;
        }

        return l;
    }

    stop() { }
}

