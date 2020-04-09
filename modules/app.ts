import CTApi from './api';
import CTSsb from './ssb';
import CTIPFS from './ipfs';

export default class CTApp {
    ssb: CTSsb = new CTSsb();
    api: CTApi = new CTApi();
    ipfs: CTIPFS = new CTIPFS();

    async init() {
        var self = this;

        console.log( "Setting up CTApp" );

        try {
            await this.ssb.init();
            await self.initAfterSsb();
        } catch( e ) {
            // TODO FIXME For some reason ssb server hasn't started before, it starts on the second time
            console.log( "CTApp ssb init failed " + e );
            console.log( "trying again..." );
            await this.ssb.init();
            await self.initAfterSsb();
        };
    }

    async initAfterSsb() {
        console.log( "CTSsb initialized" );

        try {
          await this.ipfs.init();
          this.api.init( this.ssb, this.ipfs );
        } catch(e) {
            console.log( "CTApp IPFS error " + e );
            throw e;
        };

        return this;
    }

    getApi(): CTApi {
        return this.api;
    }

    getSsb(): CTSsb {
        return this.ssb;
    }

    getIPFS(): CTIPFS {
        return this.ipfs;
    }

    async stop() {
        await this.api.stop();
        await this.ssb.stop();
        await this.ipfs.stop();
    }
}
