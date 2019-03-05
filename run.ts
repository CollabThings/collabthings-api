import CTApp from "./modules/app";
import { CTApps, CTAppInfo } from "./modules/apps";
import CTApi from "./modules/api";
import CTSsb from "./modules/ssb";
import { CTMessageContent, CTInfo } from "./modules/common";

let ctapi: CTApi;
let ctapp: CTApp = new CTApp();

ctapp.init().then(() => {
    ctapi = ctapp.getApi();

    ctapi.start();

    console.log( "CTApp created" );
} ).catch(( err: string ) => {
    if ( err ) {
        console.log( "Run creation error " + err );
        process.exit( 1 );
    }
} );
