#!/bin/bash

ps aux | grep node | tr -s ' ' | cut -d' ' -f2 | xargs kill; bash runservers.sh 

