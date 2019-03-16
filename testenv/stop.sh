#!/bin/bash

ps aux | grep node | grep run.js | tr -s ' ' | cut -d' ' -f2 | xargs --verbose kill; 
