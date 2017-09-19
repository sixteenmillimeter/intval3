<a name="Wifi"></a>

## Wifi
Class representing the wifi features

**Kind**: global class  

* [Wifi](#Wifi)
    * [.list(callback)](#Wifi+list)
    * [._readConfigCb(err, data)](#Wifi+_readConfigCb)
    * [._writeConfigCb(err)](#Wifi+_writeConfigCb)
    * [._reconfigureCb(err, stdout, stderr)](#Wifi+_reconfigureCb)
    * [._refreshCb(err, stdout, stderr)](#Wifi+_refreshCb)
    * [.setNetwork(ssid, pwd, callback)](#Wifi+setNetwork)
    * [.getNetwork(callback)](#Wifi+getNetwork)

<a name="Wifi+list"></a>

### wifi.list(callback)
List available wifi access points

**Kind**: instance method of [<code>Wifi</code>](#Wifi)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Function which gets invoked after list is returned |

<a name="Wifi+_readConfigCb"></a>

### wifi._readConfigCb(err, data)
(internal function) Invoked after config file is read, 
then invokes file write on the config file

**Kind**: instance method of [<code>Wifi</code>](#Wifi)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | (optional) Error object only present if problem reading config file |
| data | <code>string</code> | Contents of the config file |

<a name="Wifi+_writeConfigCb"></a>

### wifi._writeConfigCb(err)
(internal function) Invoked after config file is written, 
then executes reconfiguration command

**Kind**: instance method of [<code>Wifi</code>](#Wifi)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | (optional) Error object only present if problem writing config file |

<a name="Wifi+_reconfigureCb"></a>

### wifi._reconfigureCb(err, stdout, stderr)
(internal function) Invoked after reconfiguration command is complete

**Kind**: instance method of [<code>Wifi</code>](#Wifi)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | (optional) Error object only present if configuration command fails |
| stdout | <code>string</code> | Standard output from reconfiguration command |
| stderr | <code>string</code> | Error output from command if fails |

<a name="Wifi+_refreshCb"></a>

### wifi._refreshCb(err, stdout, stderr)
(internal function) Invoked after wifi refresh command is complete

**Kind**: instance method of [<code>Wifi</code>](#Wifi)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>object</code> | (optional) Error object only present if refresh command fails |
| stdout | <code>string</code> | Standard output from refresh command |
| stderr | <code>string</code> | Error output from command if fails |

<a name="Wifi+setNetwork"></a>

### wifi.setNetwork(ssid, pwd, callback)
Function which initializes the processes for adding a wifi access point authentication

**Kind**: instance method of [<code>Wifi</code>](#Wifi)  

| Param | Type | Description |
| --- | --- | --- |
| ssid | <code>string</code> | SSID of network to configure |
| pwd | <code>string</code> | Password of access point, plaintext |
| callback | <code>function</code> | Function invoked after process is complete, or fails |

<a name="Wifi+getNetwork"></a>

### wifi.getNetwork(callback)
Executes command which gets the currently connected network

**Kind**: instance method of [<code>Wifi</code>](#Wifi)  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Function which is invoked after command is completed |

