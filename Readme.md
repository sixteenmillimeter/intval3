# INTVAL3

### What is this?

INTVAL3 is an open source intervalometer for the Bolex 16mm camera. The goal of the project is to create a cheap-to-make intervalometer that can be used to automate time-lapse or animation on the Bolex using mobile, web or physical controls.

This is the third incarnation of the INTVAL project, this time utilizing the [Raspberry Pi Zero W](https://www.raspberrypi.org/products/raspberry-pi-zero-w/) for Wifi and Bluetooth control. Earlier versions, the [INTVAL](https://github.com/sixteenmillimeter/INTVAL) and [INTVAL2](https://github.com/sixteenmillimeter/intval2) were Arduino-based. The original INTVAL used a solenoid (!!!) to hammer a camera release cable, while the second attempt was a proving ground for the motor-and-key hardware used in this version. 

The [INTVAL2](https://github.com/sixteenmillimeter/intval2) project should be used if you prefer a simpler, physical interface approach.

### Components

* Firmware for the Raspberry Pi Zero W running on [Node.js](https://nodejs.org)
* Mobile/Web/API for controlling device, using [Cordova](https://cordova.apache.org/) + [Bleno](https://github.com/sandeepmistry/bleno), and [Restify](http://restify.com/)
* Hardware files, parts models for 3D printing, laser cutting and CNC
* PCB design for a Raspberry Pi HAT
* [Parts list](#parts-list)

<a name="parts-list"></a>

## PARTS

1. Raspberry Pi Zero W - [[Amazon](http://amzn.to/2BWkKAy)] [[Adafruit](https://www.adafruit.com/product/3400)]
2. L298N Breakout Board
[[Amazon](http://amzn.to/2DwBrmz)]
3. 120RPM 12VDC Motor
[[Amazon](http://amzn.to/2CbRw4R)]