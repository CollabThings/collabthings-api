#!/bin/bash

echo COLLABTHINGS-API BUILD

if [ ! -d node_modules ]; then
	pnpm install
fi

if tsc; then 
	bash testenv/restart.sh
	
	#cp *.json dist/
	#tsc
	
	export ssb_appname=ssb-test
	export HOME=$(pwd)/testenv/users/001 
	echo HOME ${HOME}
	pnpm run test
	
	bash testenv/stop.sh
else
	exit 1;
fi
