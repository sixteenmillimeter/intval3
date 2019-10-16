#!/bin/bash

sudo -u pi -i<< EOF
	cd /home/pi/intval3 && git reset --hard && git pull && npm i
EOF