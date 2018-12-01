import CTApi from './api';
import CTSsb from './ssb';

export default class CTApp {
    ssb: CTSsb = new CTSsb();
    api: CTApi = new CTApi();

    constructor(ready: Function) {
       	console.log("Setting up CTApp");
        this.ssb.init(() => {
        	console.log("CTSsb initialized");
            this.api.init(this.ssb);
            ready();
        });
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
