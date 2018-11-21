#!/bin/bash

if ! which sbot; then
	npm install 
fi

bash runserver.sh "001" 
bash runserver.sh "002" 

