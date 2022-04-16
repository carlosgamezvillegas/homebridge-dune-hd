<span align="center">

# homebridge-dune-hd
## HomeKit integration for Dune HD

</span>

# What is this?

`homebrige-dune-hd` is a plugin for Homebridge to Control your Dune HD from your Home app. It should work with most of Dune HD boxes.


### Features
* HomeKit "TV Remote"
* HomeKit automations
* Turn TV on/off
* Play, Pause, and Stop switches
### Optional Features
* Volume control (buttons or through iOS remote app) 
* Media control
* Movie Progress control
* Navegation Control (Stateless switches)
* Input control
* The rests of the Remote buttons (Stateless switches)

# Preparation
1. Connect the Dune HD device to the internet and get the IP address

# Installation
install using the following command in terminal:
```sh
npm i homebridge-dune-hd
```

# Configuration

Add the `duneHDPlugin` platform in `config.json` in your home directory inside `.homebridge`.

Example configuration:

```js
{
  "platforms": [
    {
            "name": "Dune HD",
            "ip": "Youre IP Address", 
            "pollingInterval": 1000,
            "modelName": "Real Vision 4K",
            "manufacturer": "Dune HD",
            "serialN": "B210U71647033894",
            "volume": false,
            "mediaButtons": false,
            "movieControl": false,
            "<NameOfTheButton>": false,
            "newPlatformUUID":false,
            "platform": "duneHDPlugin"
}
]
}
```

Make sure you change the IP Address the one the devices is currently using.


### Adding the Dune HD to the Home app
Since HomeKit expects only one Dune HD per bridge they will be declared as external accessories and acts as a bridge.  
This means that a device will not appear in your Home app until you add it!

To add the Dune HD to HomeKit follow this steps:

1. Open the Home <img src="https://user-images.githubusercontent.com/3979615/78010622-4ea1d380-738e-11ea-8a17-e6a465eeec35.png" height="16.42px"> app on your device.
2. Tap the Home tab, then tap <img src="https://user-images.githubusercontent.com/3979615/78010869-9aed1380-738e-11ea-9644-9f46b3633026.png" height="16.42px">.
3. Tap *Add Accessory*, and select *I Don't Have a Code or Cannot Scan*.
4. Select the accessory you want to pair.
5. Enter the Homebridge PIN, this can be found under the QR code in Homebridge UI or your Homebridge logs, alternatively you can select *Use Camera* and scan the QR code again.

For more info check the homebridge wiki [Connecting Homebridge To HomeKit](https://github.com/homebridge/homebridge/wiki/Connecting-Homebridge-To-HomeKit).

### Configuration
#### Platform Configuration fields
- `platform` [required]
Should always be **"duneHDPlugin"**.
#### TV Configuration fields
- `name` [required]
Name of your Dune HD.
- `ip` [required]
ip address of your TV.
- `pollingInterval` [optional]
The TV state background polling interval in seconds. **Default: 10000**
- `modelName` [optional]
Model name of your device
- `manufacturer` [optional]
The manufcturer of your device
- `serialN` [optional]
Serial Number of your device
- `volume` [optional]
Enables volume control to the device as a lightbulg. **Default: false**
- `mediaButtons` [optional]
Allows control the playback state of your device. **Default: false**
- `NameOfTheButton` [optional]
Adds the button you want to add and can add as many as you want (refer to the button list bellow) **Default: false**

Button Name List is :
- cursorUpB
- cursorDownB 
- cursorLeftB
- cursorRightB
- cursorEnterB
- backButtonB
- infoB
- topMenuB
- popUpMenuB
- redB
- yellowB
- blueB
- greenB
- audioB
- subtitleB
- repeatB 
- pipB 
- selectB
- muteB
- recordB
- movieB
- musicB 
- tvB
- ejectB
- modeB
- slowB
- mouseB
  


Note: You can add  buttons in the "Navagation Buttons" and "other Buttons" in Settings using Homebridge UI
- `newPlatformUUID` [optional]
Enable this if you do not see the accessory when you try to add it to the Home App after deleting it. It will also create a different accesssory every time you chage the Name of the device in Settings. If an old accessory already exists in the Home App you will have to remove it manually. **Default: false**

## Troubleshooting
If you have any issues with the plugin or Dune HD services then you can run homebridge in debug mode, which will provide some additional information. This might be useful for debugging issues.

Homebridge debug mode:
```sh
homebridge -D
```

Deep debug log, add the following to your config.json:
```json
"deepDebugLog": true
```
This will enable additional extra log which might be helpful to debug all kind of issues. Just be aware that this will produce a lot of log information so it is recommended to use a service like https://pastebin.com/ when providing the log for inspection.

Note: Controls won't update if the plugin does not receive a confirmation message from the device

## Known Issues
Sometimes the Dune HD device will send back the wrong current status (the device will appear On in Homekit). To solvde this issue do the following using the remote control:
- Play any movie for at least 5 seconds
- Stop playback
- Go back to the main screen
- Turn off the device

## Special thanks
To Fernando for his patience and support.

If you have any suggestions/improvements please let know.

Enjoy!!
