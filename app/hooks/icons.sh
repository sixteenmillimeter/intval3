#!/bin/sh
base=$1
#convert "$base" -resize '29x29'     -unsharp 1x4 "res/icon/ios/Icon-Small.png"
#convert "$base" -resize '40x40'     -unsharp 1x4 "res/icon/ios/Icon-Small-40.png"
#convert "$base" -resize '50x50'     -unsharp 1x4 "res/icon/ios/Icon-Small-50.png"
#convert "$base" -resize '57x57'     -unsharp 1x4 "res/icon/ios/Icon.png"
#convert "$base" -resize '58x58'     -unsharp 1x4 "res/icon/ios/Icon-Small@2x.png"
convert "$base" -resize '60x60'     -unsharp 1x4 "res/icon/ios/icon-60.png"
#convert "$base" -resize '72x72'     -unsharp 1x4 "res/icon/ios/Icon-72.png"
#convert "$base" -resize '76x76'     -unsharp 1x4 "res/icon/ios/Icon-76.png"
#convert "$base" -resize '80x80'     -unsharp 1x4 "res/icon/ios/Icon-Small-40@2x.png"
#convert "$base" -resize '100x100'   -unsharp 1x4 "res/icon/ios/Icon-Small-50@2x.png"
#convert "$base" -resize '114x114'   -unsharp 1x4 "res/icon/ios/Icon@2x.png"
convert "$base" -resize '120x120'   -unsharp 1x4 "res/icon/ios/icon-60@2x.png"
#convert "$base" -resize '144x144'   -unsharp 1x4 "res/icon/ios/Icon-72@2x.png"
#convert "$base" -resize '152x152'   -unsharp 1x4 "res/icon/ios/Icon-76@2x.png"
convert "$base" -resize '180x180'   -unsharp 1x4 "res/icon/ios/icon-60@3x.png"
#convert "$base" -resize '512x512'   -unsharp 1x4 "res/icon/ios/iTunesArtwork"
#convert "$base" -resize '1024x1024' -unsharp 1x4 "res/icon/ios/iTunesArtwork@2x"

#convert "$base" -resize '36x36'     -unsharp 1x4 "res/icon/android/Icon-ldpi.png"
convert "$base" -resize '48x48'     -unsharp 1x4 "res/icon/android/mdpi.png"
convert "$base" -resize '72x72'     -unsharp 1x4 "res/icon/android/hdpi.png"
convert "$base" -resize '96x96'     -unsharp 1x4 "res/icon/android/xhdpi.png"
convert "$base" -resize '144x144'   -unsharp 1x4 "res/icon/android/xxhdpi.png"
convert "$base" -resize '192x192'   -unsharp 1x4 "res/icon/android/xxxhdpi.png"

cd res/icon/ios/
find -type f -name "*.png" -exec optipng -o7 {} \;
cd ../android/
find -type f -name "*.png" -exec optipng -o7 {} \;