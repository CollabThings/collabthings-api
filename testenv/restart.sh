#!/bin/bash

cd $(dirname $0)
pwd

docker-compose stop
docker-compose rm -y
docker-compose up -d

bash runservers.sh 

