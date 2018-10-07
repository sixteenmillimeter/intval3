<a name="client"></a>
## Client Architecture

* Raspberry Pi Zero W
* Raspberry Pi Zero (Development)
* Raspberry Pi 1 (Development)

### Ethernet over USB

From [this blog post](http://blog.gbaman.info/?p=791)

1. Flash Raspbian Jessie full or Raspbian Jessie Lite onto the SD card.
2. Once Raspbian is flashed, open up the boot partition (in Windows Explorer, Finder etc) and add to the bottom of the ```config.txt``` file ```dtoverlay=dwc2``` on a new line, then save the file.
3. If using a recent release of Jessie (Dec 2016 onwards), then create a new file simply called ```ssh``` in the SD card as well. By default SSH is now disabled so this is required to enable it. Remember - Make sure your file doesn't have an extension (like .txt etc)!
4. Finally, open up the ```cmdline.txt```. Be careful with this file, it is very picky with its formatting! Each parameter is seperated by a single space (it does not use newlines). Insert ```modules-load=dwc2,g_ether``` after ```rootwait```. To compare, an edited version of the ```cmdline.txt``` file at the time of writing, can be found here.
5. That's it, eject the SD card from your computer, put it in your Raspberry Pi Zero and connect it via USB to your computer. It will take up to 90s to boot up (shorter on subsequent boots). It should then appear as a USB Ethernet device. You can SSH into it using  raspberrypi.local as the address.

### Sharing internet from host machine (OSX)

From [learn.adafruit.com](https://learn.adafruit.com/turning-your-raspberry-pi-zero-into-a-usb-gadget?view=all)

```sudo nano /etc/network/interfaces```

Enable wlan0 by adding the following lines:

```
allow-hotplug wlan0
iface wlan0 inet manual
	wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf
```

Enable with ```sudo systemctl enable wpa_supplicant.service```.

For usb connection, add at the end:

```
allow-hotplug usb0
iface usb0 inet static
        address 192.168.7.2
        netmask 255.255.255.0
        network 192.168.7.0
        broadcast 192.168.7.255
        gateway 192.168.7.1
```

This will give the Raspberry Pi the IP Address ```192.168.7.2```. Then run the following:

```
sudo ifdown usb0
sudo ifup usb0
ifconfig usb0
```

In the OSX Network Preferences you'll see the device show up as an ```RNDIS/Ethernet Gadget```. It'll probably be set up for DHCP by default so change it to ```Configure IP4 Manually```. Use the following settings:

```
IP address: 192.168.7.1
Subnet Mask: 255.255.255.0
Router: 192.168.7.1
```

Apply changes. Next, enable internet sharing from your machine (Ethernet or Wifi) to the ```CDC``` or ```RNDIS``` Raspberry Pi.

On the Pi, change the line in ```/etc/network/interfaces``` that reads ```auto lo``` to ```auto lo usb0```. Remove or comment out the lines added to the file below ```allow-hotplug usb0``` previously and replace with ```iface usb0 inet manual```.

### Modules and guides
* [BLE and pi and mobile app](https://www.hackster.io/inmyorbit/build-a-mobile-app-that-connects-to-your-rpi-3-using-ble-7a7c2c)
* [pi and i2c](http://www.maxbotix.com/Setup-Raspberry-Pi-Zero-for-i2c-Sensor-151/)
* [gpio module](https://www.npmjs.com/package/rpi-gpio)