#!/bin/bash

echo "Running intval3 dependency install script"
apt-get update
apt-get install git ufw nginx jq -y

echo "Installing node.js dependencies.."
apt-get install nodejs npm -y
npm install -g n
n latest
npm install -g npm@latest
npm install -g pm2

echo "Installing bluetooth dependencies..."
apt-get install bluetooth bluez libbluetooth-dev libudev-dev -y

echo "Finished installing intval3 dependencies"