# INTVAL3

## Mobile App

The INTVAL3 mobile app is built using the Cordova framework for cross-platform deployment to iOS and Android.

## Requirements

* node.js
* npm
* Cordova
* XCode (for iOS) and/or
* Android Studio (for Android)


## Installation

All of the required plugins can be installed directly by executing the `install.sh` script on a system which supports bash. This script will use the `cordova` application to install the Cordova plugins. Cordova also supports the npm package.json format, so plugins may be alternately installed simply by running a `npm install` command from within the `app` directory.

## Building

Once all dependencies and plugins are installed, you can build the INTVAL3 app by running

```cordova build ios```

or

```cordova build android```

This generates the application source code in the `platforms` directory, under either the `ios` or `android` directory depending on your build target. The app can be built and run on your device by going to the project file and opening it in your IDE, either XCode or Android Studio. Alternately it can be run on your device using the `cordova run ios` or `cordova run android` commands.