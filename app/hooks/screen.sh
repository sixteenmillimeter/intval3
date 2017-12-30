#!/bin/sh
base=$1

c="convert $1 -gravity center"

# iPhone
$c -resize 320x480  "res/screen/ios/Default~iphone.png"
$c -resize 640x960  "res/screen/ios/Default@2x~iphone.png"
$c -resize 640x1136 "res/screen/ios/Default-568h@2x~iphone.png"

$c -resize 320x426 "res/screen/android/splash-portrait-ldpi.png"
$c -resize 320x470 "res/screen/android/splash-portrait-mdpi.png"
$c -resize 480x640 "res/screen/android/splash-portrait-hdpi.png"
$c -resize 720x960 "res/screen/android/splash-portrait-xhdpi.png"