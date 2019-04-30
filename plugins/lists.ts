var FlumeReduce = require( 'flumeview-reduce' );
var ref = require( 'ssb-ref' );

exports.name = 'collabthings-list';
exports.version = '0.0.1';
exports.manifest = {
    stream: 'source',
    get: 'async'
}

exports.init = function( ssb: any, config: any ) {
    console.log("LISTS plugin init " + ssb);
    return ssb._flumeUse( 'collabthings-list', FlumeReduce( 1, listsreduce, listsmap ) );
}

function listsreduce( result: any, item: any ) {
    //console.log( "LISTS reduce " + JSON.stringify( result ) );

    if ( !result ) result = {}
        
    if ( item ) {
        console.log( "LISTS reduce item " + JSON.stringify( item ) );
        for ( var source in item ) {
            var list:any = item[source];
            var valuesForSource = result[source] = result[source] || {}
            
            if (typeof (result[source]) == 'undefined') {
                console.log("LISTS reduce unknown source " + source);
                result[source] = {};
            }

            for(var path in list) {
                console.log("LISTS reduce path in list " + path);
                result[source][path] = list[path];
            }
            
            for(var path in result[source]) {
                var strpath:string = "" + path; 
                if(strpath.indexOf('/')!=0) {
                    console.log("LISTS reduce removing item that is not a path " + strpath);
                    result[source][path] = undefined;
                }
            }
        }
    }

    for(var source in result) {
        var strsource:string = "" + source; 
        if(strsource.indexOf('@')!=0) {
            console.log("LISTS reduce removing source " + strsource);
            result[source] = undefined;
        }
    }

    // console.log("LISTS reduce current result " + JSON.stringify(result));

    return result
}

function listsmap( msg: any ) {

    //&& ref.isLink( msg.value.content.contact )
    if ( msg.value.content && msg.value.content.type === 'collabthings-list' ) {
        console.log( "LISTS map " + JSON.stringify( msg ) );

        var source = msg.value.author;
        var values = msg.value.content.values;
        var lists: { [key: string]: { [key: string]: string } } = {};

        var path:string = values.path;
        var value:string = values.value;
        
        console.log( "LISTS map list value from " + source + " path:" + path + " " + value);
 
        lists[source] = { };
        lists[source][path] = value;
        
        return lists;
    }
}
