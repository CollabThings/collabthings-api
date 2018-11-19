import * as common from './common';
const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'
const ssbkeys = require('ssb-keys');
const ssbfeed = require('ssb-feed');
const SSB = require('ssb-db/create');

export default class CTSsb {
    pathToDB: string;
    pathToSecret: string;

    keys: JSON;

    ssb: any;
    feed: any;
    
    constructor() {
        this.pathToDB = '../db'
        this.pathToSecret = '../ssb-identity'

        try {
            fs.mkdirSync(path.resolve(this.pathToDB));
        } catch (e) { }

        this.keys = ssbkeys.loadOrCreateSync(this.pathToSecret)

        this.ssb = SSB(this.pathToDB)
        this.feed = this.ssb.createFeed(this.keys)

        // stream all messages for all keypairs.
        pull(
            this.ssb.createFeedStream(),
            pull.collect(function(err: string, ary: Object) {
                console.log(JSON.stringify(ary));
            }));
    }

    public addMessage(content: common.MessageContent, callback: Function): void {
        content.type = "post";
        this.feed.add(JSON.stringify(content), function(err: string, msg: string, hash: string) {
            // the message as it appears in the database:
            console.log(msg)
            // and its hash:
            console.log(hash)

            callback(err, msg, hash);
        });
    }

    stop() { }
}