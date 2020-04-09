import * as common from './common';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';


const IPFS = require('ipfs')
const all = require('it-all')
const { Buffer } = IPFS

var lockFile = require('lockfile');
var psList = require('ps-list');

import express from 'express';

import { CTApps, CTAppInfo } from './apps';

var ipfsnode: any;

function ipfslog(s: string) {
    console.log("CTIPFS[" + process.env.HOME + "] : " + s);
}

type NewType = string;

export default class CTIPFS {
    processes: { [key: string]: any } = {};
    ipfsnode: any;

    constructor() {

    }

    getAppInfo(): CTAppInfo {
        var self = this;
        var info: CTAppInfo = new CTAppInfo();

        info.name = "ipfs";

        info.api = (exp: express.Application) => {
            exp.get("/ipfs/:path", function(req, res) {
                var orgpath: string = req.params.path;

                ipfsnode.cat(orgpath, (err: string, file: string) => {
                    if (err) {
                        ipfslog("ERROR " + err);
                    }
                    ipfslog("cat " + path);
                    res.send(file);
                });

            });
        }

        return info;
    }

    async init() {
        var self: CTIPFS = this;

        ipfslog("IPFS init");

        this.ipfsnode = await IPFS.create();
        var version = await this.ipfsnode.version()
        ipfslog('Version:' + version.version)

        await this.waitAndTest();
    }

    async cat(id: string): Promise<String> {
        const chunks = []
        for await (const chunk of this.ipfsnode.cat(id)) {
            chunks.push(chunk)
        }

        var content = Buffer.concat(chunks).toString();
        console.log("content " + content);
        return content;
    }

    async waitAndTest() {
        ipfslog("Testing client");

        var content = await this.cat("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme");
        ipfslog("cat test " + content);
    }

    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stop() {
        if (this.ipfsnode) {
            ipfslog("Stopping IPFS ");
            try {
                await this.ipfsnode.stop();
                this.ipfsnode = null;
            } catch (e) {
                ipfslog("stop ERROR " + e);
            }
            ipfslog("Stopping IPFS done");
        }
    }
}
