#!/bin/bash

echo "Running intval3 install script"
sudo apt update
sudo apt install git ufw nginx jq -y

echo "Installing node.js dependencies.."
sudo apt install nodejs npm -y
sudo npm install -g n
sudo n 9.1.0
sudo npm install -g npm@latest
sudo npm install -g pm2 node-gyp

echo "Installing bluetooth dependencies..."
sudo apt install bluetooth bluez libbluetooth-dev libudev-dev -y
sudo systemctl disable bluetooth
sudo hciconfig hci0 up

echo "Configuring ufw (firewall)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

echo "Installing intval3 project..."
wget https://github.com/sixteenmillimeter/intval3/archive/master.zip
unzip master.zip -d intval3/
rm master.zip

cd intval3
npm install
sudo pm2 start process.json

echo "Finished installing intval3"