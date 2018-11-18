export PATH=./node_modules/.bin:${PATH}

if [ ! -d node_modules/express ]; then npm install express; fi
if [ ! -d node_modules/sleep ]; then npm install sleep; fi
if [ ! -d node_modules/async ]; then npm install async; fi
if [ ! -d node_modules/pm2 ]; then npm install pm2; fi

pkill pm2

pm2 stop all
sleep 1
pm2 kill
sleep 1

pm2 update

pm2 -i 0 start --no-daemon -i 0 --watch . --name=my-process index.js
pm2 log
