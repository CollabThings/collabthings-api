#!/bin/bash

if tsc; then 
	cp *.json dist/
	
	export ssb_appname=ssb-test
	export HOME=$(pwd)/testenv/001 
	echo HOME ${HOME}
	npm run test
else
	exit 1;
fi
