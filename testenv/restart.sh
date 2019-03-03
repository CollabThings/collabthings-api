#!/bin/bash

cd $(dirname $0)
pwd

ps aux | grep node | tr -s ' ' | cut -d' ' -f2 | xargs --verbose kill; 

bash runservers.sh 

