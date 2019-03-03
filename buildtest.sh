#!/bin/bash

echo COLLABTHINGS-API BUILD

if [ ! -d node_modules ]; then
	npm install
fi

if tsc; then 
	#cp *.json dist/
	tsc
	
	export ssb_appname=ssb-test
	export HOME=$(pwd)/testenv/users/001 
	echo HOME ${HOME}
	npm run test
else
	exit 1;
fi
