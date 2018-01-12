#!/bin/bash

sudo -u pi -i<< EOF
	cd /home/pi/intval3 && git pull
EOF

cd /home/pi/intval3 && sudo pm2 restart process.json