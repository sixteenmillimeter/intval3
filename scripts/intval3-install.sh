#!/bin/bash

echo "Running intval3 install script"
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
systemctl disable bluetooth
hciconfig hci0 up

echo "Configuring ufw (firewall)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

echo "Installing intval3 project..."
wget https://github.com/sixteenmillimeter/intval3/archive/master.zip
unzip master.zip -d intval3/
rm master.zip

cd intval3
npm install
pm2 start process.json

echo "Finished installing intval3"