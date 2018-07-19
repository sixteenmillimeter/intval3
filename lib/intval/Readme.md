<a name="intval"></a>

## intval
Object representing the intval3 features

**Kind**: global constant  

* [intval](#intval)
    * [._declarePins()](#intval._declarePins)
    * [._undeclarePins()](#intval._undeclarePins)
    * [._startFwd()](#intval._startFwd)
    * [._startBwd()](#intval._startBwd)
    * [._stop()](#intval._stop)
    * [._watchMicro(err, val)](#intval._watchMicro)
    * [._watchRelease(err, val)](#intval._watchRelease)
    * [.setDir([dir])](#intval.setDir)
    * [.frame([dir], [time])](#intval.frame)
    * [.sequence()](#intval.sequence)

<a name="intval._declarePins"></a>

### intval._declarePins()
(internal function) Declares all Gpio pins that will be used

**Kind**: static method of [<code>intval</code>](#intval)  
<a name="intval._undeclarePins"></a>

### intval._undeclarePins()
(internal function) Undeclares all Gpio in event of uncaught error
that interupts the node process

**Kind**: static method of [<code>intval</code>](#intval)  
<a name="intval._startFwd"></a>

### intval._startFwd()
Start motor in forward direction by setting correct pins in h-bridge

**Kind**: static method of [<code>intval</code>](#intval)  
<a name="intval._startBwd"></a>

### intval._startBwd()
Start motor in backward direction by setting correct pins in h-bridge

**Kind**: static method of [<code>intval</code>](#intval)  
<a name="intval._stop"></a>

### intval._stop()
Stop motor by setting both motor pins to 0 (LOW)

**Kind**: static method of [<code>intval</code>](#intval)  
<a name="intval._watchMicro"></a>

### intval._watchMicro(err, val)
Callback for watching relese switch state changes.
Using GPIO 06 on Raspberry Pi Zero W.

1) If closed AND frame active, start timer, set state primed to `true`.
1) If opened AND frame active, stop frame

Microswitch + 10K ohm resistor 
* 1 === open 
* 0 === closed

**Kind**: static method of [<code>intval</code>](#intval)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | Error object present if problem reading pin |
| val | <code>integer</code> | Current value of the pin |

<a name="intval._watchRelease"></a>

### intval._watchRelease(err, val)
Callback for watching relese switch state changes.
Using GPIO 05 on Raspberry Pi Zero W.

1) If closed, start timer.
2) If opened, check timer AND
3) If `press` (`now - intval._state.release.time`) greater than minimum and less than `intval._release.seq`, start frame
4) If `press` greater than `intval._release.seq`, start sequence

Button + 10K ohm resistor 
* 1 === open 
* 0 === closed

**Kind**: static method of [<code>intval</code>](#intval)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | Error object present if problem reading pin |
| val | <code>integer</code> | Current value of the pin |

<a name="intval.setDir"></a>

### intval.setDir([dir])
Set the default direction of the camera.
* forward = true
* backward = false

**Kind**: static method of [<code>intval</code>](#intval)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [dir] | <code>boolean</code> | <code>true</code> | Direction of the camera |

<a name="intval.frame"></a>

### intval.frame([dir], [time])
Begin a single frame with set variables or defaults

**Kind**: static method of [<code>intval</code>](#intval)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [dir] | <code>boolean</code> | <code>&quot;null&quot;</code> | (optional) Direction of the frame |
| [time] | <code>integer</code> | <code>&quot;null&quot;</code> | (optional) Exposure time, 0 = minimum |

<a name="intval.sequence"></a>

### intval.sequence()
Start a sequence of frames, using defaults or explicit instructions

**Kind**: static method of [<code>intval</code>](#intval)  
