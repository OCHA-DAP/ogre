#!/bin/sh

docker build -t teodorescuserban/hdx-ogre .

docker run -P -p 5002:3000 -v `pwd`:/src -w /src --name ogre teodorescuserban/hdx-ogre npm install
docker rm ogre
