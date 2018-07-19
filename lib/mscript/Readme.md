<a name="mscript"></a>

## mscript
Object representing mscript parser

**Kind**: global constant  

* [mscript](#mscript)
    * [.arg(shrt, lng)](#mscript.arg)
    * [.arg_pos(shrt, lng)](#mscript.arg_pos)

<a name="mscript.arg"></a>

### mscript.arg(shrt, lng)
Determine whether or not argument flag has been set

**Kind**: static method of [<code>mscript</code>](#mscript)  

| Param | Type | Description |
| --- | --- | --- |
| shrt | <code>string</code> | Short flag name (ie `-a`) |
| lng | <code>string</code> | Long flag name (ie `--apple`) |

<a name="mscript.arg_pos"></a>

### mscript.arg_pos(shrt, lng)
Determine position of flag, in argument array

**Kind**: static method of [<code>mscript</code>](#mscript)  

| Param | Type | Description |
| --- | --- | --- |
| shrt | <code>string</code> | Short flag name (ie `-a`) |
| lng | <code>string</code> | Long flag name (ie `--apple`) |

