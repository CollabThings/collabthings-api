import Api from './api';
import CTSsb from './ssb';

export default class App {
    ssb: CTSsb = new CTSsb();
    api: Api = new Api();

    constructor(ready: Function) {
       	console.log("Setting up CTApp");
        this.ssb.init(() => {
        	console.log("CTSsb initialized");
            this.api.setSsb(this.ssb);
            ready();
        });
    }

    getApi(): Api {
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
