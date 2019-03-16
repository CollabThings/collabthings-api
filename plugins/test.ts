var FlumeReduce = require( 'flumeview-reduce' );
var ref = require( 'ssb-ref' );

exports.name = 'test';
exports.version = '0.0.1';
exports.manifest = {
    stream: 'source',
    get: 'async'
}

exports.init = function( ssb: any, config: any ) {
    return ssb._flumeUse( 'collabthings-test', FlumeReduce( 1, reduce, map ) );
}

function reduce( result: any, item: any ) {
    console.log("reduce " + JSON.stringify(result));
     
    if ( !result ) result = {}
    if ( item ) {
        console.log("item " + JSON.stringify(item));
        for ( var source in item ) {
            var valuesForSource = result[source] = result[source] || {}
            for ( var key in item[source] ) {
                var valuesForKey = valuesForSource[key] = valuesForSource[key] || {}
                for ( var dest in item[source][key] ) {
                    var value = item[source][key][dest]
                    if ( !valuesForKey[dest] || value[1] > valuesForKey[dest][1] ) {
                        valuesForKey[dest] = value
                    }
                }
            }
        }
    }
    return result
}

function map( msg: any ) {
    
    console.log("map " + JSON.stringify(msg));
    //&& ref.isLink( msg.value.content.contact )
    if ( msg.value.content && msg.value.content.type === 'collabthings-test'  ) {
        var source = msg.value.author
        var dest = msg.value.content.contact
        var values: { [key: string]: any } = {}

        console.log("mapping " + msg.value.content.type);
        
        values[source] = [{ date:"" + new Date() }];
        
        if ( 'following' in msg.value.content ) {
            values[source] = {
                following: {
                    [dest]: [msg.value.content.following, msg.value.timestamp]
                }
            }
            values[dest] = {
                followers: {
                    [source]: [msg.value.content.following, msg.value.timestamp]
                }
            }
        }

        return values;
    }
}

