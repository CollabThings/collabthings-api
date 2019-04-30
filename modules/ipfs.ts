import * as common from './common';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

var lockFile = require( 'lockfile' );
var psList = require( 'ps-list' );

import express from 'express';

import { CTApps, CTAppInfo } from './apps';

var ipfsClient = require( 'ipfs-http-client' );
var ipfspath = "software/go-ipfs/ipfs";

const {
    spawn,
    exec,
    execFile
  } = require( 'child_process' );

function ipfslog( s: string ) {
    console.log( "CTIPFS[" + process.env.HOME + "] : " + s );
}

export default class CTIPFS {
    processes: { [key: string]: any } = {};

    constructor() {

    }

    getAppInfo(): CTAppInfo {
        var self = this;
        var info: CTAppInfo = new CTAppInfo();

        info.name = "ipfs";

        info.api = ( exp: express.Application ) => {
            exp.get( "/ipfs/:path", function( req, res ) {
                var orgpath: string = req.params.path;

                var ipfs = ipfsClient( 'localhost', '5001', { protocol: 'http' } );
                ipfs.cat( orgpath, ( err: string, file: string ) => {
                    if(err) {
                        ipfslog("ERROR " + err);
                    }
                    ipfslog( "cat " + path);
                    res.send( file );
                } );

            } );
        }

        return info;
    }

    async init() {
        var self: CTIPFS = this;

        ipfslog( "IPFS init" );


        if ( !this.isDaemonRunning() ) {
            await self.downloadAndUnpackLinux();
            await self.runInitIfNeeded();
        }

        ipfslog( "download and init done" );

        if ( self.isDaemonRunning() ) {
            await this.waitAndTest();
        } else {
            ipfslog( "error. Launching daemon." );
            await self.runIpfs( ['daemon'], true );

            await this.waitAndTest();
        }
    }

    async waitAndTest() {
        ipfslog( "Testing client" );

        while ( this.isDaemonRunning() ) {
            try {
                await this.runIpfs( ['swarm', 'peers'] );
                await new Promise<string>(( resolve, reject ) => {
                    var ipfs = ipfsClient( 'localhost', '5001', { protocol: 'http' } ) // leaving out the arguments will default to these values
                    ipfs.cat( "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme", ( err: string, file: string ) => {
                        ipfslog( "cat " + err + " " + file );
                        resolve();
                    } ).catch(( err: string ) => {
                        reject( err );
                    } );
                } );

                ipfslog( "waitAndTest success" );
                // success. exit the loop
                break;
            } catch ( err ) {
                ipfslog( "waitAndTest " + err );
                await this.delay( 6000 );
            }
        }

        ipfslog( "waiting done" );
    }

    isDaemonRunning() {
        var found: any = false;

        psList().then(( data: any ) => {
            data.forEach(( p: any ) => {
                if ( p.cmd && p.cmd.toLowerCase().indexOf( "ipfs daemon" ) >= 0 ) {
                    ipfslog( "found ipfs daemon process " + JSON.stringify( p ) );
                    found = true;
                }
            } );
            //=> [{pid: 3213, name: 'node', cmd: 'node test.js', cpu: '0.1'}, ...] 
        } );

        return found;
    }

    async delay( ms: number ) {
        return new Promise( resolve => setTimeout( resolve, ms ) );
    }

    async runIpfs( args: string[], quickresolve?: boolean ) {
        return this.runIpfsLinux( args, quickresolve );
    }

    async runIpfsLinux( args: string[], quickresolve?: boolean ) {
        var self: CTIPFS = this;

        ipfslog( "Running " + args[0] );

        return new Promise<any>(( resolve, reject ) => {
            var ipfs: any = execFile( ipfspath, args, ( error: string, stdout: string, stderr: string ) => {
                if ( error ) {
                    ipfslog( "ERROR " + error );
                    reject( error );
                } else {
                    ipfslog( args[0] + " process done" );
                    resolve( ipfs );
                }
            } );

            if ( ipfs ) {
                self.processes[args[0]] = ipfs;

                if ( quickresolve ) {
                    ipfslog( "quickresolve " + ipfs );
                    resolve();
                }

                ipfs.stdout.on( 'data', ( data: string ) => {
                    ipfslog( args[0] + " : " + data );
                } );

                ipfs.stdout.on( 'exit', ( data: string ) => {
                    ipfslog( args[0] + " : EXIT " + data );
                } );

                ipfs.stdout.on( 'close', ( data: string ) => {
                    ipfslog( args[0] + " : CLOSE " + data );
                } );
            } else {
                reject( "failed to launch ipfs" );
            }
        } );
    }

    async runInitIfNeeded() {
        ipfslog( "runInitIfNeeded" );

        var self: CTIPFS = this;

        // if $HOME/.ipfs not found, run init and resolve after process is closed
        return new Promise<String>(( resolve, reject ) => {
            if ( !fs.existsSync( process.env.HOME + "/.ipfs" ) ) {
                ipfslog( "Init .ipfs not found" );
                self.runIpfsLinux( ['init'] ).then(( ipfs: any ) => {
                    resolve();
                } );
            } else {
                resolve();
            }
        } );
    }

    async downloadAndUnpackLinux() {
        ipfslog( "downloadAndUnpackLinux" );

        var self: CTIPFS = this;

        return new Promise<String>(( resolve, reject ) => {
            if ( fs.existsSync( ipfspath ) ) {
                ipfslog( "go-ipfs/ipfs exists" );
                resolve();
            } else {
                // download
                fs.mkdirSync( "software", { recursive: true } );

                const file = fs.createWriteStream( "software/ipfs.tar.gz" );
                const request = https.get( "https://dist.ipfs.io/go-ipfs/v0.4.19/go-ipfs_v0.4.19_linux-amd64.tar.gz", function( response: any ) {
                    ipfslog( "downloading ipfs linux-amd64" );
                    response.pipe( file );
                    file.on( 'finish', function() {
                        file.close();  // close() is async, call cb after close completes.
                        ipfslog( "downloading done" );
                        self.unpackTarGz( "software/ipfs.tar.gz" ).then(( res: string ) => {
                            resolve();
                        } );
                    } );
                } );
            }
        } );
    }

    async unpackTarGz( filename: string ) {
        var self: CTIPFS = this;

        return new Promise<string>(( resolve, reject ) => {
            execFile( "tar", ['zxf', filename, '-C', 'software'], ( error: string, stdout: string, stderr: string ) => {
                if ( error ) {
                    reject( error );
                }

                ipfslog( stdout );
                resolve( "SUCCESS" );
            } );
        } );
    }

    stop() {
        var daemon = this.processes['daemon'];
        ipfslog( "Stopping the daemon " + daemon );
        if ( daemon ) {
            daemon.kill( 2 );
        }
    }
}
