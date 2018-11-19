import * as pluralize from 'pluralize';
import CTApp from "./modules/app";
import CTApi from "./modules/api";
import CTSsb from "./modules/ssb";


/**
* @Method: Returns the plural form of any noun.
* @Param {string}
* @Return {string}
*/
export function getPlural(str: any): string {
  return pluralize.plural(str)
}

export { CTApp, CTApi, CTSsb }