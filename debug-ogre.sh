docker stop ogre
docker rm ogre
docker run -i -t -P -p 5002:3000 -v `pwd`:/src -w /src --name ogre teodorescuserban/hdx-ogre nodejs node_modules/nodemon/bin/nodemon.js run.js
