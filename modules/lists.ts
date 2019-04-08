const pull = require( 'pull-stream' );
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';
import * as bodyParser from 'body-parser';

import * as common from './common';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';

export class ListsApi {
    ssb: CTSsb;
    lists: any;

    constructor( nssb: CTSsb ) {
        this.ssb = nssb;
        this.lists = {};
    }

    getAppInfo(): CTAppInfo {
        var self = this;
        var info: CTAppInfo = new CTAppInfo();

        var urlencodedParser = bodyParser.urlencoded( {
            extended: false
        } );

        info.name = "lists";

        info.api = ( exp: express.Application ) => {
            exp.get( "/lists", function( req, res ) {
                self.getLists().then(( lists ) => {
                    res.send( JSON.stringify( lists ) );
                } );
            } );

            exp.get( "/lists/get/:path", function( req, res ) {
                var orgpath: string = req.params.path;
                console.log( "lists/get org path:" + orgpath );
                var path: string = orgpath.replace( /\+/g, " " );
                console.log( "lists/get path:" + path );

                path = decodeURIComponent( path );

                self.list( path ).then(( list: any ) => {
                    res.send( JSON.stringify( list ) );
                } );
            } );

            exp.post( "/lists/write", urlencodedParser, function( req, res ) {
                console.log( "POST " + JSON.stringify( req.body ) );
                var path: string = self.formatPath( req.body.path );
                var data: string = req.body.data;

                self.add( path, data ).then(() => {
                    res.send( "OK" );
                } );
            } );
        };

        return info;
    }

    async getLists() {
        return new Promise(( resolve, reject ) => {
            this.ssb.getSbot().collabthingsList.get(( err: string, state: any ) => {
                console.log( "LISTS sbot test collabthingsList " + JSON.stringify( state ) );
                resolve( state );
            } );
        } );
    }

    async getAuthorList( author: string ) {
        return new Promise(( resolve, reject ) => {
            this.getLists().then(( lists: any ) => {
                resolve( lists[author] );
            } );
        } );
    }

    async list( path: string ) {
        var self = this;

        var userid: string = this.ssb.getUserID();

        if ( path.indexOf( "@" ) == 0 ) {
            var edindex: any = path.indexOf( "=.ed" );
            var slashindex: any = path.indexOf( "/", edindex + 3 );

            userid = path.substr( 0, slashindex );
            path = path.substr( slashindex );
            console.log( "starts with a userid " + userid + " path:" + path );
        }

        var formattedpath = this.formatPath( path );

        return new Promise<{ [key: string]: string }>(( resolve, reject ) => {
            this.getAuthorList( userid ).then(( list: any ) => {
                if ( list ) {
                    resolve( self.searchList( list, formattedpath ) );
                } else {
                    reject("list not found");
                }
            } );
        } );
    }


    searchList( orglist: { [key: string]: string }, path: string ): { [key: string]: string } {
        console.log( "orglist " + JSON.stringify( orglist ) );

        var list: { [key: string]: string } = {};
        for ( var ik in Object.keys( orglist ) ) {
            var k: string = Object.keys( orglist )[ik];
            console.log( "checking key " + k + " to " + path );
            if ( k.startsWith( path ) ) {
                list[k] = orglist[k];
            }
        }

        console.log( "list " + JSON.stringify( list ) );

        return list;
    }

    async init() {
        console.log( "******************** LISTS INIT" );
    }

    async delay( ms: number ) {
        return new Promise( resolve => setTimeout( resolve, ms ) );
    }

    async add( name: string, value: string ) {
        await this.addWithAuthor( this.ssb.getUserID(), name, value );
    }

    async addWithAuthor( author: string, name: string, value: string ) {
        console.log( "*************** LISTS ADD *****************" )
        await this.waitIfEmptyWithAuthor( author );

        name = this.formatPath( name );

        if ( typeof ( this.lists[author] ) == 'undefined'
            || this.lists[author][name] != value ) {
            console.log( "adding to list " + name + " value " + value );
            var content: common.CTMessageContent = new common.CTMessageContent();
            content.values.method = "add";
            content.values.addedAt = "" + new Date();
            content.values.value = value;
            content.values.path = name;

            await this.ssb.addMessage( content, "list" );

            console.log( "value added" );
        } else {
            console.log( "value already there" );
        }
    }

    async waitIfEmpty() {
        await this.waitIfEmptyWithAuthor( this.ssb.getUserID() );
    }

    async waitIfEmptyWithAuthor( author: string ) {
        var counter: number = 0;
        while ( counter++ < 1 && ( this.isEmpty() || Object.keys( this.lists[author] ).length <= 1 ) ) {
            // TODO this is stupid but I'm not sure how this should be done.
            console.log( "lists empty!" );
            await this.delay( 2000 );
        }
    }

    private isEmpty(): Boolean {
        return Object.keys( this.lists ).length == 0;
    }

    private formatPath( path: string ): string {
        if ( path.indexOf( "/" ) != 0 ) {
            path = "/" + path;
        }

        path = path.replace( /\/\//g, "/" );
        return path;
    }

    parseUserId( path: string ): string {
        if ( path.indexOf( "@" ) == 0 ) {
            var edindex: any = path.indexOf( "=.ed" );
            var slashindex: any = path.indexOf( "/", edindex + 3 );
            return path.substr( 0, slashindex );
        } else {
            return "";
        }
    }

    stop() { }
}

