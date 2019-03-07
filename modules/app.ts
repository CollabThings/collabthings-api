import CTApi from './api';
import CTSsb from './ssb';
import CTIPFS from './ipfs';

export default class CTApp {
    ssb: CTSsb = new CTSsb();
    api: CTApi = new CTApi();
    ipfs: CTIPFS = new CTIPFS();

    async init(): Promise<CTApp> {
        var self = this;

        return new Promise<CTApp>(( resolve, reject ) => {
            console.log( "Setting up CTApp" );

            this.ssb.init().then(( res ) => {
                self.initAfterSsb( resolve, reject );
            } ).catch(( e ) => {
                // TODO FIXME For some reason ssb server hasn't started before, it starts on the second time
                console.log( "CTApp ssb init failed " + e );
                console.log( "trying again..." );
                this.ssb.init().then(( res ) => {
                    self.initAfterSsb( resolve, reject );
                } ).catch(( e ) => {
                    console.log( "CTApp init failed " + e );
                    reject( "CTApp init failed " + e );
                } );
            } );
        } );
    }

    initAfterSsb( resolve: Function, reject: Function ) {
        console.log( "CTSsb initialized" );

        this.ipfs.init().then(( res ) => {
            this.api.init( this.ssb, this.ipfs );
            resolve( this );
        } ).catch(( e ) => {
            console.log( "CTApp IPFS error " + e );
            reject( e );
        } );

    }

    getApi(): CTApi {
        return this.api;
    }

    getSsb(): CTSsb {
        return this.ssb;
    }

    stop() {
        this.api.stop();
        this.ssb.stop();
    }
}
