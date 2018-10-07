#!/bin/bash

echo "Running intval3 install script (this will take a while)..."
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
unzip master.zip
rm master.zip
mv intval3-master/ intval3/
cd intval3

echo "Configure nginx..."

cp nginx.conf /etc/nginx/sites-available/intval3
ln -s /etc/nginx/sites-available/intval3 /etc/nginx/sites-enabled/intval3
rm /etc/nginx/sites-enabled/default

echo "Install node"

npm install
sudo pm2 start process.json

echo "Finished installing intval3"