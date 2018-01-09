#!/bin/bash

npm install
cordova platform add ios
cordova platform add android
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-dialogs
cordova plugin add cordova-plugin-ble-central --variable BLUETOOTH_USAGE_DESCRIPTION="INTVAL intervalometer controls"
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-camera-with-exif