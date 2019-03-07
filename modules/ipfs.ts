import * as common from './common';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';


const {
    spawn,
    exec,
    execFile
  } = require( 'child_process' );

function ipfslog( s: string ) {
    console.log( "CTIPFS : " + s );
}

export default class CTIPFS {
    daemon: any;

    constructor() {

    }

    async init() {
        var self: CTIPFS = this;

        ipfslog( "IPFS init" );

        await self.downloadAndUnpackLinux();
        await self.runInitIfNeeded();

        return new Promise<String>(( resolve, reject ) => {
            self.runIpfsLinux( ['daemon'] ).then(( daemon: any ) => {
                ipfslog( "got daemon " + daemon );
                self.daemon = daemon;
                daemon.stdout.on( 'data', ( data: string ) => {
                    if(data.indexOf("Daemon is ready")>=0) {
                        resolve();
                    }
                } );
            } );
        } );
    }

    async delay( ms: number ) {
        return new Promise( resolve => setTimeout( resolve, ms ) );
    }

    async runIpfsLinux( args: string[] ) {
        ipfslog( "Running " + args[0] );

        return new Promise<String>(( resolve, reject ) => {

            var ipfs: any = execFile( "go-ipfs/ipfs", args, ( error: string, stdout: string, stderr: string ) => {
                if ( error ) {
                    ipfslog( "ERROR " + error );
                    reject( error );
                }
                ipfslog( args[0] + " process done" );
            } );

            ipfs.stdout.on( 'data', ( data: string ) => {
                ipfslog( args[0] + " : " + data );
            } );

            ipfs.stdout.on( 'exit', ( data: string ) => {
                ipfslog( args[0] + " : EXIT " + data );
            } );

            ipfs.stdout.on( 'close', ( data: string ) => {
                ipfslog( args[0] + " : CLOSE " + data );
            } );

            resolve( ipfs );
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
                    ipfs.stdout.on( 'close', ( data: string ) => {
                        ipfslog( "Init closed  " + data );
                        resolve();
                    } );
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
            if ( fs.existsSync( "go-ipfs/ipfs" ) ) {
                ipfslog( "go-ipfs/ipfs exists" );
                resolve();
            } else {
                // download
                const file = fs.createWriteStream( "ipfs.tar.gz" );
                const request = https.get( "https://dist.ipfs.io/go-ipfs/v0.4.19/go-ipfs_v0.4.19_linux-amd64.tar.gz", function( response: any ) {
                    ipfslog( "downloading ipfs linux-amd64" );
                    response.pipe( file );
                    file.on( 'finish', function() {
                        file.close();  // close() is async, call cb after close completes.
                        ipfslog( "downloading done" );
                        self.unpackTarGz( "ipfs.tar.gz" ).then(( res: string ) => {
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
            execFile( "tar", ['zxf', filename], ( error: string, stdout: string, stderr: string ) => {
                if ( error ) {
                    reject( error );
                }

                ipfslog( stdout );
                resolve( "SUCCESS" );
            } );
        } );
    }

    stop() {
        ipfslog( "Stopping the daemon " + this.daemon );
        this.daemon.kill( 2 );
    }
}
