import * as common from './common';
const pull = require( 'pull-stream' );
import * as fs from 'fs';
import * as path from 'path'
var ssbClient = require( 'ssb-client' )
var ssbServer = require( 'ssb-server' )
var ssbKeys = require( 'ssb-keys' )

var network = process.env.ssb_appname || "ssb";

var config = require( 'ssb-config/inject' )( network )

ssbServer
    .use( require( 'ssb-server/plugins/master' ) )
    .use( require( 'ssb-gossip' ) )
    .use( require( 'ssb-replicate' ) )
    .use( require( 'ssb-friends' ) )
    .use( require( 'ssb-blobs' ) )
    .use( require( 'ssb-invite' ) )
    .use( require( 'ssb-query' ) )
    .use( require( 'ssb-ws' ) )
    .use( require( 'ssb-ebt' ) )
    .use( require( 'ssb-ooo' ) )

export default class CTSsb {
    home: string;
    appname: string;
    ssbpath: string;

    sbot: any;

    handled: string[] = [];

    constructor() {
        this.home = process.env.HOME || "tmp";
        config.appname = network;
        config.path = this.home + "/." + config.appname;
        console.log( "home: " + this.home + " ssb_appname:" + config.appname + " ssbpath:" + config.path );
    }

    startServer() {
        console.log( "Creating a server with config " + config );

        var server: any = ssbServer( config );

        console.log( "CTSsb server " + server );
        console.log( "CTSsb Writing manifest" );

        var manifest = server.getManifest()
        fs.writeFileSync(
            path.join( config.path, 'manifest.json' ), // ~/.ssb/manifest.json
            JSON.stringify( manifest )
        )

        this.delay( 2000 );

        console.log( "CTSsb server started" );
    }

    launchClient(): Promise<String> {
        return new Promise<String>(( resolve, reject ) => {
            try {
                ssbClient( config.keys, ( err: string, sbot: any ) => {
                    if ( err ) {
                        console.log( "ssbClient Error " + err );
                        reject( err );
                    } else {
                        resolve( sbot );
                    }
                } );
            } catch ( e ) {
                console.log( "ssbClient catched Error " + e );
                reject( "" + e );
            }
        } );
    }

    async init(): Promise<String> {
        var self: CTSsb = this;

        config.keys = ssbKeys.loadOrCreateSync( config.path + "/secret" );

        console.log( "Connecting..." );

        return new Promise<String>(( resolve, reject ) => {
            self.launchClient().then(( res ) => {
                console.log( "CTSsb init launchClient success " + res );
                this.sbot = res;
                resolve( "SUCCESS" );
            } ).catch(( e ) => {
                console.log( "CTSsb init launchClient error " + e );
                self.startServer();
                self.launchClient().then(( res2 ) => {
                    this.sbot = res2;
                    console.log( "CTSsb Success sbot " + res2 );
                    resolve( "SUCCESS" );
                } ).catch(( err2 ) => {
                    console.log( "CTSsb second error  " + err2 );
                    reject( err2 );
                } );
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

    async delay( ms: number ) {
        return new Promise( resolve => setTimeout( resolve, ms ) );
    }

    public getUserID(): string {
        return this.sbot.id;
    }

    stop() {
        console.log( "ssb stopping" );
        this.sbot.close();
    }
}