# INTVAL3

### What is this?

INTVAL3 is an open source intervalometer for the Bolex 16mm camera. The goal of the project is to create a cheap-to-make intervalometer that can be used to automate time-lapse or animation on the Bolex using mobile, web or physical controls.

This is the third incarnation of the INTVAL project, this time utilizing the [Raspberry Pi Zero W](https://www.raspberrypi.org/products/raspberry-pi-zero-w/) for Wifi and Bluetooth control. Earlier versions, the [INTVAL](https://github.com/sixteenmillimeter/INTVAL) and [INTVAL2](https://github.com/sixteenmillimeter/intval2) were Arduino-based. The original INTVAL used a solenoid (!!!) to hammer a camera release cable, while the second attempt was a proving ground for the motor-and-key hardware used in this version. 

The [INTVAL2](https://github.com/sixteenmillimeter/intval2) project should be used if you prefer a simpler, physical interface approach.

### Components

* [Firmware](#firmware) for the Raspberry Pi Zero W running [Node.js](https://nodejs.org) on Raspian
* [Mobile app](#mobile) for controlling device using [Cordova](https://cordova.apache.org/) + [Bleno](https://github.com/sandeepmistry/bleno)
* [Web app](#web) for controlling device using [Restify](http://restify.com/)
* Hardware files, parts models for 3D printing, laser cutting and CNC
* PCB design for a Raspberry Pi Zero W Bonnet
* [Parts list](#parts-list)

<a name="firmware"></a>

## Firmware

The firmware of the INTVAL3 is a node.js application running on the Raspian OS intended for installation on the Raspberry Pi Zero W. 

<a name="mobile"></a>

## Mobile App

The INTVAL3 mobile app controls the intervalometer over Bluetooth. It can be used to configure the settings on the intervalometer such as exposure length, delay between frames and the direction of the film. The app can also be used to trigger individual frames, as well as start and stop sequences. As an experimental feature, film exposure settings can be determined with the camera on a mobile device.

<a name="web"></a>

## Web App

As a function of the firmware, there is an embedded web application that is hosted on the INTVAL3. When connected to a wifi network (via the mobile app) users are able to control the intervalometer from a browser. Users are also able to trigger functions and change settings on the intervalometer firmware from the command line by using cURL or wget, so actions can be scripted and automated from an external machine.

<a name="hardware"></a>

## Hardware

All of the non-electronic hardware is generated from OpenSCAD scripts and built into either STL files for 3D printing or DXF files for laser cutting or CNCing.

Electronics designs are available in the form of a Fritzing file, Gerber files, a wiring diagram and a mask image that can be used to fabricate a board from a blank PCB.

Prototype of the bare PCB of the "bonnet" for the Raspberry Pi Zero W are available for order from OSH Park. See the parts list below of components for this board.

<a href="https://oshpark.com/shared_projects/SkPyOK5S"><img src="https://oshpark.com/assets/badge-5b7ec47045b78aef6eb9d83b3bac6b1920de805e9a0c227658eac6e19a045b9c.png" alt="Order INTVAL3 Bonnet from OSH Park"></img></a>

<br />
<a name="parts-list"></a>

## PARTS

1. Raspberry Pi Zero W - [[Adafruit](https://www.adafruit.com/product/3400)] [[Sparkfun](https://www.sparkfun.com/products/14277)]
2. L298N Breakout Board - ?
3. 120RPM 12VDC Motor - ?
4. Microswitch w/ Roller - [[Adafruit](https://www.adafruit.com/product/819)]
5. L7805 5V Regulator - [[Adafruit](https://www.adafruit.com/product/2164)] [Sparkfun](https://www.sparkfun.com/products/107)]
6. 2x Thru-hole Resistors - 330 Ohm
7. 2x Thru-hole Capacitors - 100nF
9. 4x Terminal blocks

* (Optional) Proto Bonnet - [[Adafruit](https://www.adafruit.com/product/3203)]
* (Optional) INTVAL3 Bonnet - [[OSH Park](https://oshpark.com/shared_projects/SkPyOK5S)]
