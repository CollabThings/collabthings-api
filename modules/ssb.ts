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
    .use( require( 'ssb-server/plugins/onion' ) )
    .use( require( 'ssb-server/plugins/unix-socket' ) )
    .use( require( 'ssb-server/plugins/no-auth' ) )
    .use( require( 'ssb-server/plugins/plugins' ) )
    .use( require( 'ssb-server/plugins/local' ) )
    .use( require( '../plugins/lists' ) )
    .use( require( 'ssb-gossip' ) )
    .use( require( 'ssb-replicate' ) )
    .use( require( 'ssb-friends' ) )
    .use( require( 'ssb-backlinks' ) )
    .use( require( 'ssb-about' ) )
    .use( require( 'ssb-contacts' ) )    
    .use( require( 'ssb-links' ) )
    .use( require( 'ssb-identities' ) )
    .use( require( 'ssb-blobs' ) )
    .use( require( 'ssb-invite' ) )
    .use( require( 'ssb-query' ) )
    .use( require( 'ssb-ws' ) )
    .use( require( 'ssb-ebt' ) )
    .use( require( 'ssb-ooo' ) )

function ssblog( s: string ) {
    console.log( "SSB : " + s );
}

function checkFailedProgress( a: any ) {
    if ( a && a.index == -1 ) {
        return true;
    }
}

function checkShouldWaitProgress( a: any ) {
    if ( a && a.current != -1 && a.current != a.target ) {
        return true;
    }
}

export default class CTSsb {
    home: string;
    appname: string;
    ssbpath: string;

    sbot: any;
    server: any;

    indexfailedcount: number = 0;

    handled: string[] = [];

    constructor() {
        this.home = process.env.HOME || "tmp";
        config.appname = network;
        config.path = this.home + "/." + config.appname;// + "-collabthigs";
        ssblog( "home: " + this.home + " ssb_appname:" + config.appname + " ssbpath:" + config.path );
        ssblog( "config:" + JSON.stringify( config ) );
    }

    getSbot(): any {
        return this.sbot;
    }

    async startServer() {
        var self: CTSsb = this;

        ssblog( "Creating a server with config " + config );

        this.server = ssbServer( config );

        ssblog( "CTSsb server " + this.server.version() + " status:" + JSON.stringify( this.server.progress() ) );
        ssblog( "CTSsb Writing manifest" );

        var manifest = this.server.getManifest()
        fs.writeFileSync(
            path.join( config.path, 'manifest.json' ), // ~/.ssb/manifest.json
            JSON.stringify( manifest )
        )

        ssblog( "CTSsb server started" );
        return new Promise<String>(( resolve, reject ) => {
            self.whenServerReady( resolve, reject );
        } );
    }

    whenServerReady( resolve: Function, reject: Function ) {
        var self: CTSsb = this;

        self.delay( 2000 ).then(() => {
            var progress: any = self.server.progress();
            ssblog( "CTSsb server progress :" + JSON.stringify( progress ) );

            var failed: boolean = false;
            var shouldwait: boolean = false;

            ssblog( "indexes.current " + progress.indexes.current + " failedcount:" + self.indexfailedcount );

            if ( checkFailedProgress( progress.indexes ) ) failed = true;
            if ( checkFailedProgress( progress.ooo ) ) failed = true;
            //            if ( checkFailedProgress( progress.ebt ) ) failed = true;

            if ( checkShouldWaitProgress( progress.indexes ) ) shouldwait = true;
            if ( checkShouldWaitProgress( progress.ooo ) ) shouldwait = true;
            //            if ( checkShouldWaitProgress( progress.ebt ) ) shouldwait = true;

            ssblog( "shouldwait: " + shouldwait + " failed:" + failed );

            if ( shouldwait ) {
                self.whenServerReady( resolve, reject );
            } else if ( failed ) {
                self.indexfailedcount++;
                if ( self.indexfailedcount > 5 ) {
                    ssblog( "enough waiting..." );
                    ssblog( "publish started messages" );
                    self.indexfailedcount = 0;
                    resolve();
                } else {
                    self.whenServerReady( resolve, reject );
                }
            } else {
                ssblog( "Done?" );
                resolve();
            }
        } );
    }

    launchClient(): Promise<String> {
        return new Promise<String>(( resolve, reject ) => {
            try {
                ssbClient( config.keys, ( err: string, sbot: any ) => {
                    if ( err ) {
                        ssblog( "ssbClient Error " + err );
                        reject( err );
                    } else {
                        resolve( sbot );
                    }
                } );
            } catch ( e ) {
                ssblog( "ssbClient catched Error " + e );
                reject( "" + e );
            }
        } );
    }

    async init(): Promise<String> {
        var self: CTSsb = this;

        ssblog( "************** CTSSb init" );

        config.keys = ssbKeys.loadOrCreateSync( config.path + "/secret" );

        ssblog( "Connecting..." );

        return new Promise<String>(( resolve, reject ) => {
            self.launchClient().then(( res ) => {
                ssblog( "CTSsb init launchClient success " + res );
                this.sbot = res;
                resolve( "SUCCESS" );
            } ).catch(( e ) => {
                ssblog( "CTSsb init launchClient error " + e );
                self.startServer().then(() => {
                    ssblog( "launching client again" );
                    self.launchClient().then(( res2 ) => {
                        this.sbot = res2;
                        ssblog( "sbot test " + this.sbot.test );

                        ssblog( "sbot names " + Object.getOwnPropertyNames( this.sbot ) );
                        ssblog( "sbot friends names " + Object.getOwnPropertyNames( this.sbot.friends ) );
                        ssblog( "sbot about names " + Object.getOwnPropertyNames( this.sbot.about ) );
                        ssblog( "sbot contacts names " + Object.getOwnPropertyNames( this.sbot.contacts ) );
                        //ssblog( "sbot test names " + Object.getOwnPropertyNames( this.sbot.test ) );

                        ssblog( "CTSsb Success sbot " + res2 );
                        resolve( "SUCCESS" );
                    } ).catch(( err2 ) => {
                        ssblog( "CTSsb second error  " + err2 );
                        reject( err2 );
                    } );
                } );

                ssblog( "init promise out" );
            } );
        } );
    }

    public async follow( author: string ) {
        ssblog( "following " + author );
        await this.publish( { type: 'contact', contact: author, following: true } );
    }

    public publish( content: any ): Promise<string> {
        ssblog( "publish " + content );
        return new Promise(( resolve, reject ) => {
            this.sbot.publish( JSON.parse( JSON.stringify( content ) ), function( err: string, msg: string ) {
                if ( err ) {
                    ssblog( "ERROR addMessage " + err );
                    reject( err );
                } else {
                    ssblog( "messageAdded " + JSON.stringify( msg ) );
                    resolve( msg );
                }
            } );
        } );
    }

    public getMessagesByType( stype: string, callback: Function ) {
        var self: any = this;

        if ( this.sbot.collabthingslist ) {
            this.sbot.collabthingslist.get(( err: string, state: any ) => {
                if ( state && state != 'false' ) {
                    ssblog( "sbot test state " + JSON.stringify( state ) );
                }
            } );
        } else {
            ssblog( "sbot.collabthings_list not defined" );
        }
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
            ssblog( "sending message " + JSON.stringify( content ) );
            this.sbot.publish( JSON.parse( JSON.stringify( content ) ), function( err: string, msg: string ) {
                if ( err ) {
                    ssblog( "ERROR addMessage " + err );
                    reject( err );
                } else {
                    ssblog( "messageAdded " + msg );
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
        ssblog( "ssb stopping" );
        this.sbot.close();
    }
}