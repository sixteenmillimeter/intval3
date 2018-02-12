#!/bin/bash

sudo -u pi -i<< EOF
	cd /home/pi/intval3 && git pull && npm install
EOF