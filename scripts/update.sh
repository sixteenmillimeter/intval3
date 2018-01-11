#!/bin/bash

cd /home/pi/intval3

sudo -u pi -i<< EOF
	git pull
EOF

sudo pm2 restart process.json