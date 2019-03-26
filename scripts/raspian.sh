#!/bin/sh
echo "Set new password"
sudo passwd
echo "Expanding filesystem to fill card"
sudo raspi-config nonint do_expand_rootfs
echo "Enabling SSH"
sudo raspi-config nonint do_ssh 1
echo "Setting GPU memory split to 16MB"
sudo raspi-config nonint do_memory_split 16
echo "Settiing hostname to 'intval3'"
sudo raspi-config nonint do_hostname intval3
echo "Rebooting in 10 seconds..."
sleep 10
sudo reboot now