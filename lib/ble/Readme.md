<a name="module_ble"></a>

## ble

* [ble](#module_ble)
    * [~BLE](#module_ble..BLE)
        * [new BLE()](#new_module_ble..BLE_new)
        * [.on(eventName, callback)](#module_ble..BLE+on)
    * [~os](#module_ble..os)

<a name="module_ble..BLE"></a>

### ble~BLE
Class representing the bluetooth interface

**Kind**: inner class of [<code>ble</code>](#module_ble)  

* [~BLE](#module_ble..BLE)
    * [new BLE()](#new_module_ble..BLE_new)
    * [.on(eventName, callback)](#module_ble..BLE+on)

<a name="new_module_ble..BLE_new"></a>

#### new BLE()
Establishes Bluetooth Low Energy services, accessible to process through this class

<a name="module_ble..BLE+on"></a>

#### blE.on(eventName, callback)
Binds functions to events that are triggered by BLE messages

**Kind**: instance method of [<code>BLE</code>](#module_ble..BLE)  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>string</code> | Name of the event to to bind |
| callback | <code>function</code> | Invoked when the event is triggered |

<a name="module_ble..os"></a>

### ble~os
Bluetooth Low Energy module

**Kind**: inner constant of [<code>ble</code>](#module_ble)  
