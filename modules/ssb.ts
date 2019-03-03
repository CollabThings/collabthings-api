import * as common from './common';
const pull = require( 'pull-stream' );
import * as fs from 'fs';
import * as path from 'path'
var ssbClient = require( 'ssb-client' )
var ssbKeys = require( 'ssb-keys' )

export default class CTSsb {
    home: string;
    appname: string;
    ssbpath: string;

    sbot: any;

    handled: string[] = [];

    constructor() {
        this.home = process.env.HOME || "tmp";
        this.appname = process.env.ssb_appname || "ssb-collabthings"
        this.ssbpath = this.home + "/." + this.appname;
        console.log( "home: " + this.home + " ssb_appname:" + this.appname + " ssbpath:" + this.ssbpath );
    }

    async init(): Promise<String> {
        var keys = ssbKeys.loadOrCreateSync( this.home + "/." + this.appname + "/secret" );

        return new Promise<String>(( resolve, reject ) => {
            ssbClient( keys, ( err: string, sbot: any ) => {
                if ( err ) {
                    console.log( "Collabthings ssbClient " + err );
                    reject( err );
                }

                this.sbot = sbot;
                console.log( "sbot client create " + JSON.stringify( sbot ) );
                resolve( err );
            } );
        } );
    }

    public async follow( author: string ) {
        console.log( "following " + author );
        await this.publish( { type: 'contact', contact: author, following: true } );
    }

    public publish( content: any ): Promise<string> {
        return new Promise(( resolve, reject ) => {
            this.sbot.publish( JSON.parse( JSON.stringify( content ) ), function( err: string, msg: string ) {
                if ( err ) {
                    console.log( "ERROR addMessage " + err );
                    reject( err );
                } else {
                    console.log( "messageAdded " + msg );
                    resolve( msg );
                }
            } );
        } );
    }

    public getMessagesByType( stype: string, callback: Function ) {
        var self: any = this;

        pull(
            this.sbot.messagesByType( stype ),
            pull.collect( function( err: string, msgs: [] ) {
                if ( err ) {
                    console.log( "ERROR getMessagesByType type:\"" + stype + "\" error:" + JSON.stringify( err ) );
                    callback( err, "" );
                } else {
                    for ( var i in msgs ) {
                        var msg: string = JSON.stringify( msgs[i] );
                        var omsg: any = msgs[i];
                        var msgkey: string = "" + omsg.key;


                        if ( !self.handled.includes( msgkey ) ) {
                            self.handled.push( msgkey );

                            if ( omsg.value.content.type == stype ) {
                                callback( err, msg );
                            }
                        } else {
                            // nothing to do
                            // console.log( "getMessagesByType: already handled " + omsg.key + " handled:" + self.handled );
                        }
                    }

                    setTimeout(() => {
                        self.getMessagesByType( stype, callback );
                    }, 2000 );
                }
            } ) );
    }

    public createFeedStreamByType( type: string, callback: Function ) {
        this.getMessagesByType( type, callback );
    };

    public createFeedStreamByCTType( type: string, callback: Function ) {
        this.getMessagesByType( "collabthings-" + type, callback );
    }

    public addMessage( content: common.CTMessageContent, type: string ): Promise<string> {
        content.type = "collabthings-" + type;
        content.module = type;

        return new Promise(( resolve, reject ) => {
            console.log( "sending message " + JSON.stringify( content ) );
            this.sbot.publish( JSON.parse( JSON.stringify( content ) ), function( err: string, msg: string ) {
                if ( err ) {
                    console.log( "ERROR addMessage " + err );
                    reject( err );
                } else {
                    console.log( "messageAdded " + msg );
                    resolve( msg );
                }
            } );
        } );
    }

    public getUserID(): string {
        return this.sbot.id;
    }

    stop() {
        console.log( "ssb stopping" );
        this.sbot.close();
    }
}