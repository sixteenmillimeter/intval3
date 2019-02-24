#!/bin/bash

echo "Running intval3 install script (this will take a while)..."
cd
sudo apt update
sudo apt install git ufw nginx jq -y

echo "Installing node.js dependencies.."
sudo apt install nodejs npm -y
sudo npm install -g n
sudo n 9.1.0
sudo npm install -g npm@latest
sudo npm install -g pm2 node-gyp node-pre-gyp

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
mkdir state
git clone https://github.com/sixteenmillimeter/intval3.git
cd intval3

echo "Configure nginx..."

sudo cp nginx.conf /etc/nginx/sites-available/intval3
sudo ln -s /etc/nginx/sites-available/intval3 /etc/nginx/sites-enabled/intval3
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t
sudo service nginx restart

echo "Install node"

sudo npm install --allow-root --unsafe-perm=true
sudo pm2 start process.json
sudo pm2 save
sudo pm2 startup

echo "Finished installing intval3"
