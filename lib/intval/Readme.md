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

