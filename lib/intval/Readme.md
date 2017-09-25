<a name="Intval"></a>

## Intval
Class representing the intval3 features

**Kind**: global class  

* [Intval](#Intval)
    * [._declarePins()](#Intval+_declarePins)
    * [._undeclarePins()](#Intval+_undeclarePins)
    * [._startFwd()](#Intval+_startFwd)
    * [._startBwd()](#Intval+_startBwd)
    * [._stop()](#Intval+_stop)
    * [._watchMicro(err, val)](#Intval+_watchMicro)
    * [._watchRelease(err, val)](#Intval+_watchRelease)
    * [.setDir([dir])](#Intval+setDir)
    * [.frame([dir], [time], [delay])](#Intval+frame)
    * [.sequence()](#Intval+sequence)

<a name="Intval+_declarePins"></a>

### intval._declarePins()
(internal function) Declares all Gpio pins that will be used

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_undeclarePins"></a>

### intval._undeclarePins()
(internal function) Undeclares all Gpio in event of uncaught error
that interupts the node process

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_startFwd"></a>

### intval._startFwd()
Start motor in forward direction by setting correct pins in h-bridge

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_startBwd"></a>

### intval._startBwd()
Start motor in backward direction by setting correct pins in h-bridge

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_stop"></a>

### intval._stop()
Stop motor by setting both motor pins to 0 (LOW)

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_watchMicro"></a>

### intval._watchMicro(err, val)
Callback for watching relese switch state changes.
Using GPIO 06 on Raspberry Pi Zero W.

1) If closed AND frame active, start timer, set state primed to `true`.
1) If opened AND frame active, stop frame

Microswitch + 10K ohm resistor 
* 1 === open 
* 0 === closed

**Kind**: instance method of [<code>Intval</code>](#Intval)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | Error object present if problem reading pin |
| val | <code>integer</code> | Current value of the pin |

<a name="Intval+_watchRelease"></a>

### intval._watchRelease(err, val)
Callback for watching relese switch state changes.
Using GPIO 05 on Raspberry Pi Zero W.

1) If closed, start timer.
2) If opened, check timer AND
3) If `press` (`NOW - this._state.release.time`) greater than minimum and less than `this._releaseSequence`, start frame
4) If `press` greater than `this._releaseSequence`, start sequence

Button + 10K ohm resistor 
* 1 === open 
* 0 === closed

**Kind**: instance method of [<code>Intval</code>](#Intval)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | Error object present if problem reading pin |
| val | <code>integer</code> | Current value of the pin |

<a name="Intval+setDir"></a>

### intval.setDir([dir])
Set the default direction of the camera.
* forward = true
* backward = false

**Kind**: instance method of [<code>Intval</code>](#Intval)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [dir] | <code>boolean</code> | <code>true</code> | Direction of the camera |

<a name="Intval+frame"></a>

### intval.frame([dir], [time], [delay])
Begin a single frame with set variables or defaults

**Kind**: instance method of [<code>Intval</code>](#Intval)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [dir] | <code>boolean</code> | <code>&quot;null&quot;</code> | (optional) Direction of the frame |
| [time] | <code>integer</code> | <code>&quot;null&quot;</code> | (optional) Exposure time, 0 = minimum |
| [delay] | <code>integer</code> | <code>&quot;null&quot;</code> | (optional) Delay after frame before another can be started |

<a name="Intval+sequence"></a>

### intval.sequence()
Start a sequence of frames, using defaults or explicit instructions

**Kind**: instance method of [<code>Intval</code>](#Intval)  
