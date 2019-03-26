#!/bin/sh

if ! [ -d "${1}" ]; then 
	echo "No path defined"
	echo "Syntax: sh sdcard.sh /path/to/sdcard/boot/"
	exit 1
fi

CARD_PATH=${1}
START_PATH=$(pwd)
CONFIG_FILE="./config.txt"
CMD_FILE="./cmdline.txt"
TMP_FILE=$(mktemp)

echo $TMP_FILE
echo "Preparing card for raspberry pi @ $CARD_PATH"

cd $CARD_PATH
echo "Enabling ssh on first boot"
touch ssh

if ! grep "dtoverlay=dwc2" $CONFIG_FILE; then
	echo "Adding line dtoverlay=dwc2 to $CONFIG_FILE"
	echo "dtoverlay=dwc2" >> $CONFIG_FILE
else
	echo "$CONFIG_FILE already correct"
fi

if ! grep "modules-load=dwc2,g_ether" $CMD_FILE; then
	echo "Adding modiles-load=dwc2,g_ether"
	sed 's:rootwait :rootwait modules-load=dwc2,g_ether :g' $CMD_FILE >> $TMP_FILE
	mv $TMP_FILE $CMD_FILE
else
	echo "$CMD_FILE already correct"
fi

cd $START_PATH
