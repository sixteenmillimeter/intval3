<a name="onoffsim"></a>

## onoffsim
Object representing a fake onoff Gpio class

**Kind**: global constant  
<a name="onoffsim.Gpio"></a>

### onoffsim.Gpio(no, dir, additional) ⇒ <code>object</code>
Gpio() - 
Returns a Gpio class in the case of running on a dev machine

**Kind**: static method of [<code>onoffsim</code>](#onoffsim)  
**Returns**: <code>object</code> - Fake Gpio object  

| Param | Type | Description |
| --- | --- | --- |
| no | <code>integer</code> | Number of the GPIO pin |
| dir | <code>string</code> | Dirction of the pin, 'input' or 'output' |
| additional | <code>string</code> | Additional instructions for the GPIO pin, for 'input' type |

