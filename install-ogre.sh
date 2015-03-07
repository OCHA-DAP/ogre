docker rm ogre
docker run -d -P -p 5002:3000 -v `pwd`:/src -w /src --name ogre teodorescuserban/hdx-ogre nodejs run.js
