import Api from './api';
import CTSsb from './ssb';

export default class App {
  ssb: CTSsb = new CTSsb; 
  api: Api = new Api(this.ssb);

  getApi(): Api {           
    return this.api;
 } 

  getSsb(): CTSsb {    
    return this.ssb;
  }

  stop() {           
     this.api.stop();
  }
}
