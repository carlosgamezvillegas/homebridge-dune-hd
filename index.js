"use strict";
const PLATFORM_NAME = 'duneHDPlugin';
const PLUGIN_NAME = 'homebridge-dune-hd';
const request = require('http');
const udp = require('dgram');
const { runInThisContext } = require('vm');


module.exports = (api) => {
    api.registerPlatform(PLATFORM_NAME, duneHDPlatform);
};
//// Platform/////////////////////////////////////////////////////////////////////////////////////////////////
class duneHDPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.config.name = this.config.name || 'Dune HD';
        this.config.newPlatformUUID = this.config.newPlatformUUID || false;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.log.debug('Finished initializing platform:', this.config.name);
        this.api.on('didFinishLaunching', () => {
            log.debug('didFinishLaunching callback');
            this.iniDevice();
        });
    }
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.push(accessory);
    }
    removeAccessory(accessory) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    iniDevice() {
        if (this.config.newPlatformUUID === false) {
            this.duneHDDevice =
            {
                duneHDUniqueId: 'nicocata',
                duneHDDisplayName: `${this.config.name}`
            };
        }
        if (this.config.newPlatformUUID === true) {
            this.duneHDDevice =
            {
                duneHDUniqueId: `${this.config.name}catanico`,
                duneHDDisplayName: `${this.config.name}`
            };
            this.log.debug('Generationg a new UUID');
        }
        const uuid = this.api.hap.uuid.generate(this.duneHDDevice.duneHDUniqueId);
        this.log.debug('Adding new accessory:', this.duneHDDevice.duneHDDisplayName);
        const accessory = new this.api.platformAccessory(this.duneHDDevice.duneHDDisplayName, uuid);
        accessory.category = this.api.hap.Accessory.Categories.TELEVISION;
        accessory.context.device = this.duneHDDevice;
        new duneHDAccessory(this, accessory);
        this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
    }
}
class duneHDAccessory {
    constructor(platform, accessory) {

        this.platform = platform;
        this.accessory = accessory;
        this.config = platform.config;
        this.DUNEHD_IP = this.config.ip;
        this.DUNEHD_PORT = 80;
        this.statelessTimeOut = 1000;
        this.turnOffCommand = false;
        this.turnOnCommand = false;
        //////Initial Switch and sensors state///////////////////////////////////////////////////////////////////////////////////////////////
        this.powerState = false;
        this.playBackState = [false, false, false];
        this.inputState = [false, false, false, false, false, false];
        this.powerStateTV = 0;
        this.currentVolume = 0;
        this.targetVolume = 100;
        this.currentMuteState = true;
        this.currentVolumeSwitch = false;
        this.inputID = 1;
        this.mediaState = 4;
        this.videoState = false;
        this.audioState = false;
        this.chapterTime = '';
        this.inputName = 'Media Name';
        this.mediaDuration = 'Runtime';
        this.mediaElapse = 'Elapsed Time';
        this.mediaChapter = 'Current Chapter';
        this.mediaAudioFormat = 'Audio Format';
        this.language = 'Audio Language';
        this.showState = false;
        this.httpNotResponding = 0;
        this.counter = 0;
        /////MovieConstants
        this.currentMovieProgress = 0;
        this.currentMovieProgressState = false;
        this.movieElapsed = 0;
        this.movieRemaining = 0;
        ////Connection parameters
        this.reconnectionTry = 10;
        //Device Information//////////////////////////////////////////////////////////////////////////////////////
        this.config.name = platform.config.name || 'Dune HD';
        this.config.ip = platform.config.ip;
        this.config.manufacturer = platform.config.manufacturer || 'Dune HD';
        this.config.pollingInterval = platform.config.pollingInterval || 1000;
        this.config.modelName = platform.config.modelName || 'Real Vision 4K';
        this.config.serialN = platform.config.serialN || 'B210U71647033894';
        this.config.mediaButtons = platform.config.mediaButtons || false;
        this.config.volume = platform.config.volume || false;
        this.config.cursorUpB = platform.config.cursorUpB || false;
        this.config.cursorDownB = platform.config.cursorDownB || false;
        this.config.cursorLeftB = platform.config.cursorLeftB || false;
        this.config.cursorRightB = platform.config.cursorRightB || false;
        this.config.cursorEnterB = platform.config.cursorEnterB || false;
        this.config.searchB = platform.config.searchB || false;
        this.config.backButtonB = platform.config.backButtonB || false;
        this.config.infoB = platform.config.infoB || false;
        this.config.pageUpB = platform.config.pageUpB || false;
        this.config.pageDownB = platform.config.pageDownB || false;
        this.config.popUpMenuB = platform.config.popUpMenuB || false;
        this.config.redB = platform.config.redB || false;
        this.config.yellowB = platform.config.yellowB || false;
        this.config.blueB = platform.config.blueB || false;
        this.config.audioB = platform.config.audioB || false;
        this.config.greenB = platform.config.greenB || false;
        this.config.subtitleB = platform.config.subtitleB || false;
        this.config.repeatB = platform.config.repeatB || false;
        this.config.pipB = platform.config.pipB || false;
        this.config.selectB = platform.config.selectB || false;
        this.config.movieControl = platform.config.movieControl || false;
        this.config.powerB = platform.config.powerB || false;
        this.config.muteB = platform.config.muteB || false;
        this.config.recordB = platform.config.recordB || false;
        this.config.movieB = platform.config.movieB || false;
        this.config.musicB = platform.config.musicB || false;
        this.config.tvB = platform.config.tvB || false;
        this.config.ejectB = platform.config.ejectB || false;
        this.config.modeB = platform.config.modeB || false;
        this.config.slowB = platform.config.slowB || false;
        this.config.mouseB = platform.config.mouseB || false;
        this.config.clearB = platform.config.clearB || false;
        this.config.zoomB = platform.config.zoomB || false;
        this.config.setupB = platform.config.setupB || false;
        this.config.topMenuB = platform.config.topMenuB || false;
        this.config.angleB = platform.config.angleB || false;
        this.config.recentB = platform.config.recentB || false;
        ////Checking if the necessary information was given by the user////////////////////////////////////////////////////
        try {
            if (!this.config.ip) {
                throw new Error(`Dune HD IP address is required for ${this.config.name}`);
            }
        } catch (error) {
            this.platform.log(error);
            this.platform.log('Failed to create platform device, missing mandatory information!');
            this.platform.log('Please check your device config!');
            return;
        }

        ////////////Get Model/////////////////////

        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, this.config.manufacturer)
            .setCharacteristic(this.platform.Characteristic.Model, this.config.modelName)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.config.serialN);
        // set accessory information//////////////////////////////////////////////////////////////////////////////////////////


        /////////Television Controls///////////////////////////////////////////////////////////////////////////////////////////
        // add the tv service
        this.tvService = this.accessory.getService(this.config.name) ||
            this.accessory.addService(this.platform.Service.Television, this.config.name, 'CataNicoGaTa-7');
        this.tvService.setCharacteristic(this.platform.Characteristic.ConfiguredName, this.config.name);
        this.tvService.setCharacteristic(this.platform
            .Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        this.tvService.getCharacteristic(this.platform.Characteristic.Active)
            .on('set', (newValue, callback) => {
                this.platform.log.debug('Set Dune HD Active to: ' + newValue);
                if (newValue === 1) {
                    this.newPowerState(true);
                    this.turnOnCommand = true;
                    this.turnOffCommand = false;
                    this.sending([this.pressedButton('POWER ON')]);

                    // this.WakeupOnLAN();
                    // this.sending([this.pressedButton('POWER ON')]);
                }
                else {
                    this.newPowerState(false);
                    this.turnOffAll();
                    this.sending([this.pressedButton('STOP')]);
                    this.turnOffCommand = true;
                    this.turnOnCommand = false;
                    // this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=standby&result_syntax=json"]);
                    setTimeout(() => {
                        this.sending([this.pressedButton('POWER OFF')]);
                    }, 200);
                }
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.ClosedCaptions)
            .on('get', (callback) => {
                this.platform.log.debug('Subtitle GET On');
                let currentValue = 0;
                callback(null, currentValue);
            })
            .on('set', (value, callback) => {
                this.platform.log.debug('Subtitle SET On:', value);
                if (value === 1) {
                    this.sending([this.pressedButton('SUBTITLE')]);
                }
                this.tvService.updateCharacteristic(this.platform.Characteristic.ClosedCaptions, 0);
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.RemoteKey)
            .on('set', (newValue, callback) => {
                switch (newValue) {
                    case this.platform.Characteristic.RemoteKey.REWIND: {
                        this.platform.log.debug('set Remote Key Pressed: REWIND');
                        this.sending([this.pressedButton('REWIND')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
                        this.platform.log.debug('set Remote Key Pressed: FAST_FORWARD');
                        this.sending([this.pressedButton('FORWARD')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
                        this.platform.log.debug('set Remote Key Pressed: NEXT_TRACK');
                        this.sending([this.pressedButton('NEXT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
                        this.platform.log.debug('set Remote Key Pressed: PREVIOUS_TRACK');
                        this.sending([this.pressedButton('PREVIOUS')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_UP: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_UP');
                        this.sending([this.pressedButton('CURSOR UP')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_DOWN');
                        this.sending([this.pressedButton('CURSOR DOWN')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_LEFT');
                        this.sending([this.pressedButton('CURSOR LEFT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
                        this.platform.log.debug('set Remote Key Pressed: ARROW_RIGHT');
                        this.sending([this.pressedButton('CURSOR RIGHT')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.SELECT: {
                        this.platform.log.debug('set Remote Key Pressed: SELECT');
                        this.sending([this.pressedButton('CURSOR ENTER')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.BACK: {
                        this.platform.log.debug('set Remote Key Pressed: BACK');
                        this.sending([this.pressedButton('BACK')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.EXIT: {
                        this.platform.log.debug('set Remote Key Pressed: EXIT');
                        this.sending([this.pressedButton('HOME MENU')]);
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
                        this.platform.log.debug('set Remote Key Pressed: PLAY_PAUSE');
                        this.sending([this.pressedButton('PLAY/PAUSE')]);

                        /*  if (this.playBackState[0] === false) {
                              this.sending([this.pressedButton('PLAY')]);
                          }
                          else {
                              this.sending([this.pressedButton('PAUSE')]);
                          }
                          */
                        break;
                    }
                    case this.platform.Characteristic.RemoteKey.INFORMATION: {
                        this.platform.log.debug('set Remote Key Pressed: INFORMATION');
                        this.sending([this.pressedButton('INFO')]);
                        break;
                    }
                }
                callback(null);
            });
        //////////////////////////////////TV Service//////////////////////////////////////////////////////////////////////////
        this.tvService
            .setCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.inputID);
        this.tvService
            .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
            .on('set', (inputIdentifier, callback) => {
                this.platform.log.debug('Active Identifier set to:', inputIdentifier);
                if (inputIdentifier === 999999) {
                    this.newInputState([false, false, false, false, false, false]);
                }
                if (inputIdentifier === 0) {
                    this.newInputState([false, false, false, false, false, false]);
                }
                else if (inputIdentifier === 1) {
                    this.inputID = 1;
                }
                else if (inputIdentifier === 2) {
                    this.inputID = 2;
                }
                else if (inputIdentifier === 3) {
                    this.inputID = 3;
                }
                else if (inputIdentifier === 4) {
                    this.inputID = 4;
                }
                else if (inputIdentifier === 5) {
                    this.inputID = 5;
                }
                else if (inputIdentifier === 6) {
                    this.inputID = 6;
                }
                else {
                    //
                }
                callback();
            })
            .on('get', (callback) => {
                let currentValue = this.inputID;
                this.platform.log.debug('Active Identifier set to:', currentValue);
                callback(null, currentValue);
            });
        this.tvService
            .getCharacteristic(this.platform.Characteristic.PowerModeSelection)
            .on('set', (newValue, callback) => {
                this.platform.log.debug('Requested Dune HD Settings ' + newValue);
                if (this.playBackState[0] === false && this.playBackState[1] === false && this.playBackState[2] === false) {
                    this.sending([this.pressedButton('TOP MENU')]);
                }
                else {
                    this.sending([this.pressedButton('POP-UP MENU')]);
                }
                callback();
            });
        // Input Sources///////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.videoAudioTitle = this.accessory.getService('Media Title') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Media Title', 'CataNicoGaTa-1003')
                .setCharacteristic(this.platform.Characteristic.Identifier, 1)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.APPLICATION)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
        this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.inputName;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.videoAudioTitle);
        this.runtime = this.accessory.getService('Runtime') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Runtime', 'CataNicoGaTa-1004')
                .setCharacteristic(this.platform.Characteristic.Identifier, 2)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.platform.Characteristic.CurrentVisibilityState.SHOWN);
        this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaDuration;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.runtime);
        this.videoAudioElapseTime = this.accessory.getService('Elapsed Time') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Elapsed Time', 'CataNicoGaTa-1005')
                .setCharacteristic(this.platform.Characteristic.Identifier, 3)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaElapse)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, false ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, false ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaElapse;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.videoAudioElapseTime);
        this.currentChaper = this.accessory.getService('Current Chapter') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Current Chapter', 'CataNicoGaTa-4005')
                .setCharacteristic(this.platform.Characteristic.Identifier, 4)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaChapter)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaChapter;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.currentChaper);
        this.audioFormat = this.accessory.getService('Audio Format') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Audio Format', 'CataNicoGaTa-4006')
                .setCharacteristic(this.platform.Characteristic.Identifier, 5)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.mediaAudioFormat;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.audioFormat);
        this.audioLanguage = this.accessory.getService('Audio Language') ||
            this.accessory.addService(this.platform.Service.InputSource, 'Audio Language', 'CataNicoGaTa-4007')
                .setCharacteristic(this.platform.Characteristic.Identifier, 6)
                .setCharacteristic(this.platform.Characteristic.ConfiguredName, this.language)
                .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.HDMI)
                .setCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName)
            .on('get', (callback) => {
                let currentValue = this.language;
                this.platform.log.debug('Getting' + currentValue);
                callback(null, currentValue);
            });
        this.tvService.addLinkedService(this.audioLanguage);
        /////Media State/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState)
            .on('get', (callback) => {
                let currentValue = this.mediaState;
                this.platform.log.debug('Current Playback State', currentValue);
                callback(null, currentValue);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.TargetMediaState)
            .on('get', (callback) => {
                let currentValue = this.mediaState;
                if (this.mediaState === 4) {
                    currentValue = 2;
                }
                this.platform.log.debug('Current Playback State', currentValue);
                callback(null, currentValue);
            })
            .on('set', (value, callback) => {
                if (value === 0) {
                    this.sending([this.pressedButton('PLAY')]);
                }
                else if (value === 1) {
                    this.sending([this.pressedButton('PAUSE')]);
                }
                else if (value === 2) {
                    this.sending([this.pressedButton('STOP')]);
                }
                this.platform.log.debug('Playback State set to:', value);
                callback(null);
            });
        ////////Volume services for the Dune HD/////////////////////////////////////////////////////////////////////////////////
        this.speakerService = this.accessory.getService('Dune HD Volume Control') ||
            this.accessory.addService(this.platform.Service.TelevisionSpeaker, 'Dune HD Volume Control', 'CataNicoGaTa-20');
        this.speakerService
            .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);
        this.speakerService.getCharacteristic(this.platform.Characteristic.VolumeSelector)
            .on('set', (newValue, callback) => {
                if (newValue === 1) {
                    this.sending([this.pressedButton('VOLUME DOWN')]);
                }
                if (newValue === 0) {
                    this.sending([this.pressedButton('VOLUME UP')]);
                }
                this.platform.log('Volume Value moved by: ' + newValue);
                callback(null);
            });
        this.speakerService.getCharacteristic(this.platform.Characteristic.Mute)
            .on('get', (callback) => {
                let currentValue = this.currentMuteState;
                callback(null, currentValue);
            })
            .on('set', (newValue, callback) => {
                if (newValue === true) {
                    this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state_&mute=1&result_syntax=json"]);
                    this.platform.log('Volume Value set to: Mute');
                }
                if (newValue === false) {
                    this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&mute=0&result_syntax=json"]);
                    this.platform.log('Volume Value set to: Unmute');
                }

                callback(null);
            });
        this.speakerService.addCharacteristic(this.platform.Characteristic.Volume)
            .on('get', (callback) => {
                let currentValue = this.currentVolume;
                callback(null, currentValue);
            })
            .on('set', (newValue, callback) => {
                this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&volume=" + newValue + "&mute=0&result_syntax=json"]);
                this.platform.log('Volume Value set to: ' + newValue);
                callback(null);
            });
        this.tvService.addLinkedService(this.speakerService);
        /////Volume and Video/Movie Controls/////////////////////////////////////////////////////////////////////
        if (this.config.volume === true) {
            this.volumeDimmer = this.accessory.getService('Dune HD Volume') ||
                this.accessory.addService(this.platform.Service.Lightbulb, 'Dune HD Volume', 'CataNicoGaT-98');
            this.volumeDimmer.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    let currentValue = this.currentVolumeSwitch;
                    callback(null, currentValue);
                })
                .on('set', (newValue, callback) => {
                    if (newValue === true) {
                        this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state_&mute=0&result_syntax=json"]);
                        this.platform.log('Volume Value set to: Unmute');
                    }
                    if (newValue === false) {
                        this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&mute=1&result_syntax=json"]);
                        this.platform.log('Volume Value set to: Mute');
                    }

                    callback(null);
                });

            this.volumeDimmer.addCharacteristic(new this.platform.Characteristic.Brightness())
                .on('get', (callback) => {
                    let currentValue = this.currentVolume;
                    callback(null, currentValue);
                })
                .on('set', (newValue, callback) => {
                    this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&volume=" + newValue + "&mute=0&result_syntax=json"]);
                    this.platform.log('Volume Value set to: ' + newValue);

                    callback(null);
                });
        }
        if (this.config.movieControl === true) {
            this.movieControlL = this.accessory.getService('Media Progress') ||
                this.accessory.addService(this.platform.Service.Lightbulb, 'Media Progress', 'CataNicoGaTa-301');
            this.movieControlL.setCharacteristic(this.platform.Characteristic.Name, 'Media Progress');
            this.movieControlL.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    let currentValue = this.currentMovieProgressState;
                    callback(null, currentValue);
                })
                .on('set', (newValue, callback) => {
                    this.platform.log('Movie progress state set to: ' + newValue);
                    callback(null);
                });
            this.movieControlL.addCharacteristic(new this.platform.Characteristic.Brightness())
                .on('get', (callback) => {
                    let currentValue = this.currentMovieProgress;
                    callback(null, currentValue);
                })
                .on('set', (newValue, callback) => {
                    let newSendValue = Math.round(newValue * (this.movieRemaining) / 100);
                    let totalMovieTime = this.movieRemaining;
                    if (newSendValue > totalMovieTime) {
                        newSendValue = totalMovieTime;
                    }
                    this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&position=" + newSendValue + "&result_syntax=json"]);
                    this.newMovieTime(newSendValue);
                    this.platform.log('Movie progress set to: ' + newValue + '%');
                    callback(null);
                });
        }
        /////////////Addtional Services////////////////////////////////////////////////////////////////////////////////////
        if (this.config.powerB === true) {
            this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
            this.service.setCharacteristic(this.platform.Characteristic.Name, `${accessory.context.device.duneHDDisplayName} Power Switch`);
            this.service.updateCharacteristic(this.platform.Characteristic.Name, `${accessory.context.device.duneHDDisplayName} Power Switch`);
            this.service.getCharacteristic(this.platform.Characteristic.On)
                .on('set', this.setOn.bind(this))
                .on('get', this.getOn.bind(this));
        };
        this.play = this.accessory.getService('Play') ||
            this.accessory.addService(this.platform.Service.Switch, 'Play', 'CataNicoGaTa-10');
        this.play.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.playSwitchStateGet.bind(this))
            .on('set', this.playSwitchStateSet.bind(this));
        this.pause = this.accessory.getService('Pause') ||
            this.accessory.addService(this.platform.Service.Switch, 'Pause', 'CataNicoGaTa-11');
        this.pause.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.pauseSwitchStateGet.bind(this))
            .on('set', this.pauseSwitchStateSet.bind(this));
        this.stop = this.accessory.getService('Stop') ||
            this.accessory.addService(this.platform.Service.Switch, 'Stop', 'CataNicoGaTa-12');
        this.stop.getCharacteristic(this.platform.Characteristic.On)
            .on('get', this.stopSwitchStateGet.bind(this))
            .on('set', this.stopSwitchStateSet.bind(this));
        ///////////////////////////////////Input buttons//////////////////////////////////////////////////////////////////////////

        ////other Controls /////////////////////////////////////////////////////////
        if (this.config.cursorUpB === true) {
            this.cursorUp = this.accessory.getService('Cursor Up') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Up', 'CataNicoGaTa-31');
            this.cursorUp.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Up GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Up SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR UP')]);
                    }
                    setTimeout(() => {
                        this.cursorUp.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorDownB === true) {
            this.cursorDown = this.accessory.getService('Cursor Down') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Down', 'CataNicoGaTa-32');
            this.cursorDown.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Down GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Down SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR DOWN')]);
                    }
                    setTimeout(() => {
                        this.cursorDown.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorLeftB === true) {
            this.cursorLeft = this.accessory.getService('Cursor Left') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Left', 'CataNicoGaTa-33');
            this.cursorLeft.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Left GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Left SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR LEFT')]);
                    }
                    setTimeout(() => {
                        this.cursorLeft.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorRightB === true) {
            this.cursorRight = this.accessory.getService('Cursor Right') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Right', 'CataNicoGaTa-34');
            this.cursorRight.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Right GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Right SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR RIGHT')]);
                    }
                    setTimeout(() => {
                        this.cursorRight.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.cursorEnterB === true) {
            this.cursorEnter = this.accessory.getService('Cursor Enter') ||
                this.accessory.addService(this.platform.Service.Switch, 'Cursor Enter', 'CataNicoGaTa-35');
            this.cursorEnter.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Cursor Enter GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Cursor Enter SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CURSOR ENTER')]);
                    }
                    setTimeout(() => {
                        this.cursorEnter.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.searchB === true) {
            this.searchB = this.accessory.getService('Search') ||
                this.accessory.addService(this.platform.Service.Switch, 'Search', 'CataNicoGaTa-36');
            this.searchB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Search GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Search SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('SEARCH')]);
                    }
                    setTimeout(() => {
                        this.searchB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.backButtonB === true) {
            this.backButton = this.accessory.getService('Back') ||
                this.accessory.addService(this.platform.Service.Switch, 'Back', 'CataNicoGaTa-37');
            this.backButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Back GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Back SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('BACK')]);
                    }
                    setTimeout(() => {
                        this.backButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.infoB === true) {
            this.infoButton = this.accessory.getService('Info') ||
                this.accessory.addService(this.platform.Service.Switch, 'Info', 'CataNicoGaTa-44');
            this.infoButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Info GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Info SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('INFO')]);
                    }
                    setTimeout(() => {
                        this.infoButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.pageUpB === true) {
            this.pageUp = this.accessory.getService('Page Up') ||
                this.accessory.addService(this.platform.Service.Switch, 'Page Up', 'CataNicoGaTa-50');
            this.pageUp.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Page Up GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Page Up SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PAGE UP')]);
                    }
                    setTimeout(() => {
                        this.pageUp.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.pageDownB === true) {
            this.pageDown = this.accessory.getService('Page Down') ||
                this.accessory.addService(this.platform.Service.Switch, 'Page Down', 'CataNicoGaTa-51');
            this.pageDown.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Page Down GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Page Down SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PAGE DOWN')]);
                    }
                    setTimeout(() => {
                        this.pageDown.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.popUpMenuB === true) {
            this.popUpMenu = this.accessory.getService('Pop-Up Menu') ||
                this.accessory.addService(this.platform.Service.Switch, 'Pop-Up Menu', 'CataNicoGaTa-52');
            this.popUpMenu.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Pop-Up Menu GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Pop-Up Menu SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('POP-UP MENU')]);
                    }
                    setTimeout(() => {
                        this.popUpMenu.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        //////Additional Media Buttons/////////////////////////////////////////////////
        if (this.config.mediaButtons === true) {
            this.previous = this.accessory.getService('Previous') ||
                this.accessory.addService(this.platform.Service.Switch, 'Previous', 'CataNicoGaTa-38');
            this.previous.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Previous GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Previous SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PREVIOUS')]);
                    }
                    setTimeout(() => {
                        this.previous.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
            this.next = this.accessory.getService('Next') ||
                this.accessory.addService(this.platform.Service.Switch, 'Next', 'CataNicoGaTa-39');
            this.next.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Next GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Next SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('NEXT')]);
                    }
                    setTimeout(() => {
                        this.next.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
            this.rewindButton = this.accessory.getService('Rewind') ||
                this.accessory.addService(this.platform.Service.Switch, 'Rewind', 'CataNicoGaTa-46');
            this.rewindButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Rewind GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Rewind SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('REWIND')]);
                    }
                    setTimeout(() => {
                        this.rewindButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
            this.forwardButton = this.accessory.getService('Forward') ||
                this.accessory.addService(this.platform.Service.Switch, 'Forward', 'CataNicoGaTa-80');
            this.forwardButton.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Forward GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Forward SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('FORWARD')]);
                    }
                    setTimeout(() => {
                        this.forwardButton.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        /////The rest of the buttons///////////////////////////////////////////////////////////////////
        if (this.config.redB === true) {
            this.red = this.accessory.getService('Red') ||
                this.accessory.addService(this.platform.Service.Switch, 'Red', 'CataNicoGaTa-53');
            this.red.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Red GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Red SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('RED')]);
                    }
                    setTimeout(() => {
                        this.red.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.greenB === true) {
            this.green = this.accessory.getService('Green') ||
                this.accessory.addService(this.platform.Service.Switch, 'Green', 'CataNicoGaTa-54');
            this.green.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Green GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Green SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('GREEN')]);
                    }
                    setTimeout(() => {
                        this.green.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.blueB === true) {
            this.blue = this.accessory.getService('Blue') ||
                this.accessory.addService(this.platform.Service.Switch, 'Blue', 'CataNicoGaTa-55');
            this.blue.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Blue GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Blue SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('BLUE')]);
                    }
                    setTimeout(() => {
                        this.blue.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.yellowB === true) {
            this.yellow = this.accessory.getService('Yellow') ||
                this.accessory.addService(this.platform.Service.Switch, 'Yellow', 'CataNicoGaTa-56');
            this.yellow.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Yellow GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Yellow SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('YELLOW')]);
                    }
                    setTimeout(() => {
                        this.yellow.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.audioB === true) {
            this.audio = this.accessory.getService('Audio') ||
                this.accessory.addService(this.platform.Service.Switch, 'Audio', 'CataNicoGaTa-57');
            this.audio.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Audio GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Audio SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('AUDIO')]);
                    }
                    setTimeout(() => {
                        this.audio.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.subtitleB === true) {
            this.subtitle = this.accessory.getService('Subtitle') ||
                this.accessory.addService(this.platform.Service.Switch, 'Subtitle', 'CataNicoGaTa-58');
            this.subtitle.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Subtitle GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Subtitle SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('SUBTITLE')]);
                    }
                    setTimeout(() => {
                        this.subtitle.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.repeatB === true) {
            this.repeat = this.accessory.getService('Repeat') ||
                this.accessory.addService(this.platform.Service.Switch, 'Repeat', 'CataNicoGaTa-63');
            this.repeat.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Repeat GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Repeat SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('REPEAT')]);
                    }
                    setTimeout(() => {
                        this.repeat.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.pipB === true) {

            this.pip = this.accessory.getService('Shuffle-PIP') ||
                this.accessory.addService(this.platform.Service.Switch, 'Shuffle-PIP', 'CataNicoGaTa-64');
            this.pip.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Shuffle-PIP GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Shuffle-PIP SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('PIP')]);
                    }
                    setTimeout(() => {
                        this.pip.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.selectB === true) {
            this.selectB = this.accessory.getService('Select') ||
                this.accessory.addService(this.platform.Service.Switch, 'Select', 'CataNicoGaTa-65');
            this.selectB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Select GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Select SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('SELECT')]);
                    }
                    setTimeout(() => {
                        this.selectB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }

        if (this.config.muteB === true) {
            this.mute = this.accessory.getService('Mute') ||
                this.accessory.addService(this.platform.Service.Switch, 'Mute', 'CataNicoGaTa-9001');
            this.mute.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Mute GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Mute SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MUTE')]);
                    }
                    setTimeout(() => {
                        this.mute.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.recordB === true) {
            this.record = this.accessory.getService('Record') ||
                this.accessory.addService(this.platform.Service.Switch, 'Record', 'CataNicoGaTa-9002');
            this.record.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Record GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Record SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('RECORD')]);
                    }
                    setTimeout(() => {
                        this.record.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.movieB === true) {
            this.movie = this.accessory.getService('Movie') ||
                this.accessory.addService(this.platform.Service.Switch, 'Movie', 'CataNicoGaTa-9003');
            this.movie.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Movie GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Movie SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MOVIE')]);
                    }
                    setTimeout(() => {
                        this.movie.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.musicB === true) {
            this.music = this.accessory.getService('Music') ||
                this.accessory.addService(this.platform.Service.Switch, 'Music', 'CataNicoGaTa-9004');
            this.music.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Music GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Music SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MUSIC')]);
                    }
                    setTimeout(() => {
                        this.music.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.tvB === true) {
            this.tvB = this.accessory.getService('TV') ||
                this.accessory.addService(this.platform.Service.Switch, 'TV', 'CataNicoGaTa-9005');
            this.tvB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('TV GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('TV SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('TV')]);
                    }
                    setTimeout(() => {
                        this.tvB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.ejectB === true) {
            this.ejectB = this.accessory.getService('Eject') ||
                this.accessory.addService(this.platform.Service.Switch, 'Eject', 'CataNicoGaTa-9006');
            this.ejectB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Eject GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Eject SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('EJECT')]);
                    }
                    setTimeout(() => {
                        this.ejectB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.modeB === true) {
            this.modeB = this.accessory.getService('Mode') ||
                this.accessory.addService(this.platform.Service.Switch, 'Mode', 'CataNicoGaTa-9007');
            this.modeB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Mode GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Mode SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('LIGHT')]);
                    }
                    setTimeout(() => {
                        this.modeB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.slowB === true) {
            this.slowB = this.accessory.getService('Slow') ||
                this.accessory.addService(this.platform.Service.Switch, 'Slow', 'CataNicoGaTa-9008');
            this.slowB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Slow GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Slow SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('SLOW')]);
                    }
                    setTimeout(() => {
                        this.slowB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.mouseB === true) {
            this.mouseB = this.accessory.getService('Mouse') ||
                this.accessory.addService(this.platform.Service.Switch, 'Mouse', 'CataNicoGaTa-9009');
            this.mouseB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Mouse GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Mouse SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('MOUSE')]);
                    }
                    setTimeout(() => {
                        this.mouseB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.clearB === true) {
            this.clear = this.accessory.getService('Clear') ||
                this.accessory.addService(this.platform.Service.Switch, 'Clear', 'CataNicoGaTa-40');
            this.clear.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Clear GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Clear SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('CLEAR')]);
                    }
                    setTimeout(() => {
                        this.clear.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.zoomB === true) {
            this.zoom = this.accessory.getService('Zoom') ||
                this.accessory.addService(this.platform.Service.Switch, 'Zoom', 'CataNicoGaTa-60');
            this.zoom.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Zoom GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Zoom SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('ZOOM')]);
                    }
                    setTimeout(() => {
                        this.zoom.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.setupB === true) {
            this.setup = this.accessory.getService('Setup') ||
                this.accessory.addService(this.platform.Service.Switch, 'Setup', 'CataNicoGaTa-45');
            this.setup.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Setup GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Setup SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('SETUP')]);
                    }
                    setTimeout(() => {
                        this.setup.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.topMenuB === true) {
            this.topMenu = this.accessory.getService('Top Menu') ||
                this.accessory.addService(this.platform.Service.Switch, 'Top Menu', 'CataNicoGaTa-41');
            this.topMenu.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Top Menu GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Top Menu SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('TOP MENU')]);
                    }
                    setTimeout(() => {
                        this.topMenu.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.angleB === true) {
            this.angle = this.accessory.getService('Angle') ||
                this.accessory.addService(this.platform.Service.Switch, 'Angle', 'CataNicoGaTa-59');
            this.angle.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Angle GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Angle SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('ANGLE')]);
                    }
                    setTimeout(() => {
                        this.angle.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        if (this.config.recentB === true) {
            this.recentB = this.accessory.getService('Recent') ||
                this.accessory.addService(this.platform.Service.Switch, 'Recent', 'CataNicoGaTa-X09');
            this.recentB.getCharacteristic(this.platform.Characteristic.On)
                .on('get', (callback) => {
                    this.platform.log.debug('Recent GET On');
                    let currentValue = false;
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    this.platform.log.debug('Recet SET On:', value);
                    if (value === true) {
                        this.sending([this.pressedButton('RECENT')]);
                    }
                    setTimeout(() => {
                        this.recentB.updateCharacteristic(this.platform.Characteristic.On, false);
                    }, this.statelessTimeOut);
                    callback(null);
                });
        }
        ///////////////Clean up. Delete services not in used////////////////////////////////

        if (this.config.powerB === false) {
            this.accessory.removeService(this.service);
        }
        if (this.config.movieControl === false) {
            this.accessory.removeService(this.movieControlL);
        }
        if (this.config.cursorUpB === false) {
            this.accessory.removeService(this.cursorUp);
        }
        if (this.config.cursorLeftB === false) {
            this.accessory.removeService(this.cursorLeft);
        }
        if (this.config.cursorDownB === false) {
            this.accessory.removeService(this.cursorDown);
        }
        if (this.config.cursorRightB === false) {

            this.accessory.removeService(this.cursorRight);
        }
        if (this.config.cursorEnterB === false) {

            this.accessory.removeService(this.cursorEnter);
        }
        if (this.config.searchB === false) {
            this.accessory.removeService(this.searchB);
        }
        if (this.config.backButtonB === false) {
            this.accessory.removeService(this.backButton);
        }
        if (this.config.infoB === false) {
            this.accessory.removeService(this.infoButton);
        }
        if (this.config.goToB === false) {
            this.accessory.removeService(this.goTo);
        }
        if (this.config.pageDownB === false) {
            this.accessory.removeService(this.pageDown);
        }
        if (this.config.pageUpB === false) {
            this.accessory.removeService(this.pageUp);
        }
        if (this.config.popUpMenuB === false) {
            this.accessory.removeService(this.popUpMenu);
        }
        if (this.config.mediaButtons === false) {
            this.accessory.removeService(this.previous);
            this.accessory.removeService(this.next);
            this.accessory.removeService(this.rewindButton);
            this.accessory.removeService(this.forwardButton);
        }
        if (this.config.redB === false) {
            this.accessory.removeService(this.red);
        }
        if (this.config.blueB === false) {
            this.accessory.removeService(this.blue);
        }
        if (this.config.yellowB === false) {
            this.accessory.removeService(this.yellow);
        }
        if (this.config.greenB === false) {
            this.accessory.removeService(this.green);
        }
        if (this.config.audioB === false) {
            this.accessory.removeService(this.audio);
        }
        if (this.config.subtitleB === false) {
            this.accessory.removeService(this.subtitle);
        }
        if (this.config.repeatB === false) {
            this.accessory.removeService(this.repeat);
        }
        if (this.config.pipB === false) {
            this.accessory.removeService(this.pip);
        }
        if (this.config.selectB === false) {
            this.accessory.removeService(this.selectB);
        }
        if (this.config.muteB === false) {
            this.accessory.removeService(this.mute);
        }
        if (this.config.recordB === false) {
            this.accessory.removeService(this.record);
        }
        if (this.config.movieB === false) {
            this.accessory.removeService(this.movie);
        }
        if (this.config.musicB === false) {
            this.accessory.removeService(this.music);
        }
        if (this.config.tvB === false) {
            this.accessory.removeService(this.tvB);
        }
        if (this.config.ejectB === false) {
            this.accessory.removeService(this.ejectB);
        }
        if (this.config.modeB === false) {
            this.accessory.removeService(this.modeB);
        }
        if (this.config.slowB === false) {
            this.accessory.removeService(this.slowB);
        }
        if (this.config.mouseB === false) {
            this.accessory.removeService(this.mouseB);
        }
        if (this.config.clearB === false) {
            this.accessory.removeService(this.clear);
        }
        if (this.config.zoomB === false) {
            this.accessory.removeService(this.zoom);
        }
        if (this.config.setupB === false) {
            this.accessory.removeService(this.setup);
        }
        if (this.config.topMenuB === false) {
            this.accessory.removeService(this.topMenu);
        }
        if (this.config.angleB === false) {
            this.accessory.removeService(this.angle);
        }
        if (this.config.recentB === false) {
            this.accessory.removeService(this.recentB);
        }
        if (this.config.volume === false) {
            this.accessory.removeService(this.volumeDimmer);
        }

        //////////////////Connecting to Dune HD
        // this.udpServer();
        //syncing////////////////////////////////////////////////////////////////////////////////////////
        setInterval(() => {
            if (this.turnOffCommand === false && this.turnOnCommand === false) {
                this.sending([this.query('GET DEVICE INFO')]);
                if (this.httpNotResponding >= this.reconnectionTry) {
                    this.turnOffAll();
                }
                /*
                                this.platform.log('Updating');
                                this.platform.log(this.tvService.getCharacteristic(this.platform.Characteristic.Active).value);
                                this.platform.log(this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.inputName);
                                this.platform.log(this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.mediaDuration);
                                this.platform.log(this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.mediaChapter);
                                this.platform.log(this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.mediaAudioFormat);
                                this.platform.log(this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
                                this.platform.log(this.language);
                                this.platform.log(this.pause.getCharacteristic(this.platform.Characteristic.On).value);
                                this.platform.log(this.playBackState);
                */
                if (this.tvService.getCharacteristic(this.platform.Characteristic.Active).value !== this.powerStateTV) {
                    this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
                }
                if (this.play.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[0]) {
                    this.play.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[0]);
                }
                if (this.pause.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[1]) {
                    this.pause.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[1]);
                }
                if (this.stop.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[2]) {
                    this.stop.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[2]);
                }
                if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.inputName) {
                    this.platform.log.debug('Updating Title');
                    this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
                    this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
                }
                if (this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaDuration) {
                    this.platform.log.debug('Updating Runtime');
                    this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration);
                    this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaDuration);
                }
                if (this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaChapter) {
                    this.platform.log.debug('Updating Current Chapter');
                    this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaChapter);
                    this.currentChaper.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaChapter);
                }
                if (this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaAudioFormat) {
                    this.platform.log.debug('Updating Audio Format');
                    this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaAudioFormat);
                    this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                }
                if (this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.language) {
                    this.platform.log.debug('Updating Language');
                    this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.language);
                    this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
                }

                //this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaElapse);
                //this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaElapse);
            }
            else {
                setTimeout(() => {
                    this.turnOffCommand = false;
                    this.turnOnCommand = false;
                }, 3000);
            }
        }, this.config.pollingInterval);
    }

    ///////////////Wake up/////
    /////

    ///////Handlers////////////////////////////////////////////////////////////////////////////////////////
    setOn(value, callback) {
        let duneHDState = value;
        if (duneHDState === true) {
            this.newPowerState(true);
            this.turnOnCommand = true;
            this.turnOffCommand = false;
            this.sending([this.pressedButton('POWER ON')]);
        }
        else {
            this.turnOffAll();
            this.newPowerState(false);
            this.turnOffCommand = true;
            this.turnOnCommand = false;
            this.sending([this.pressedButton('STOP')]);
            setTimeout(() => {
                this.sending([this.pressedButton('POWER OFF')]);
            }, 200);
            //this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=standby&result_syntax=json"]);
            //this.sending([this.pressedButton('POWER OFF')]);
        }
        this.platform.log.debug('Set Power to ->', value);
        callback(null);
    }
    getOn(callback) {
        let isOn = this.powerState;
        this.platform.log.debug('Get Power ->', isOn);
        callback(null, isOn);
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////Play
    playSwitchStateGet(callback) {
        this.platform.log.debug('Play State');
        let currentValue = this.playBackState[0];
        callback(null, currentValue);
    }
    playSwitchStateSet(value, callback) {
        this.platform.log.debug('Play set to:', value);
        if (value === true) {
            this.sending([this.pressedButton('PLAY')]);
        }
        callback(null);
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////Pause
    pauseSwitchStateGet(callback) {
        this.platform.log.debug('Pause State');
        let currentValue = this.playBackState[1];
        callback(null, currentValue);
    }
    pauseSwitchStateSet(value, callback) {
        this.platform.log.debug('Pause set to', value);
        if (value === true) {
            this.sending([this.pressedButton('PAUSE')]);
        }
        callback(null);
    }
    /////////////////////////////////////////////////////////////////////////////////////stop
    stopSwitchStateGet(callback) {
        this.platform.log.debug('Stop State');
        let currentValue = this.playBackState[2];
        callback(null, currentValue);
    }
    stopSwitchStateSet(value, callback) {
        this.platform.log.debug('Stop set to:', value);
        if (value === true) {
            this.mediaDetailsReset();
            this.sending([this.pressedButton('STOP')]);
        }
        callback(null);
    }
    /////////////////Command Log
    commandLog(commandPress) {
        if (commandPress.includes('getDeviceInfo')) {
            this.platform.log.debug(`Sending: ${this.commandName(commandPress)} Command`);
        }
        else {
            this.platform.log(`Sending: ${this.commandName(commandPress)} Command`);
        }
    }

    ///////Send HTTP command///////////////////////////
    sending(url) {
        this.platform.log.debug(url);
        url = url[0];
        let key;
        if (url.includes('cgi-bin/do?cmd=status')) {
            key = 'getDeviceInfo';
        }
        else if (url.includes('cgi-bin/do?cmd=standby')) {
            key = 'Standby';
        }
        else if (url.includes('position')) {
            key = 'position';
        }
        else {
            let key1 = url.split('=');
            key = key1[2];
        }
        this.platform.log.debug(url);
        this.platform.log.debug(key);
        this.httpNotResponding += 1;
        request.get(url, (res) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    let parsedData = JSON.parse(rawData);
                    this.httpNotResponding = 0;
                    this.httpEventDecoder(parsedData, key);
                } catch (e) {
                    //console.error(e.message);
                }
            });
        }).on('error', (e) => {
            // console.error(`Got error: ${e.message}`);
        });
    }

    //////////Current Status//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    newVolumeStatus(newVolumeNum) {
        if (this.turnOffCommand !== true || newVolumeNum === 0) {

            if (this.currentVolume !== newVolumeNum) {
                this.currentVolume = newVolumeNum;
                if (newVolumeNum === 0) {
                    this.currentMuteState = true;
                    this.currentVolumeSwitch = false;
                }
                if (newVolumeNum !== 0) {
                    this.currentMuteState = false;
                    this.currentVolumeSwitch = true;
                }
                this.speakerService.updateCharacteristic(this.platform.Characteristic.Volume, this.currentVolume);
                this.speakerService.updateCharacteristic(this.platform.Characteristic.Mute, this.currentMuteState);
                this.speakerService.getCharacteristic(this.platform.Characteristic.Volume).updateValue(this.currentVolume);
                this.speakerService.getCharacteristic(this.platform.Characteristic.Mute).updateValue(this.currentMuteState)
                if (this.config.volume === true) {
                    this.volumeDimmer.updateCharacteristic(this.platform.Characteristic.Brightness, this.currentVolume);
                    this.volumeDimmer.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(this.currentVolume);
                    this.volumeDimmer.updateCharacteristic(this.platform.Characteristic.On, this.currentVolumeSwitch);
                    this.volumeDimmer.getCharacteristic(this.platform.Characteristic.On).updateValue(this.currentVolumeSwitch);
                }
            }
        }
    }

    newAudioStatus(audio) {
        this.platform.log.debug(audio);
        let newAduio = '';
        if (audio.includes('Digital Plus')) {
            newAduio = 'Dolby Digital Plus';
        }
        else if (audio.includes('Dolby Digital')) {
            newAduio = 'Dolby Digital';
        }
        else if (audio.includes('TrueHD')) {
            newAduio = 'Dolby TrueHD - Atmos';
        }
        else if (audio.includes('DTS-HD High') || audio.includes('DTS HD High')) {
            newAduio = 'DTS-HD High Resolution';
        }
        else if (audio.includes('DTS HD Master') || audio.includes('DTS HD MA')) {
            newAduio = 'DTS HD MA - DTS X';
        }
        else if (audio.includes('DTS')) {
            newAduio = 'DTS';
        }
        else if (audio.includes('LPCM')) {
            newAduio = 'LPCM';
        }
        else if (audio.includes('MPEG')) {
            newAduio = 'MPEG Audio';

        }
        else if (audio.includes('CD Audio')) {
            newAduio = 'CD Audio';

        }
        else {
            newAduio = audio;

        }
        this.newAudioFormat(newAduio);
    }

    newInputName(newName) {
        if (typeof newName !== 'undefined') {
            if (newName.length >= 64) {
                newName = newName.slice(0, 60) + "...";
            }
            this.platform.log.debug('New input name: ' + newName);
            if (this.inputName !== newName) {
                this.inputName = newName;
                this.platform.log.debug(this.inputName);
                this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
                this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
            }
        }

    }
    newInputDuration(newDuration) {
        if (typeof newDuration !== 'undefined') {
            this.platform.log.debug('New input duraiton: ' + newDuration);
            if (this.mediaDuration !== newDuration) {
                this.mediaDuration = newDuration;
                this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration);
                this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaDuration);
            }
        }

    }
    newCurrentChapter(currentChapter) {
        if (typeof currentChapter !== 'undefined') {
            if (currentChapter.length >= 64) {
                currentChapter = currentChapter.slice(0, 60) + "...";
            }
            this.platform.log.debug('New input progress: ' + currentChapter);
            if (this.mediaChapter !== currentChapter) {
                this.mediaChapter = currentChapter;
                this.currentChaper.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaChapter);
                this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaChapter);
                this.currentChaper.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.currentChaper.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    newElapsedTime(elapsedTime) {
        /*
        if(typeof elapsedTime !=='undefined'){
        this.platform.log.debug(elapsedTime);
        if (this.mediaElapse !== elapsedTime) {
            this.mediaElapse = elapsedTime;
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaElapse);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
            this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
        }
    }
        */
    }
    newAudioFormat(audioType) {
        if (typeof audioType !== 'undefined') {
            this.platform.log.debug(audioType);
            this.platform.log.debug('New audio format: ' + audioType);
            if (this.mediaAudioFormat !== audioType) {
                this.mediaAudioFormat = audioType;
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaAudioFormat);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }
    newLanguageSelector(langSelector) {
        let correctLanguage = ''
        if (langSelector.includes('eng')) {
            correctLanguage = 'English';
        }
        else if (langSelector.includes('ara')) {
            correctLanguage = 'Arabic';
        }
        else if (langSelector.includes('cat')) {
            correctLanguage = 'Catalan';
        }
        else if (langSelector.includes('chi')) {
            correctLanguage = 'Chinese';
        }
        else if (langSelector.includes('ces') || langSelector.includes('cze')) {
            correctLanguage = 'Czech';
        }
        else if (langSelector.includes('dan')) {
            correctLanguage = 'Danish';
        }
        else if (langSelector.includes('deu') || langSelector.includes('gmh') || langSelector.includes('goh')) {
            correctLanguage = 'German';
        }
        else if (langSelector.includes('dum') || langSelector.includes('dut')) {
            correctLanguage = 'Dutch';
        }
        else if (langSelector.includes('egy')) {
            correctLanguage = 'Egyptina';
        }
        else if (langSelector.includes('ell') || langSelector.includes('grc') || langSelector.includes('gre')) {
            correctLanguage = 'Greek';
        }
        else if (langSelector.includes('fin')) {
            correctLanguage = 'Finnish';
        }
        else if (langSelector.includes('fra') || langSelector.includes('fre') || langSelector.includes('frm') || langSelector.includes('fro')) {
            correctLanguage = 'French';
        }
        else if (langSelector.includes('heb')) {
            correctLanguage = 'Hebrew';
        }
        else if (langSelector.includes('hin')) {
            correctLanguage = 'Hindi';
        }
        else if (langSelector.includes('hrv')) {
            correctLanguage = 'Croatina';
        }
        else if (langSelector.includes('hun')) {
            correctLanguage = 'Hungarian';
        }
        else if (langSelector.includes('ice') || langSelector.includes('isl')) {
            correctLanguage = 'Icelandic';
        }
        else if (langSelector.includes('ita')) {
            correctLanguage = 'Italian';
        }
        else if (langSelector.includes('jpn')) {
            correctLanguage = 'Japanese';
        }
        else if (langSelector.includes('kor')) {
            correctLanguage = 'Korian';
        }
        else if (langSelector.includes('peo') || langSelector.includes('per')) {
            correctLanguage = 'Perian';
        }
        else if (langSelector.includes('pol')) {
            correctLanguage = 'Polish';
        }
        else if (langSelector.includes('por')) {
            correctLanguage = 'Portuguese';
        }
        else if (langSelector.includes('rus')) {
            correctLanguage = 'Russian';
        }
        else if (langSelector.includes('ron') || langSelector.includes('run')) {
            correctLanguage = 'Romanian';
        }
        else if (langSelector.includes('spa')) {
            correctLanguage = 'Spanish';
        }
        else if (langSelector.includes('tur')) {
            correctLanguage = 'Turkish';
        }
        else if (langSelector.includes('und')) {
            correctLanguage = 'Language Undefined';
        }
        else {
            correctLanguage = langSelector
        }
        this.newLanguage(correctLanguage);
    }
    newLanguage(lang) {
        if (typeof lang !== 'undefined') {
            this.platform.log.debug('New audio language: ' + lang);
            if (this.language !== lang) {
                this.language = lang;
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN)
                this.audioLanguage.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }

    newMovieTime(newMovieTime) {
        if (this.showState === true || newMovieTime === 0) {
            if (newMovieTime === 0) {
                this.currentMovieProgressState = false;
                this.currentMovieProgress = 0;
            }
            if (newMovieTime !== 0) {
                this.currentMovieProgressState = true;
            }
            if (this.movieRemaining !== 0) {
                this.currentMovieProgress = Math.round(newMovieTime * 100 / (this.movieRemaining));
            }
            if (this.currentMovieProgressState === true && this.currentMovieProgress === 0) {
                this.currentMovieProgress = 1;
            }
            if (this.currentMovieProgress > 100) { this.currentMovieProgress = 100 }
            if (this.config.movieControl === true) {
                this.movieControlL.updateCharacteristic(this.platform.Characteristic.Brightness, this.currentMovieProgress);
                this.movieControlL.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(this.currentMovieProgress);
                this.movieControlL.updateCharacteristic(this.platform.Characteristic.On, this.currentMovieProgressState);
                this.movieControlL.getCharacteristic(this.platform.Characteristic.On).updateValue(this.currentMovieProgressState);
            }
        }
    }
    newPowerState(newValue) {
        if (this.turnOffCommand === false && this.turnOnCommand === false) {
            if (newValue === true) {
                this.powerStateTV = 1;
            }
            else {
                this.powerStateTV = 0;
            }
            if (this.powerSate !== newValue) {
                this.powerState = newValue;
                this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
                this.tvService.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.powerStateTV);
                if (this.config.powerB === true) {
                    this.service.updateCharacteristic(this.platform.Characteristic.On, this.powerState);
                    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.powerState);
                }
            }
        }
    }
    newPlayBackState(newPlay) {
        this.playBackState = newPlay;
        if (this.turnOffCommand === false || this.playBackState === [false, false, false]) {
            if (this.playBackState[0] === true) {
                this.mediaState = 0;
            }
            if (this.playBackState[1] === true) {
                this.mediaState = 1;
            }
            if (this.playBackState[2] === true) {
                this.mediaState = 2;
            }
            if (this.playBackState[0] === false && this.playBackState[1] === false && this.playBackState[2] === false) {
                this.mediaState = 4;
            }

            if (this.tvService.getCharacteristic(this.platform.Characteristic.Active).value !== this.powerStateTV) {
                this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
            }
            if (this.play.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[0]) {
                this.play.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[0]);
                this.play.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[0]);
                this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
            }
            if (this.pause.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[1]) {
                this.pause.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[1]);
                this.pause.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[1]);
                this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
            }
            if (this.stop.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[2]) {
                this.stop.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[2]);
                this.stop.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[2]);
                this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
            }
        }
    }
    newInputState(newInput) {
        this.inputState = newInput;
        if (this.inputState[0] === true) {
            this.inputID = 1;
        }
        else if (this.inputState[1] === true) {
            this.inputID = 2;
        }
        else if (this.inputState[2] === true) {
            this.inputID = 3;
        }
        else if (this.inputState[3] === true) {
            this.inputID = 4;
        }
        else if (this.inputState[4] === true) {
            this.inputID = 5;
        }
        else if (this.inputState[5] === true) {
            this.inputID = 6;
        }
        else if (this.inputState[0] === false && this.inputState[1] === false && this.inputState[2] === false
            && this.inputState[3] === false && this.inputState[4] === false && this.inputState[5] === false) {
            this.inputID = 0;
        }
        else {
        }
        this.tvService.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.inputID);
        this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier).updateValue(this.inputID);
    }
    /////////////////HTTP Event decoder
    httpEventDecoder(rawData, key) {
        //this.platform.log(`${key} Sent by HTTP`);
        this.platform.log.debug(rawData);
        this.platform.log.debug(key);
        if (key.includes('getDeviceInfo') || key.includes('volume') || key.includes('mute') || key.includes('position')) {
            this.platform.log.debug(`Response: ${this.commandName(key)} Command Executed`);
        }
        else {
            if (rawData.command_status === "ok") {
                this.platform.log(`Response: ${this.commandName(key)} Command Executed`);
                if (key.includes('A057')) {
                    this.newPowerState(true);
                }
            }
        }

        if (key.includes('A15E') || key.includes('standby')) {
            this.turnOffAll();
        }
        else if (key.includes('B748')) {
            this.newPlayBackState([true, false, false]);
        }
        else if (key.includes('E619')) {
            this.newPlayBackState([false, false, false]);
            this.showState = false;
            this.mediaDetailsReset();
        }
        else if (key.includes('E11E')) {
            this.newPlayBackState([false, true, false]);

        }
        else if (rawData.player_state === 'standby' || typeof rawData.player_state === 'undefined') {
            if (this.turnOnCommand === false) {
                this.turnOffAll();
            }
        }
        /*
                if (rawData.player_state === 'navigator' && rawData.playback_mute === '1') {
                    if (this.turnOnCommand === false) {
                        this.turnOffAll();
                    }
                }
                if (rawData.player_state !== 'standby' && rawData.playback_mute === '0') {
                    if (this.turnOffCommand !== true) {
                        this.newPowerState(true);
                    }
                    if (typeof rawData.playback_volume !== 'undefined') {
                        if (rawData.playback_mute === '0') {
                            this.newVolumeStatus(parseInt(rawData.playback_volume));
                        }
                        else {
                            this.newVolumeStatus(0);
                        }
                    }
                }
        */

        else if (rawData.player_state !== 'standby') {

            if (this.turnOffCommand !== true) {
                this.newPowerState(true);
            }
            if (typeof rawData.playback_volume !== 'undefined') {
                if (rawData.playback_mute === '0') {
                    this.newVolumeStatus(parseInt(rawData.playback_volume));
                }
                else {
                    this.newVolumeStatus(0);
                }
            }

            ////////Playback Status.
            if (rawData.playback_state === "paused") {
                this.newPlayBackState([false, true, false]);
                this.showState = true;
            }
            if (rawData.playback_state === "playing" || rawData.playback_state === "seeking" || rawData.playback_state === "initializing") {
                this.newPlayBackState([true, false, false]);
                this.showState = true;
            }
            if (typeof rawData.playback_state === 'undefined' || rawData.playback_state === 'deinitializing') {
                this.newPlayBackState([false, false, false]);
                this.mediaDetailsReset();
            }
            if (this.newPlayBackState === [false, false, false]) {
                if (this.counter > 2) {
                    this.mediaDetailsReset();
                    this.counter = 0;
                }
                this.counter += 1
            }
            if (typeof rawData.playback_state !== 'undefined') {
                if (rawData.playback_state !== "initializing" && rawData.playback_state !== 'deinitializing' && rawData.playback_state !== 'seeking') {
                    //////////////////////Media Name///////////////////////////////
                    if (typeof rawData.playback_url !== 'undefined') {
                        // this.platform.log('Playback url 1: ' + rawData.playback_url);
                        if (rawData.is_video == '1') {
                            this.platform.log.debug("Movie details")
                            let newNameInput = rawData.playback_url.split('/');
                            let nameInput = '';
                            if (Object.values(newNameInput)[Object.keys(newNameInput).length - 1] === 'AVCHD') {
                                nameInput = Object.values(newNameInput)[Object.keys(newNameInput).length - 2];
                                //this.platform.log('Playback url 12: ' + nameInput);
                                if (typeof nameInput !== 'undefined') {
                                    this.newInputName(nameInput);
                                }
                                else {
                                    if (typeof rawData.playback_caption !== 'undefined') {
                                        this.newInputName(rawData.playback_caption);
                                    }
                                }
                            }
                            else {
                                // this.platform.log('Playback url 13: ' + rawData.playback_caption);
                                if (typeof rawData.playback_caption !== 'undefined') {
                                    if (rawData.playback_caption.includes('.')) {
                                        let newNameInput = rawData.playback_caption.split('.');
                                        let nameInput = Object.values(newNameInput)[0];
                                        let i = 1;
                                        while (i < Object.keys(newNameInput).length - 2) {
                                            nameInput += " " + Object.values(newNameInput)[i];
                                            i++;
                                        }
                                        if (typeof nameInput !== 'undefined') {
                                            this.newInputName(nameInput);
                                        }
                                    }
                                    else {
                                        nameInput = Object.values(newNameInput)[Object.keys(newNameInput).length - 1];
                                        if (typeof nameInput !== 'undefined') {
                                            this.newInputName(nameInput);
                                        }
                                        else {
                                            this.newInputName(rawData.playback_caption);
                                        }
                                    }
                                }
                            }
                            //this.platform.log('Playback extra: ' + rawData.playback_extra_caption);
                            if (typeof rawData.playback_extra_caption !== 'undefined') {
                                if (rawData.playback_extra_caption.includes('.')) {
                                    let newChapter = rawData.playback_extra_caption.split('.');
                                    let chapter = Object.values(newChapter)[0];
                                    if (chapter.startsWith('0')) {
                                        this.chapterTime = chapter.substring(1);
                                    }
                                    let newNameInput = rawData.playback_caption.split('of');
                                    let numberOfChapters = Object.values(newNameInput)[Object.keys(newNameInput).length - 1];
                                    numberOfChapters = numberOfChapters.replace(/[^0-9]/g, '');
                                    let currentChap = Object.values(newNameInput)[Object.keys(newNameInput).length - 2];
                                    currentChap = currentChap.split('(');
                                    currentChap = Object.values(currentChap)[Object.keys(currentChap).length - 1];
                                    currentChap = currentChap.replace(/[^0-9]/g, '');
                                    this.newCurrentChapter('Chapter ' + currentChap + '/' + numberOfChapters + ' ' + this.chapterTime);
                                }
                                else {
                                    let newChapter = rawData.playback_extra_caption.split(' ');
                                    let chapter = Object.values(newChapter)[Object.keys(newChapter).length - 1];
                                    if (chapter.startsWith('0')) {
                                        Object.values(newChapter)[Object.keys(newChapter).length - 1] = chapter.substring(1);
                                        //this.chapterTime = chapter.substring(1);
                                    }
                                    if (typeof rawData.playback_caption !== 'undefined') {
                                        let newNameInput = rawData.playback_caption.split('of');
                                        let nameInput = Object.values(newNameInput)[Object.keys(newNameInput).length - 1];
                                        let numberOfChapters = nameInput.replace(/[^0-9]/g, '');
                                        this.newCurrentChapter(Object.values(newChapter)[0] + ' ' + Object.values(newChapter)[1] + '/' + numberOfChapters + ' ' + Object.values(newChapter)[Object.keys(newChapter).length - 1]);
                                    }
                                    else {
                                        this.newCurrentChapter(rawData.playback_extra_caption);
                                    }
                                }

                            }
                        }
                        else {
                            if (typeof rawData.playback_caption !== 'undefined') {
                                // this.platform.log('Playback url 14: ' + rawData.playback_caption);
                                if (rawData.playback_caption.includes('.')) {
                                    let newNameInput = rawData.playback_caption.split('.');
                                    let nameInput = Object.values(newNameInput)[0];
                                    let i = 1;
                                    while (i < Object.keys(newNameInput).length - 2) {
                                        nameInput += " " + Object.values(newNameInput)[i];
                                        i++;
                                    }
                                    if (typeof nameInput !== 'undefined') {
                                        this.newInputName(nameInput);
                                    }
                                }
                                else {
                                    this.newInputName(rawData.playback_caption);
                                }
                            }
                            //////////////Current Chapter////////////////////////
                            this.newCurrentChapter(rawData.playback_extra_caption);
                        }
                    }
                    else {
                        if (typeof rawData.playback_caption !== 'undefined') {
                            // this.platform.log('Playback url 14: ' + rawData.playback_caption);
                            if (rawData.playback_caption.includes('.')) {
                                let newNameInput = rawData.playback_caption.split('.');
                                let nameInput = Object.values(newNameInput)[0];
                                let i = 1;
                                while (i < Object.keys(newNameInput).length - 2) {
                                    nameInput += " " + Object.values(newNameInput)[i];
                                    i++;
                                }
                                if (typeof nameInput !== 'undefined') {
                                    this.newInputName(nameInput);
                                }
                            }
                            else {
                                this.newInputName(rawData.playback_caption);
                            }
                        }
                        //////////////Current Chapter////////////////////////
                        this.newCurrentChapter(rawData.playback_extra_caption);
                    }
                    ///////Media runtime////////////////////
                    // this.platform.log('Playback duration: ' + rawData.playback_duration);
                    this.movieRemaining = parseInt(rawData.playback_duration);
                    let runtimeNumber = this.secondsToTime(parseInt(rawData.playback_duration));
                    if (runtimeNumber.startsWith('0')) {
                        runtimeNumber = runtimeNumber.substring(1);
                    }
                    this.newInputDuration(runtimeNumber);
                    //////////////////Media Current position
                    //this.platform.log('Playback position: ' + rawData.playback_position);
                    this.newMovieTime(parseInt(rawData.playback_position));
                    ////////////////////Media elapsed time////////////////////////////
                    /*
                    let elapsedRuntimeNumber = this.secondsToTime(parseInt(rawData.playback_position));
                    if (elapsedRuntimeNumber.startsWith('0')) {
                        elapsedRuntimeNumber = elapsedRuntimeNumber.substring(1);
                        this.newElapsedTime(elapsedRuntimeNumber);
                    }
                    else {
                        this.newElapsedTime(elapsedRuntimeNumber);
                    }*/
                    ///////////////Audio format
                    //this.platform.log('Playback audio track: ' + rawData.audio_track);
                    this.newAudioStatus(rawData['audio_track.' + rawData.audio_track + '.codec']);
                    //////////Audio Lnaguage
                    this.newLanguageSelector(rawData['audio_track.' + rawData.audio_track + '.lang']);
                }
            }
            else {

            }

        }


    }
    ///Query////////////////////////////////////////////////////////////////////////////////////////////////////

    query(qName) {
        let key;
        key = "http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/";
        switch (qName) {
            //POWER ButtonGroup
            case 'GET DEVICE INFO':
                key += 'cgi-bin/do?cmd=status&result_syntax=json';
                break;
        }
        return key;
    }
    //////////Sending Command Dame Decoder///////////
    commandName(keyS) {
        this.platform.log.debug(keyS);
        let keySent = '';

        if (keyS.includes('A15E')) {
            keySent = 'Power Off';
        }
        else if (keyS.includes('standby')) {
            keySent = 'Standby';
        }
        else if (keyS.includes('position')) {
            keySent = 'New Position';
        }
        else if (keyS.includes('9E61')) {
            keySent = 'Recent';
        }
        else if (keyS.includes('A05F')) {
            keySent = 'Power On';
        }
        else if (keyS.includes('EA15')) {
            keySent = 'Cursor Up';
        }
        else if (keyS.includes('E916')) {
            keySent = 'Cursor Down';
        }
        else if (keyS.includes('E817')) {
            keySent = 'Cursor Left';
        }
        else if (keyS.includes('E718')) {
            keySent = 'Cursor Right';
        }
        else if (keyS.includes('EB14')) {
            keySent = 'Enter';
        }
        else if (keyS.includes('F906')) {
            keySent = 'Search';
        }
        else if (keyS.includes('FB04')) {
            keySent = 'Back';
        }
        else if (keyS.includes('B748')) {
            keySent = 'Play/Pause';
        }
        else if (keyS.includes('B748')) {
            keySent = 'Play';
        }
        else if (keyS.includes('E11E')) {
            keySent = 'Pause';
        }
        else if (keyS.includes('E619')) {
            keySent = 'Stop';
        }
        else if (keyS.includes('B649')) {
            keySent = 'Previous Chapter';
        }
        else if (keyS.includes('E21D')) {
            keySent = 'Next Chapter';
        }
        else if (keyS.includes('AF50')) {
            keySent = 'Information';
        }
        else if (keyS.includes('E31C')) {
            keySent = 'Rewind';
        }
        else if (keyS.includes('E41B')) {
            keySent = 'Forward';
        }
        else if (keyS.includes('B44B')) {
            keySent = 'Page Up';
        }
        else if (keyS.includes('B34C')) {
            keySent = 'Page Down';
        }
        else if (keyS.includes('F807')) {
            keySent = 'Pop-Up Menu';
        }
        else if (keyS.includes('BF40')) {
            keySent = 'Red';
        }
        else if (keyS.includes('E01F')) {
            keySent = 'Green';
        }
        else if (keyS.includes('FF00')) {
            keySent = 'Yellow';
        }
        else if (keyS.includes('BE41')) {
            keySent = 'Blue';
        }
        else if (keyS.includes('BB44')) {
            keySent = 'Audio';
        }
        else if (keyS.includes('AB54')) {
            keySent = 'Subtitle';
        }
        else if (keyS.includes('B04F')) {
            keySent = 'Repeat';
        }
        else if (keyS.includes('B847')) {
            keySent = 'PIP';
        }
        else if (keyS.includes('BD42')) {
            keySent = 'Select';
        }

        else if (keyS.includes('AD52')) {
            keySent = 'Volume Up';
        }
        else if (keyS.includes('AC53')) {
            keySent = 'Volume Down';
        }
        else if (keyS.includes('B946')) {
            keySent = 'Mute';
        }
        else if (keyS.includes('9F60')) {
            keySent = 'Record';
        }
        else if (keyS.includes('B847')) {
            keySent = 'Movie';
        }
        else if (keyS.includes('A758')) {
            keySent = 'Music';
        }
        else if (keyS.includes('9C63')) {
            keySent = 'TV';
        }
        else if (keyS.includes('EF10')) {
            keySent = 'Eject';
        }
        else if (keyS.includes('light')) {
            keySent = 'Light';
        }
        else if (keyS.includes('E51A')) {
            keySent = 'Slow';
        }
        else if (keyS.includes('B04F')) {
            keySent = 'Mouse';
        }
        else if (keyS.includes('getDeviceInfo')) {
            keySent = 'Get Device Information';
        }
        else if (keyS.includes('seek')) {
            keySent = 'Searching';
        }
        else if (keyS.includes('FA05')) {
            keySent = 'Clear';
        }
        else if (keyS.includes('FD02')) {
            keySent = 'Zoom';
        }
        else if (keyS.includes('B14E')) {
            keySent = 'Setup';
        }
        else if (keyS.includes('AE51')) {
            keySent = 'Top Menu';
        }
        else if (keyS.includes('B24D')) {
            keySent = 'Angle';
        }
        else {
            keySent = keyS
        }
        return keySent
    }
    /////Dune HD controls/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    pressedButton(name) {
        let key;
        key = "http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=ir_code&ir_code=";
        switch (name) {
            //POWER ButtonGroup
            case 'POWER ON':
                key += 'A05F';
                break;
            case 'POWER OFF':
                key += 'A15E';
                break;
            case 'RECENT':
                key += '9E61';
                break;
            case 'CURSOR UP':
                key += 'EA15';
                break;
            case 'CURSOR DOWN':
                key += 'E916';
                break;
            case 'CURSOR LEFT':
                key += 'E817';
                break;
            case 'CURSOR RIGHT':
                key += 'E718';
                break;
            case 'CURSOR ENTER':
                key += 'EB14';
                break;
            case 'SEARCH':
                key += 'F906';
                break;
            case 'BACK':
                key += 'FB04';
                break;
            case 'PLAY':
                key += 'B748';
                break;
            case 'PLAY/PAUSE':
                key += 'B748';
                break;
            case 'PAUSE':
                key += 'E11E';
                break;
            case 'STOP':
                key += 'E619';
                break;
            case 'PREVIOUS':
                key += 'B649';
                break;
            case 'NEXT':
                key += 'E21D';
                break;
            case 'INFO':
                key += 'AF50';
                break;
            case 'REWIND':
                key += 'E31C';
                break;
            case 'FORWAD':
                key += 'E41B';
                break;
            case 'PAGE UP':
                key += 'B44B';
                break;
            case 'PAGE DOWN':
                key += 'B34C';
                break;
            case 'POP-UP MENU':
                key += 'F807';
                break;
            case 'RED':
                key += 'BF40';
                break;
            case 'GREEN':
                key += 'E01F';
                break;
            case 'YELLOW':
                key += 'FF00';
                break;
            case 'BLUE':
                key += 'BE41';
                break;
            case 'AUDIO':
                key += 'BB44';
                break;
            case 'SUBTITLE':
                key += 'AB54';
                break;
            case 'REPEAT':
                key += 'B04F';
                break;
            case 'PIP':
                key += 'B847';
                break;
            case 'SELECT':
                key += 'BD42';
                break;
            case 'VOLUME UP':
                key += 'AD52';
                break;
            case 'VOLUME DOWN':
                key += 'AC53';
                break;
            case 'MUTE':
                key += 'B946';
                break;
            case 'RECORD':
                key += '9F60';
                break;
            case 'MOVIE':
                key += 'B847';
                break;
            case 'MUSIC':
                key += 'A758';
                break;
            case 'TV':
                key += '9C63';
                break;
            case 'EJECT':
                key += 'EF10';
                break;
            case 'LIGHT':
                key += 'light';
                break;
            case 'SLOW':
                key += 'E51A';
                break;
            case 'MOUSE':
                key += 'B04F';
                break;
            case 'CLEAR':
                key += 'FA05';
                break;
            case 'ZOOM':
                key += 'FD02';
                break;
            case 'SETUP':
                key += 'B14E';
                break;
            case 'TOP MENU':
                key += 'AE51';
                break;
            case 'ANGLE':
                key += 'B24D';
                break;
        }
        key += 'BF00&result_syntax=json';

        // this.platform.log(key);
        return key;
    }
    /////////Data Management/////////////////////////////////////////////////////////////
    secondsToTime(seconds) {
        let date = new Date(0);
        date.setSeconds(parseInt(seconds)); // specify value for SECONDS here
        let timeString = date.toISOString().substr(11, 8);
        return timeString
    }
    ////Update instructions
    turnOffAll() {
        this.newPowerState(false);
        this.newPlayBackState([false, false, false]);
        this.newInputState([false, false, false, false, false, false]);
        this.newVolumeStatus(0);
        this.mediaDetailsReset();
    }
    mediaDetailsReset() {
        // this.platform.log("Reset details");
        this.showState = false;
        this.movieRemaining = 0;
        this.newMovieTime(0);
        this.newAudioFormat('Audio Format');
        this.newInputName('Media Title');
        this.newInputDuration('Runtime');
        this.newElapsedTime('Elapsed Time');
        this.newCurrentChapter('Current Chapter');
        this.newLanguage('Audio Language');

    }
    udpServer() {

        this.server = udp.createSocket('udp4');
        this.server.on('error', (error) => {
            this.platform.log(error);
            this.server.close();
        });
        // emits on new datagram msg
        this.server.on('message', (msg, info) => {
            this.platform.log('Data received from client : ' + msg.toString());
            this.platform.log('Received %d bytes from %s:%d', msg.length, info.address, info.port);

        });
        //emits when socket is ready and listening for datagram msgs
        this.server.on('listening', () => {
            let address = this.server.address();
            let port = address.port;
            let family = address.family;
            let ipaddr = address.address;
            this.server.setBroadcast(true);
            this.server.setMulticastTTL(128);
            this.server.addMembership('239.39.3.9');
            this.platform.log('Server is listening at port ' + port);
            this.platform.log('Server ip ' + ipaddr);
            this.platform.log('Server is IP4/IP6 : ' + family);
        });
        this.server.bind(18239, '192.168.86.25')
        //emits after the socket is closed using socket.close();
        this.server.on('close', () => {
            this.platform.log('Socket is closed !');
        });

        //this.server.bind(1900, '239.255.255.250');

    }
}
