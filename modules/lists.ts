const pull = require('pull-stream');
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import Api from './api';


export default class ListsApi {
    api: Api;

    constructor(napi: Api) {
        this.api = napi;
    }

    init(exp: express.Application) {
    }

    addMessage(content: common.MessageContent, callback: Function): void {
        content.type = "post";
        /*
                        this.api.add(JSON.stringify(content), function(err: string, msg: string, hash: string) {
                    // the message as it appears in the database:
                    console.log(msg)
                    // and its hash:
                    console.log(hash)
        
                    callback(err, msg, hash);
                });
        */
    }

    stop() { }
}
