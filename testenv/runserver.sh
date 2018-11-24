#!/bin/bash

number=$1
home=$(dirname $0)/${number}
ssbpath=$home/.ssb-test/

mkdir -p $ssbpath
cp config.template ${ssbpath}/config
sed -e "s/SSB_PORT_INDEX/${number}/g" -i ${ssbpath}/config
sed -e "s~SSB_HOME~$(pwd)/${number}~g" -i ${ssbpath}/config

netstat -naop | grep LISTEN | grep node

echo NETSTAT "netstat -naop | grep LISTEN | grep 10${number} | tr -s ' ' | cut -d' ' -f7 | cut -d'/' -f1"
ns=$(netstat -naop | grep LISTEN | grep "10${number}" | tr -s ' ' | cut -d' ' -f7 | cut -d'/' -f1)
if [ ! -z "${ns}" ]; then
	echo Killing $ns
	kill ${ns}
fi


export HOME=$home
export ssb_appname="ssb-test" 

HOME=$home sbot server &
sleep 2

sbot whoami
sbot getAddress
sbot status

if [ ! "001" = "${number}" ]; then
	sleep 1
	sbot gossip.peers
	#sbot gossip.add "localhost:9001:test"
fi

sbot messagesByType "collabthings"
#sbot

echo "HOME=$home ssb_appname=ssb-test sbot"

