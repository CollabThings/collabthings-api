#!/bin/bash

cd $(dirname $0)
pwd

ps aux | grep node | grep run.js | tr -s ' ' | cut -d' ' -f2 | xargs --verbose kill; 
sleep 2

yes | rm -r users

bash runservers.sh 

