import * as pluralize from 'pluralize';
import App from "./modules/app";


/**
* @Method: Returns the plural form of any noun.
* @Param {string}
* @Return {string}
*/
export function getPlural(str: any): string {
  return pluralize.plural(str)
}

