#!/bin/bash

number=$1
contname=ssb$1

csbot () {
    echo docker-compose exec ${contname} ssb-server $*
    docker-compose exec ${contname} ssb-server $*
}

echo using contname ${contname}

export HOME=$home
export ssb_appname="ct-test" 

csbot whoami
csbot getAddress
csbot status

csbot publish --type post --text "${contname}_says_hello"
csbot feed

if [ ! "001" = "${number}" ]; then
	sleep 1
	#csbot gossip.peers
fi

csbot messagesByType "collabthings"
#sbot

#csbot status

echo runserver $contname done
