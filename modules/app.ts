import CTApi from './api';
import CTSsb from './ssb';

export default class CTApp {
    ssb: CTSsb = new CTSsb();
    api: CTApi = new CTApi();

    async init(): Promise<CTApp> {
        var self = this;
        console.log( "Setting up CTApp" );
        try {
            await this.ssb.init();
        } catch ( e ) {
            console.log( "CTApp ssb init failed " + e );
            console.log( "trying again..." );
            await this.ssb.init();
        }

        return new Promise<CTApp>(( resolve, reject ) => {
            console.log( "CTSsb initialized" );
            this.api.init( this.ssb );
            resolve( self );
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
