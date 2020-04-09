import CTApp from "./modules/app";
import CTApi from "./modules/api";
import CTSsb from './modules/ssb';

let ctapi: CTApi;
let ctapp: CTApp = new CTApp();

ctapp.init().then(() => {
	ctapi = ctapp.getApi();	
	ctapi.start();
	console.log("CTApp created"); 
}).catch((err: string) => {
	if(err) {
		console.log("CTApp creation error " + err);
	}
});
