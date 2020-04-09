#!/bin/bash

cd $(dirname $0)
pwd

docker-compose up -d

bash runservers.sh 

