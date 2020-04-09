#!/bin/bash

cd $(dirname $0)
pwd

ckillapp() {

    contname="ssb$1"
    echo docker-compose exec ${contname} killall node
    docker-compose exec ${contname} ps aux | grep node
    docker-compose exec ${contname} killall node
}

ckillapp "001"
ckillapp "002"

docker-compose stop
