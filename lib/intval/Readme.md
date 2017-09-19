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
    * [.frame(dir, time, delay)](#Intval+frame)

<a name="Intval+_declarePins"></a>

### intval._declarePins()
Intval._declarePins() - 
(internal function) Declares all Gpio pins that will be used

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_undeclarePins"></a>

### intval._undeclarePins()
Intval._undeclarePins() - 
(internal function) Undeclares all Gpio in event of uncaught error
that interupts the node process

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_startFwd"></a>

### intval._startFwd()
Intval._startFwd() - 
Start motor in forward direction by setting correct pins in h-bridge

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_startBwd"></a>

### intval._startBwd()
Intval._startBwd() - 
Start motor in backward direction by setting correct pins in h-bridge

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_stop"></a>

### intval._stop()
Intval._stop() - 
Stop motor by setting both motor pins to 0 (LOW)

**Kind**: instance method of [<code>Intval</code>](#Intval)  
<a name="Intval+_watchMicro"></a>

### intval._watchMicro(err, val)
Intval._watchMicro() - 
Callback for watching microswitch state changes
Using GPIO 06 on raspberry pi zero w

**Kind**: instance method of [<code>Intval</code>](#Intval)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | Error object present if problem reading pin |
| val | <code>integer</code> | Current value of the pin |

<a name="Intval+_watchRelease"></a>

### intval._watchRelease(err, val)
Intval._watchRelease() - 
Callback for watching relese switch state changes
Using GPIO 05 on raspberry pi zero w
* If closed, start timer.
* If opened, check timer AND
* If time closed longer than minimum and less than `this._releaseSequence`, start frame
* If time closed longer than `this._releaseSequence`, start sequence

**Kind**: instance method of [<code>Intval</code>](#Intval)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | Error object present if problem reading pin |
| val | <code>integer</code> | Current value of the pin |

<a name="Intval+frame"></a>

### intval.frame(dir, time, delay)
Intval.frame() -
Begin a single frame with set variables or defaults

**Kind**: instance method of [<code>Intval</code>](#Intval)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| dir | <code>boolean</code> | <code></code> | (optional) Direction of the frame |
| time | <code>integer</code> | <code></code> | (optional) Exposure time, 0 = minimum |
| delay | <code>delay</code> | <code></code> | (optional) Delay after frame before another can be started |

