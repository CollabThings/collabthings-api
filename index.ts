import * as pluralize from 'pluralize';
import CTApp from "./modules/app";
import { CTApps, CTAppInfo } from "./modules/apps";
import CTApi from "./modules/api";
import CTSsb from "./modules/ssb";
import { CTMessageContent, CTInfo } from "./modules/common";


/**
* @Method: Returns the plural form of any noun.
* @Param {string}
* @Return {string}
*/
export function getPlural(str: any): string {
  return pluralize.plural(str)
}

export { CTApp, CTApi, CTSsb, CTApps, CTAppInfo, CTMessageContent }
