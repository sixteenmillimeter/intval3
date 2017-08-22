#!/bin/bash

echo "Running blootstrap install script"
apt-get update
apt-get install git ufw nginx -y

echo "Installing node.js dependencies.."
apt-get install nodejs npm -y
npm install -g n
n latest
npm install -g npm@latest
npm install -g pm2

echo "Installing bluetooth dependencies..."
apt-get install bluetooth bluez libbluetooth-dev libudev-dev -y

echo "Configuring ufw (firewall)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

echo "Installing blootstrap project..."
mkdir /var/node
cd /var/node
wget https://github.com/mattmcw/blootstrap/archive/master.zip
unzip master.zip -d blootstrap/
rm master.zip

cd blootstrap
npm install
pm2 start process.json

echo "Finished installing blootstrap"