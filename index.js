"use strict";
const PLATFORM_NAME = 'duneHDPlugin';
const PLUGIN_NAME = 'homebridge-dune-hd';
const request = require('http');
const udp = require('dgram');

// Declarative list of optional stateless switches used to build/remove services consistently.
const STATELESS_SWITCH_CONFIGS = [
    { propertyName: 'cursorUp', serviceName: 'Cursor Up', uniqueId: 'CataNicoGaTa-31', configKey: 'cursorUpB', commandName: 'CURSOR UP' },
    { propertyName: 'cursorDown', serviceName: 'Cursor Down', uniqueId: 'CataNicoGaTa-32', configKey: 'cursorDownB', commandName: 'CURSOR DOWN' },
    { propertyName: 'cursorLeft', serviceName: 'Cursor Left', uniqueId: 'CataNicoGaTa-33', configKey: 'cursorLeftB', commandName: 'CURSOR LEFT' },
    { propertyName: 'cursorRight', serviceName: 'Cursor Right', uniqueId: 'CataNicoGaTa-34', configKey: 'cursorRightB', commandName: 'CURSOR RIGHT' },
    { propertyName: 'cursorEnter', serviceName: 'Cursor Enter', uniqueId: 'CataNicoGaTa-35', configKey: 'cursorEnterB', commandName: 'CURSOR ENTER' },
    { propertyName: 'searchB', serviceName: 'Search', uniqueId: 'CataNicoGaTa-36', configKey: 'searchB', commandName: 'SEARCH' },
    { propertyName: 'backButton', serviceName: 'Back', uniqueId: 'CataNicoGaTa-37', configKey: 'backButtonB', commandName: 'BACK' },
    { propertyName: 'infoButton', serviceName: 'Info', uniqueId: 'CataNicoGaTa-44', configKey: 'infoB', commandName: 'INFO' },
    { propertyName: 'pageUp', serviceName: 'Page Up', uniqueId: 'CataNicoGaTa-50', configKey: 'pageUpB', commandName: 'PAGE UP' },
    { propertyName: 'pageDown', serviceName: 'Page Down', uniqueId: 'CataNicoGaTa-51', configKey: 'pageDownB', commandName: 'PAGE DOWN' },
    { propertyName: 'popUpMenu', serviceName: 'Pop-Up Menu', uniqueId: 'CataNicoGaTa-52', configKey: 'popUpMenuB', commandName: 'POP-UP MENU' },
    { propertyName: 'previous', serviceName: 'Previous', uniqueId: 'CataNicoGaTa-38', configKey: 'mediaButtons', commandName: 'PREVIOUS' },
    { propertyName: 'next', serviceName: 'Next', uniqueId: 'CataNicoGaTa-39', configKey: 'mediaButtons', commandName: 'NEXT' },
    { propertyName: 'rewindButton', serviceName: 'Rewind', uniqueId: 'CataNicoGaTa-46', configKey: 'mediaButtons', commandName: 'REWIND' },
    { propertyName: 'forwardButton', serviceName: 'Forward', uniqueId: 'CataNicoGaTa-80', configKey: 'mediaButtons', commandName: 'FORWARD' },
    { propertyName: 'red', serviceName: 'Red', uniqueId: 'CataNicoGaTa-53', configKey: 'redB', commandName: 'RED' },
    { propertyName: 'green', serviceName: 'Green', uniqueId: 'CataNicoGaTa-54', configKey: 'greenB', commandName: 'GREEN' },
    { propertyName: 'blue', serviceName: 'Blue', uniqueId: 'CataNicoGaTa-55', configKey: 'blueB', commandName: 'BLUE' },
    { propertyName: 'yellow', serviceName: 'Yellow', uniqueId: 'CataNicoGaTa-56', configKey: 'yellowB', commandName: 'YELLOW' },
    { propertyName: 'audio', serviceName: 'Audio', uniqueId: 'CataNicoGaTa-57', configKey: 'audioB', commandName: 'AUDIO' },
    { propertyName: 'subtitle', serviceName: 'Subtitle', uniqueId: 'CataNicoGaTa-58', configKey: 'subtitleB', commandName: 'SUBTITLE' },
    { propertyName: 'repeat', serviceName: 'Repeat', uniqueId: 'CataNicoGaTa-63', configKey: 'repeatB', commandName: 'REPEAT' },
    { propertyName: 'pip', serviceName: 'Shuffle-PIP', uniqueId: 'CataNicoGaTa-64', configKey: 'pipB', commandName: 'PIP' },
    { propertyName: 'selectB', serviceName: 'Select', uniqueId: 'CataNicoGaTa-65', configKey: 'selectB', commandName: 'SELECT' },
    { propertyName: 'mute', serviceName: 'Mute', uniqueId: 'CataNicoGaTa-9001', configKey: 'muteB', commandName: 'MUTE' },
    { propertyName: 'record', serviceName: 'Record', uniqueId: 'CataNicoGaTa-9002', configKey: 'recordB', commandName: 'RECORD' },
    { propertyName: 'movie', serviceName: 'Movie', uniqueId: 'CataNicoGaTa-9003', configKey: 'movieB', commandName: 'MOVIE' },
    { propertyName: 'music', serviceName: 'Music', uniqueId: 'CataNicoGaTa-9004', configKey: 'musicB', commandName: 'MUSIC' },
    { propertyName: 'tvB', serviceName: 'TV', uniqueId: 'CataNicoGaTa-9005', configKey: 'tvB', commandName: 'TV' },
    { propertyName: 'ejectB', serviceName: 'Eject', uniqueId: 'CataNicoGaTa-9006', configKey: 'ejectB', commandName: 'EJECT' },
    { propertyName: 'modeB', serviceName: 'Mode', uniqueId: 'CataNicoGaTa-9007', configKey: 'modeB', commandName: 'LIGHT' },
    { propertyName: 'slowB', serviceName: 'Slow', uniqueId: 'CataNicoGaTa-9008', configKey: 'slowB', commandName: 'SLOW' },
    { propertyName: 'mouseB', serviceName: 'Mouse', uniqueId: 'CataNicoGaTa-9009', configKey: 'mouseB', commandName: 'MOUSE' },
    { propertyName: 'clear', serviceName: 'Clear', uniqueId: 'CataNicoGaTa-40', configKey: 'clearB', commandName: 'CLEAR' },
    { propertyName: 'zoom', serviceName: 'Zoom', uniqueId: 'CataNicoGaTa-60', configKey: 'zoomB', commandName: 'ZOOM' },
    { propertyName: 'setup', serviceName: 'Setup', uniqueId: 'CataNicoGaTa-45', configKey: 'setupB', commandName: 'SETUP' },
    { propertyName: 'topMenu', serviceName: 'Top Menu', uniqueId: 'CataNicoGaTa-41', configKey: 'topMenuB', commandName: 'TOP MENU' },
    { propertyName: 'angle', serviceName: 'Angle', uniqueId: 'CataNicoGaTa-59', configKey: 'angleB', commandName: 'ANGLE' },
    { propertyName: 'recentB', serviceName: 'Recent', uniqueId: 'CataNicoGaTa-X09', configKey: 'recentB', commandName: 'RECENT' },
];

// Shared Dune remote command definitions used for both command logging and IR URL generation.
const REMOTE_COMMAND_DEFINITIONS = [
    { code: 'A05F', label: 'Power On', buttons: ['POWER ON'] },
    { code: 'A15E', label: 'Power Off', buttons: ['POWER OFF'] },
    { code: '9E61', label: 'Recent', buttons: ['RECENT'] },
    { code: 'EA15', label: 'Cursor Up', buttons: ['CURSOR UP'] },
    { code: 'E916', label: 'Cursor Down', buttons: ['CURSOR DOWN'] },
    { code: 'E817', label: 'Cursor Left', buttons: ['CURSOR LEFT'] },
    { code: 'E718', label: 'Cursor Right', buttons: ['CURSOR RIGHT'] },
    { code: 'EB14', label: 'Enter', buttons: ['CURSOR ENTER'] },
    { code: 'F906', label: 'Search', buttons: ['SEARCH'] },
    { code: 'FB04', label: 'Back', buttons: ['BACK'] },
    { code: 'B748', label: 'Play/Play-Pause', buttons: ['PLAY', 'PLAY/PAUSE'] },
    { code: 'E11E', label: 'Pause', buttons: ['PAUSE'] },
    { code: 'E619', label: 'Stop', buttons: ['STOP'] },
    { code: 'B649', label: 'Previous Chapter', buttons: ['PREVIOUS'] },
    { code: 'E21D', label: 'Next Chapter', buttons: ['NEXT'] },
    { code: 'AF50', label: 'Information', buttons: ['INFO'] },
    { code: 'E31C', label: 'Rewind', buttons: ['REWIND'] },
    { code: 'E41B', label: 'Forward', buttons: ['FORWARD'] },
    { code: 'B44B', label: 'Page Up', buttons: ['PAGE UP'] },
    { code: 'B34C', label: 'Page Down', buttons: ['PAGE DOWN'] },
    { code: 'F807', label: 'Pop-Up Menu', buttons: ['POP-UP MENU'] },
    { code: 'BF40', label: 'Red', buttons: ['RED'] },
    { code: 'E01F', label: 'Green', buttons: ['GREEN'] },
    { code: 'FF00', label: 'Yellow', buttons: ['YELLOW'] },
    { code: 'BE41', label: 'Blue', buttons: ['BLUE'] },
    { code: 'BB44', label: 'Audio', buttons: ['AUDIO'] },
    { code: 'AB54', label: 'Subtitle', buttons: ['SUBTITLE'] },
    { code: 'B04F', label: 'Repeat/Mouse', buttons: ['REPEAT', 'MOUSE'] },
    { code: 'B847', label: 'PIP/Movie', buttons: ['PIP', 'MOVIE'] },
    { code: 'BD42', label: 'Select', buttons: ['SELECT'] },
    { code: 'AD52', label: 'Volume Up', buttons: ['VOLUME UP'] },
    { code: 'AC53', label: 'Volume Down', buttons: ['VOLUME DOWN'] },
    { code: 'B946', label: 'Mute', buttons: ['MUTE'] },
    { code: '9F60', label: 'Record', buttons: ['RECORD'] },
    { code: 'A758', label: 'Music', buttons: ['MUSIC'] },
    { code: '9C63', label: 'TV', buttons: ['TV'] },
    { code: 'EF10', label: 'Eject', buttons: ['EJECT'] },
    { code: 'light', label: 'Light', buttons: ['LIGHT'] },
    { code: 'E51A', label: 'Slow', buttons: ['SLOW'] },
    { code: 'FA05', label: 'Clear', buttons: ['CLEAR'] },
    { code: 'FD02', label: 'Zoom', buttons: ['ZOOM'] },
    { code: 'B14E', label: 'Setup', buttons: ['SETUP'] },
    { code: 'AE51', label: 'Top Menu', buttons: ['TOP MENU'] },
    { code: 'B24D', label: 'Angle', buttons: ['ANGLE'] },
];

const BUTTON_IR_CODE_MAP = REMOTE_COMMAND_DEFINITIONS.reduce((map, definition) => {
    for (const buttonName of definition.buttons) {
        map[buttonName] = definition.code;
    }
    return map;
}, {});

const COMMAND_NAME_MATCHES = [
    { token: 'standby', label: 'Standby' },
    { token: 'position', label: 'New Position' },
    ...REMOTE_COMMAND_DEFINITIONS.map((definition) => ({ token: definition.code, label: definition.label })),
    { token: 'getDeviceInfo', label: 'Get Device Information' },
    { token: 'seek', label: 'Searching' },
];

module.exports = (api) => {
    api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, duneHDPlatform, true);
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

    iniDevice() {
        if (this.config.newPlatformUUID === false) {
            this.duneHDDevice =
            {
                duneHDUniqueId: 'nicocatagameztanarro',
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
        accessory.category = 35;
        accessory.context.device = this.duneHDDevice;
        new duneHDAccessory(this, accessory);
        this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
    }

    removeAccessory(accessory) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
}
class duneHDAccessory {
    constructor(platform, accessory) {

        this.platform = platform;
        this.accessory = accessory;
        this.config = platform.config;
        this.DUNEHD_IP = this.config.ip;
        this.DUNEHD_PORT = this.config.port || 80;
        this.statelessTimeOut = 1000;
        this.turnOffCommand = false;
        this.turnOnCommand = false;
        //////Initial Switch and sensors state///////////////////////////////////////////////////////////////////////////////////////////////
        this.powerState = false;
        this.playBackState = [false, false, false];
        this.powerStateTV = 0;
        this.currentVolume = 0;
        this.currentMuteState = true;
        this.currentVolumeSwitch = false;
        this.inputID = 1;
        this.mediaState = 4;
        this.videoState = false;
        this.audioState = false;
        this.chapterTime = '';
        this.inputName = 'Media Title';
        this.mediaDuration = 'Runtime';
        this.mediaInformation = 'Video Information';
        this.mediaChapter = 'Current Chapter';
        this.mediaAudioFormat = 'Audio Format';
        this.language = 'Audio Language';
        this.subtitleLanguage = '';
        this.showState = false;
        this.httpNotResponding = 0;
        this.pollInFlight = false;
        this.turnOffAllUsed = false;
        this.counter = 0;
        /////MovieConstants
        this.currentMovieProgress = 0;
        this.currentMovieProgressState = false;
        this.movieElapsed = 0;
        this.currentMoviePosition = 0;
        this.movieRemaining = 0;
        this.bluryaDVD = false;
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
        this.config.changeDimmersToFan = platform.config.changeDimmersToFan || false;
        this.config.remainMovieTimer = platform.config.remainMovieTimer || false;
        this.config.infoToMenu = platform.config.infoToMenu || false;
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
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.config.serialN)
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '1.3.1');

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
                    this.sending([this.pressedButton('STOP')]);
                    this.newPowerState(false);
                    this.turnOffAll();
                    this.turnOffCommand = true;
                    this.turnOnCommand = false;
                    // this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=standby&result_syntax=json"]);
                    setTimeout(() => {
                        this.sending([this.pressedButton('POWER OFF')]);
                    }, 1000);
                }
                callback(null);
            })
            .on('get', (callback) => {
                let currentValue = this.powerStateTV;
                callback(null, currentValue);
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
                        // Dune maps this action to Top Menu (Home Menu is not a valid key in pressedButton()).
                        this.sending([this.pressedButton('TOP MENU')]);
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
                        if (this.config.infoToMenu) {
                            this.platform.log.debug('set Remote Key Pressed: MENU');
                            this.sending([this.pressedButton('POP-UP MENU')]);
                        }
                        else {
                            this.platform.log.debug('set Remote Key Pressed: INFORMATION');
                            this.sending([this.pressedButton('INFO')]);
                        }
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
                this.inputID = inputIdentifier;
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
        // Build all TV input source services from a declarative definition table.
        this.buildInputSources();
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
        ////Things to remove
        this.tvService.getCharacteristic(this.platform.Characteristic.Brightness)
            .on('get', (callback) => {
                let currentValue = this.currentVolume;
                callback(null, currentValue);
            })
            .on('set', (newValue, callback) => {
                this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&volume=" + newValue + "&mute=0&result_syntax=json"]);
                this.platform.log('Volume Value set to: ' + newValue);
                callback(null);
            });
        this.tvService.getCharacteristic(this.platform.Characteristic.PictureMode)
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
        //////
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
            this.buildVolumeControlService();
        }
        if (this.config.movieControl === true) {
            this.buildMovieProgressService();
        }
        /////////////Addtional Services////////////////////////////////////////////////////////////////////////////////////
        if (this.config.powerB === true) {
            const powerSwitchServiceName = `${accessory.context.device.duneHDDisplayName} Power Switch`;
            this.createStatefulSwitch({
                propertyName: 'service',
                serviceName: powerSwitchServiceName,
                uniqueId: 'CataNicoGaTa-PWR-Dune',
                onGet: this.getOn.bind(this),
                onSet: this.setOn.bind(this),
                setNameCharacteristic: true,
            });
        };
        this.createStatefulSwitch({
            propertyName: 'play',
            serviceName: 'Play',
            uniqueId: 'CataNicoGaTa-10',
            onGet: this.playSwitchStateGet.bind(this),
            onSet: this.playSwitchStateSet.bind(this),
        });
        this.createStatefulSwitch({
            propertyName: 'pause',
            serviceName: 'Pause',
            uniqueId: 'CataNicoGaTa-11',
            onGet: this.pauseSwitchStateGet.bind(this),
            onSet: this.pauseSwitchStateSet.bind(this),
        });
        this.createStatefulSwitch({
            propertyName: 'stop',
            serviceName: 'Stop',
            uniqueId: 'CataNicoGaTa-12',
            onGet: this.stopSwitchStateGet.bind(this),
            onSet: this.stopSwitchStateSet.bind(this),
        });
        ///////////////////////////////////Input buttons//////////////////////////////////////////////////////////////////////////

        this.buildStatelessSwitches();
        if (this.config.remainMovieTimer) {
            this.movieTimer = accessory.getService(this.platform.Service.Valve) || accessory.addService(this.platform.Service.Valve, 'Dune HD Movie Timer', 'Movie Timer');
            this.movieTimer.setCharacteristic(this.platform.Characteristic.Name, 'Dune HD Movie Timer');
            this.movieTimer.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
            this.movieTimer.setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Dune HD Movie Timer');
            this.movieTimer.setCharacteristic(this.platform.Characteristic.ValveType, this.platform.Characteristic.ValveType.IRRIGATION);
            this.movieTimer.getCharacteristic(this.platform.Characteristic.Active)
                .on('get', (callback) => {
                    let currentValue = this.currentMovieProgressState ? 1 : 0
                    callback(null, currentValue);
                })
                .on('set', (value, callback) => {
                    callback(null);
                });
            this.movieTimer.setCharacteristic(this.platform.Characteristic.InUse, this.platform.Characteristic.InUse.NOT_IN_USE);
            this.movieTimer.getCharacteristic(this.platform.Characteristic.RemainingDuration)
                .on('get', (callback) => {
                    let currentValue = this.movieElapsed;
                    callback(null, currentValue);
                })
                .setProps({
                    maxValue: 86400 / 4, // 1 day
                });
            this.movieTimer.getCharacteristic(this.platform.Characteristic.SetDuration)
                .on('get', (callback) => {
                    let currentValue = this.movieRemaining;
                    callback(null, currentValue);
                })
                .setProps({
                    maxValue: 86400 / 4, // 1 day
                });

        }
        ///////////////Clean up. Delete services not in used////////////////////////////////
        this.cleanupDisabledServices();

        //////////////////Connecting to Dune HD
        // this.udpServer();
        //syncing////////////////////////////////////////////////////////////////////////////////////////
        setInterval(() => {
            if (this.turnOffCommand === false && this.turnOnCommand === false) {
                // Avoid overlapping poll requests when network/device responses are delayed.
                if (this.pollInFlight !== true) {
                    this.sending([this.query('GET DEVICE INFO')]);
                }
                if (this.httpNotResponding >= this.reconnectionTry) {
                    if (this.turnOffAllUsed === false) {
                        this.turnOffAll();
                        this.turnOffAllUsed = true;
                    }
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
                    //  this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.inputName);
                    this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
                }
                if (this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaDuration) {
                    this.platform.log.debug('Updating Runtime');
                    this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration);
                    //this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaDuration);
                }
                if (this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaChapter) {
                    this.platform.log.debug('Updating Current Chapter');
                    // this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaChapter);
                    this.currentChaper.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaChapter);
                }
                if (this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaAudioFormat) {
                    this.platform.log.debug('Updating Audio Format');
                    //  this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaAudioFormat);
                    this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                }
                if (this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.language) {
                    this.platform.log.debug('Updating Language');
                    //this.audioLanguage.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.language);
                    this.audioLanguage.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.language);
                }
                if (this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaInformation) {
                    this.platform.log.debug('Updating Video Information');
                    //this.videoAudioElapseTime.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaInformation);
                    this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaInformation);
                }

            }
            else {
                setTimeout(() => {
                    this.turnOffCommand = false;
                    this.turnOnCommand = false;
                }, 3000);
            }
        }, this.config.pollingInterval);
        setInterval(() => {
            if (this.tvService.getCharacteristic(this.platform.Characteristic.Active).value === 1 && this.playBackState[0] === true) {
            }
        }, 120000);
    }

    // Declares all TV input sources in one place and builds/links each service from a definition object.


    buildDualModeRangeService({
        serviceName,
        lightPropertyName,
        fanPropertyName,
        lightUniqueId,
        fanUniqueId,
        stateGetter,
        onStateSet,
        valueGetter,
        onValueSet,
        setNameCharacteristic = false,
    }) {
        const usesFanMode = this.config.changeDimmersToFan === true;
        const propertyName = usesFanMode ? fanPropertyName : lightPropertyName;
        const serviceType = usesFanMode ? this.platform.Service.Fanv2 : this.platform.Service.Lightbulb;
        const uniqueId = usesFanMode ? fanUniqueId : lightUniqueId;
        const stateCharacteristic = usesFanMode ? this.platform.Characteristic.Active : this.platform.Characteristic.On;
        const valueCharacteristic = usesFanMode ? this.platform.Characteristic.RotationSpeed : this.platform.Characteristic.Brightness;
        const service = this.accessory.getService(serviceName)
            || this.accessory.addService(serviceType, serviceName, uniqueId);
        if (setNameCharacteristic === true) {
            service.setCharacteristic(this.platform.Characteristic.Name, serviceName);
        }
        service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
        service.setCharacteristic(this.platform.Characteristic.ConfiguredName, serviceName);
        service.getCharacteristic(stateCharacteristic)
            .on('get', (callback) => {
                const currentState = stateGetter();
                if (usesFanMode) {
                    callback(null, currentState === true ? 1 : 0);
                    return;
                }
                callback(null, currentState);
            })
            .on('set', (newValue, callback) => {
                onStateSet(newValue, usesFanMode);
                callback(null);
            });
        service.getCharacteristic(valueCharacteristic)
            .on('get', (callback) => {
                callback(null, valueGetter());
            })
            .on('set', (newValue, callback) => {
                onValueSet(newValue, usesFanMode);
                callback(null);
            });
        this[propertyName] = service;
        return service;
    }

    buildInputSources() {
        const currentShown = this.platform.Characteristic.CurrentVisibilityState.SHOWN;
        const currentHidden = this.platform.Characteristic.CurrentVisibilityState.HIDDEN;
        const targetShown = this.platform.Characteristic.TargetVisibilityState.SHOWN;
        const targetHidden = this.platform.Characteristic.TargetVisibilityState.HIDDEN;
        const showMediaDetails = this.showState ? currentShown : currentHidden;
        const showMediaDetailsTarget = this.showState ? targetShown : targetHidden;
        const inputSourceDefinitions = [
            {
                propertyName: 'videoAudioTitle',
                serviceName: 'Media Title',
                uniqueId: 'CataNicoGaTa-1003',
                identifier: 1,
                configuredName: () => this.inputName,
                inputSourceType: this.platform.Characteristic.InputSourceType.APPLICATION,
                currentVisibility: currentShown,
                onGet: () => this.inputName,
                logOnGet: true,
            },
            {
                propertyName: 'runtime',
                serviceName: 'Runtime',
                uniqueId: 'CataNicoGaTa-1004',
                identifier: 2,
                configuredName: () => this.mediaDuration,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                currentVisibility: currentShown,
                onGet: () => this.mediaDuration,
                logOnGet: true,
            },
            {
                propertyName: 'videoAudioElapseTime',
                serviceName: 'Video Information',
                uniqueId: 'CataNicoGaTa-1005',
                identifier: 4,
                configuredName: () => this.mediaInformation,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: targetHidden,
                currentVisibility: currentHidden,
                onGet: () => this.mediaInformation,
                logOnGet: true,
            },
            {
                propertyName: 'currentChaper',
                serviceName: 'Current Chapter',
                uniqueId: 'CataNicoGaTa-4005',
                identifier: 3,
                configuredName: () => this.mediaChapter,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: showMediaDetailsTarget,
                currentVisibility: showMediaDetails,
                onGet: () => this.mediaChapter,
                logOnGet: true,
            },
            {
                propertyName: 'audioFormat',
                serviceName: 'Audio Format',
                uniqueId: 'CataNicoGaTa-4006',
                identifier: 5,
                configuredName: () => this.mediaAudioFormat,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: showMediaDetailsTarget,
                currentVisibility: showMediaDetails,
                onGet: () => this.mediaAudioFormat,
                logOnGet: true,
            },
            {
                propertyName: 'audioLanguage',
                serviceName: 'Audio Language',
                uniqueId: 'CataNicoGaTa-4007',
                identifier: 6,
                configuredName: () => this.language,
                inputSourceType: this.platform.Characteristic.InputSourceType.HDMI,
                targetVisibility: showMediaDetailsTarget,
                currentVisibility: showMediaDetails,
                onGet: () => this.language,
                logOnGet: true,
            },
        ];
        for (const definition of inputSourceDefinitions) {
            this.getOrCreateInputSource(definition);
        }
    }

    buildMovieProgressService() {
        this.buildDualModeRangeService({
            serviceName: 'Media Progress',
            lightPropertyName: 'movieControlL',
            fanPropertyName: 'movieControlF',
            lightUniqueId: 'CataNicoGaTa-301',
            fanUniqueId: 'CataNicoGaTa-301F',
            setNameCharacteristic: true,
            stateGetter: () => this.currentMovieProgressState,
            onStateSet: (newValue) => {
                this.platform.log('Movie progress state set to: ' + newValue);
            },
            valueGetter: () => this.currentMovieProgress,
            onValueSet: (newValue) => {
                this.setMovieSeekPositionFromPercent(newValue);
                this.platform.log('Movie progress set to: ' + newValue + '%');
            },
        });
    }

    buildStatelessSwitches() {
        for (const definition of this.getStatelessSwitchConfigs()) {
            if (this.config[definition.configKey] === true) {
                this.createStatelessSwitch(definition);
            }
        }
    }

    buildVolumeControlService() {
        this.buildDualModeRangeService({
            serviceName: 'Dune HD Volume',
            lightPropertyName: 'volumeDimmer',
            fanPropertyName: 'volumeFan',
            lightUniqueId: 'CataNicoGaT-98',
            fanUniqueId: 'CataNicoGaT-98F',
            stateGetter: () => this.currentVolumeSwitch,
            onStateSet: (newValue, usesFanMode) => {
                const shouldUnmute = usesFanMode ? newValue === 1 : newValue === true;
                if (shouldUnmute) {
                    this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state_&mute=0&result_syntax=json"]);
                    this.platform.log('Volume Value set to: Unmute');
                    return;
                }
                this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&mute=1&result_syntax=json"]);
                this.platform.log('Volume Value set to: Mute');
            },
            valueGetter: () => this.currentVolume,
            onValueSet: (newValue) => {
                this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&volume=" + newValue + "&mute=0&result_syntax=json"]);
                this.platform.log('Volume Value set to: ' + newValue);
            },
        });
    }

    cleanupDisabledServices() {
        if (this.config.remainMovieTimer === false) {
            this.safeRemoveService(this.movieTimer);
        }
        if (this.config.powerB === false) {
            this.safeRemoveService(this.service);
        }
        if (this.config.movieControl === false) {
            this.safeRemoveService(this.movieControlL);
            this.safeRemoveService(this.movieControlF);
        }
        this.cleanupDisabledStatelessSwitches();
        if (this.config.volume === false) {
            this.safeRemoveService(this.volumeDimmer);
            this.safeRemoveService(this.volumeFan);
        }
        if (this.config.changeDimmersToFan === false) {
            this.safeRemoveService(this.volumeFan);
            this.safeRemoveService(this.movieControlF);
        }
        if (this.config.changeDimmersToFan === true) {
            this.safeRemoveService(this.volumeDimmer);
            this.safeRemoveService(this.movieControlL);
        }
    }

    cleanupDisabledStatelessSwitches() {
        for (const definition of this.getStatelessSwitchConfigs()) {
            if (this.config[definition.configKey] !== true) {
                const service = this[definition.propertyName] || this.accessory.getService(definition.serviceName);
                this.safeRemoveService(service);
            }
        }
    }

    commandLog(commandPress) {
        if (commandPress.includes('getDeviceInfo')) {
            this.platform.log.debug(`Sending: ${this.commandName(commandPress)} Command`);
        }
        else {
            this.platform.log(`Sending: ${this.commandName(commandPress)} Command`);
        }
    }

    commandName(keyS) {
        this.platform.log.debug(keyS);
        const commandText = typeof keyS === 'string' ? keyS : String(keyS);
        for (const mapping of COMMAND_NAME_MATCHES) {
            if (commandText.includes(mapping.token)) {
                return mapping.label;
            }
        }
        return commandText;
    }

    createInputSourceService({
        serviceName,
        uniqueId,
        identifier,
        configuredName,
        inputSourceType,
        targetVisibility,
        currentVisibility,
    }) {
        const configuredNameValue = typeof configuredName === 'function' ? configuredName() : configuredName;
        const service = this.accessory.addService(this.platform.Service.InputSource, serviceName, uniqueId)
            .setCharacteristic(this.platform.Characteristic.Identifier, identifier)
            .setCharacteristic(this.platform.Characteristic.ConfiguredName, configuredNameValue)
            .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(this.platform.Characteristic.InputSourceType, inputSourceType);
        if (typeof targetVisibility !== 'undefined') {
            service.setCharacteristic(this.platform.Characteristic.TargetVisibilityState, targetVisibility);
        }
        if (typeof currentVisibility !== 'undefined') {
            service.setCharacteristic(this.platform.Characteristic.CurrentVisibilityState, currentVisibility);
        }
        return service;
    }

    createStatefulSwitch({ propertyName, serviceName, uniqueId, onGet, onSet, setNameCharacteristic = false }) {
        const service = this.accessory.getService(serviceName)
            || this.accessory.addService(this.platform.Service.Switch, serviceName, uniqueId);
        if (setNameCharacteristic === true) {
            service.setCharacteristic(this.platform.Characteristic.Name, serviceName);
            service.updateCharacteristic(this.platform.Characteristic.Name, serviceName);
        }
        service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
        service.setCharacteristic(this.platform.Characteristic.ConfiguredName, serviceName);
        service.getCharacteristic(this.platform.Characteristic.On)
            .on('get', onGet)
            .on('set', onSet);
        this[propertyName] = service;
        return service;
    }

    createStatelessSwitch({ propertyName, serviceName, uniqueId, commandName }) {
        const service = this.accessory.getService(serviceName)
            || this.accessory.addService(this.platform.Service.Switch, serviceName, uniqueId);
        service.addOptionalCharacteristic(this.platform.Characteristic.ConfiguredName);
        service.setCharacteristic(this.platform.Characteristic.ConfiguredName, serviceName);
        service.getCharacteristic(this.platform.Characteristic.On)
            .on('get', (callback) => {
                this.platform.log.debug(`${serviceName} GET On`);
                callback(null, false);
            })
            .on('set', (value, callback) => {
                this.platform.log.debug(`${serviceName} SET On:`, value);
                if (value === true) {
                    this.sending([this.pressedButton(commandName)]);
                }
                setTimeout(() => {
                    service.updateCharacteristic(this.platform.Characteristic.On, false);
                }, this.statelessTimeOut);
                callback(null);
            });
        this[propertyName] = service;
        return service;
    }

    getOn(callback) {
        let isOn = this.powerState;
        this.platform.log.debug('Get Power ->', isOn);
        callback(null, isOn);
    }

    getOrCreateInputSource(definition) {
        const existingService = this.accessory.getService(definition.existingServiceName || definition.serviceName)
            || this.accessory.getService(definition.serviceName);
        const service = existingService || this.createInputSourceService(definition);
        if (typeof definition.onGet === 'function') {
            service.getCharacteristic(this.platform.Characteristic.ConfiguredName)
                .on('get', (callback) => {
                    const currentValue = definition.onGet();
                    if (definition.logOnGet === true) {
                        this.platform.log.debug('Getting' + currentValue);
                    }
                    callback(null, currentValue);
                });
        }
        this.tvService.addLinkedService(service);
        this[definition.propertyName] = service;
        return service;
    }

    getStatelessSwitchConfigs() {
        return STATELESS_SWITCH_CONFIGS;
    }

    httpEventDecoder(rawData, key) {
        //this.platform.log(`${key} Sent by HTTP`);
        //this.platform.log(rawData);
        //this.platform.log(key);
        if (key.includes('getDeviceInfo') || key.includes('volume') || key.includes('mute') || key.includes('position')) {
            this.platform.log.debug(`Response: ${this.commandName(key)} Command Executed`);
        }
        else {
            if (rawData.command_status === "ok") {
                this.platform.log(`Response: ${this.commandName(key)} Command Executed`);
                if (key.includes('A05F')) {
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
        //else if (rawData.player_state === 'standby' || typeof rawData.player_state === 'undefined' || rawData.player_state === 'safe_mode') {
        else if (rawData.player_state === 'standby' || typeof rawData.player_state === 'undefined') {
            if (this.turnOnCommand === false) {
                if (this.turnOffAllUsed === false) {
                    this.turnOffAll();
                    this.turnOffAllUsed = true;
                }

            }
            else {
                setTimeout(() => {
                    this.turnOnCommand = false
                }, 3000);
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
        else if (rawData.player_state === 'navigator' && rawData.playback_mute === '1') {
            if (this.turnOnCommand === false) {
                this.turnOffAll();
            }
        }
        else if (rawData.player_state !== 'standby' && typeof rawData.player_state !== 'undefined') {
            this.turnOffAllUsed = false;
            if (this.turnOffCommand !== true) {
                this.newPowerState(true);
            }
            if (typeof rawData.playback_volume !== 'undefined') {
                if (rawData.playback_mute === '0') {
                    this.newVolumeStatus(this.toInt(rawData.playback_volume, 0));
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
            // if (rawData.player_state === "bluray_playback" || rawData.player_state === "dvd_playback"||rawData.player_state === "file_playback") {
            if (rawData.player_state === "bluray_playback" || rawData.player_state === "dvd_playback") {
                this.bluryaDVD = true;
                this.newVolumeStatus(this.toInt(rawData.playback_volume, 0));
                if (rawData.playback_speed === "0") {
                    this.newPlayBackState([false, true, false]);
                    //this.showState = true;
                }
                else {
                    this.newPlayBackState([true, false, false]);
                    //this.showState = true;
                }
                if (typeof rawData.playback_caption !== 'undefined') {
                    this.newInputName(rawData.playback_caption);
                }
                ///////Media runtime////////////////////
                // this.platform.log('Playback duration: ' + rawData.playback_duration);
                this.movieRemaining = this.toInt(rawData.playback_duration, 0);
                let runtimeNumber = this.secondsToTime(this.movieRemaining);
                if (runtimeNumber.startsWith('0')) {
                    runtimeNumber = runtimeNumber.substring(1);
                }
                this.newInputDuration(runtimeNumber);
                if (typeof rawData.playback_duration != 'undefined' && typeof rawData.playback_position != 'undefined') {
                    //////////////////Media Current position
                    // this.platform.log('Playback position: ' + rawData.playback_position);
                    this.currentMoviePosition = this.toInt(rawData.playback_position, 0);
                    let movieElapsed1 = this.movieRemaining - this.currentMoviePosition
                    if (movieElapsed1 < 0) {
                        this.movieElapsed = 0;
                    }
                    else {
                        this.movieElapsed = movieElapsed1
                    }
                    this.newMovieTime(this.currentMoviePosition);
                }
            }
            else if (typeof rawData.playback_state === 'undefined' || rawData.playback_state === 'deinitializing') {
                this.newPlayBackState([false, false, false]);
                this.mediaDetailsReset();
            }
            else {
                if (rawData.playback_state !== "initializing" && rawData.playback_state !== 'deinitializing' && rawData.playback_state !== 'seeking') {
                    //////////////////////Media Name///////////////////////////////
                    if (typeof rawData.playback_url !== 'undefined') {
                        //this.platform.log('Playback url 1: ' + rawData.playback_url);
                        if (rawData.is_video === '1') {
                            // this.platform.log("Movie details")
                            let newNameInput = rawData.playback_url.split('/');
                            let nameInput = '';
                            let rightInputName = Object.values(newNameInput)[Object.keys(newNameInput).length - 1];
                            if (rightInputName === 'AVCHD') {
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

                                //this.platform.log('Playback url 13: ' + rawData.playback_caption);

                                if (rightInputName.includes('.')) {
                                    rightInputName = rightInputName.split('.');
                                    let nameInput = Object.values(rightInputName)[0];
                                    let i = 1;
                                    while (i < Object.keys(rightInputName).length - 2) {
                                        nameInput += " " + Object.values(rightInputName)[i];
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
                            // this.platform.log('Playback extra: ' + rawData.playback_extra_caption);
                            if (typeof rawData.playback_extra_caption !== 'undefined') {
                                if (rawData.playback_extra_caption.includes('.') || rawData.playback_extra_caption.includes('-')) {
                                    if (rawData.playback_extra_caption.includes('.')) {
                                        let newChapter = rawData.playback_extra_caption.split('.');
                                        let chapter = Object.values(newChapter)[0];
                                        if (chapter.startsWith('0')) {
                                            this.chapterTime = chapter.substring(1);
                                        }
                                    }
                                    if (rawData.playback_extra_caption.includes('-')) {
                                        let newChapter = rawData.playback_extra_caption.split('-');
                                        let chapter = Object.values(newChapter)[1];
                                        if (chapter.startsWith(' 0')) {
                                            this.chapterTime = chapter.substring(2);
                                        }
                                    }


                                    let newNameInput = rawData.playback_caption.split('of');
                                    let numberOfChapters = Object.values(newNameInput)[Object.keys(newNameInput).length - 1];
                                    numberOfChapters = numberOfChapters.replace(/[^0-9]/g, '');
                                    let currentChap = Object.values(newNameInput)[Object.keys(newNameInput).length - 2];
                                    currentChap = currentChap.split('(');
                                    currentChap = Object.values(currentChap)[Object.keys(currentChap).length - 1];
                                    currentChap = currentChap.replace(/[^0-9]/g, '');
                                    this.newCurrentChapter('Chapter ' + currentChap + '/' + numberOfChapters + ', Start Time: ' + this.chapterTime);
                                }
                                else {
                                    let newChapter = rawData.playback_extra_caption.split(' ');
                                    let chapter = Object.values(newChapter)[Object.keys(newChapter).length - 1];
                                    if (chapter.startsWith('0')) {
                                        chapter = chapter.substring(1);
                                        //this.chapterTime = chapter.substring(1);
                                    }
                                    if (typeof rawData.playback_caption !== 'undefined') {
                                        let newNameInput = rawData.playback_caption.split('of');
                                        let nameInput = Object.values(newNameInput)[Object.keys(newNameInput).length - 1];
                                        let numberOfChapters = nameInput.replace(/[^0-9]/g, '');
                                        this.newCurrentChapter(Object.values(newChapter)[0] + ' ' + chapter + '/' + numberOfChapters);
                                    }
                                    else {
                                        this.newCurrentChapter(rawData.playback_extra_caption);
                                    }
                                }

                            }
                        }
                        /////////////Song track name
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
                    this.movieRemaining = this.toInt(rawData.playback_duration, 0);
                    let runtimeNumber = this.secondsToTime(this.movieRemaining);
                    if (runtimeNumber.startsWith('0')) {
                        runtimeNumber = runtimeNumber.substring(1);
                    }
                    this.newInputDuration(runtimeNumber);
                    if (typeof rawData.playback_duration != 'undefined' && typeof rawData.playback_position != 'undefined') {
                        this.currentMoviePosition = this.toInt(rawData.playback_position, 0);
                        let movieElapsed1 = this.movieRemaining - this.currentMoviePosition
                        if (movieElapsed1 < 0) {
                            this.movieElapsed = 0;
                        }
                        else {
                            this.movieElapsed = movieElapsed1
                        }
                        //////////////////Media Current position
                        //this.platform.log('Playback position: ' + rawData.playback_position);
                        this.newMovieTime(this.currentMoviePosition);
                    }
                    ////////////////////Media Information////////////////////////////

                    let videoWitdth = this.toInt(rawData.playback_video_width, 0);
                    let videoHeight = this.toInt(rawData.playback_video_height, 0);
                    let currentBitrate = Math.round(this.toInt(rawData.playback_current_bitrate, 0) / 10000) / 100;
                    if (videoHeight >= 2160) {
                        this.newVideoInformation('4K Video (' + videoWitdth + 'x' + videoHeight + 'p) at ' + currentBitrate + 'Mbps')
                    }
                    else if (videoHeight > 1080) {
                        this.newVideoInformation('UHD Video (' + videoWitdth + 'x' + videoHeight + 'p) at ' + currentBitrate + ' Mbps')
                    }
                    else if (videoHeight === 1080) {
                        this.newVideoInformation('Full HD Video (' + videoWitdth + 'x' + videoHeight + 'p) at ' + currentBitrate + 'Mbps')
                    }
                    else if (videoHeight === 720) {
                        this.newVideoInformation('HD Video (' + videoWitdth + 'x' + videoHeight + 'p) at ' + currentBitrate + 'Mbps')
                    }
                    else {
                        this.newVideoInformation('SD Video (' + videoWitdth + 'x' + videoHeight + 'p) at ' + currentBitrate + 'Mbps')
                    }
                    ///////////////Audio format
                    //this.platform.log('Playback audio track: ' + rawData.audio_track);
                    if (typeof rawData['audio_track.' + rawData.audio_track + '.codec'] !== 'undefined') {
                        this.newAudioStatus(rawData['audio_track.' + rawData.audio_track + '.codec']);
                    }
                    //////////Audio Lnaguage

                    if (rawData.subtitles_track !== "-1" || typeof rawData['subtitles_track.' + rawData.subtitles_track + '.lang'] !== 'undefined') {
                        this.subtitleLanguage = this.newLanguageSelector(rawData['subtitles_track.' + rawData.subtitles_track + '.lang']);
                    }
                    if (typeof rawData['audio_track.' + rawData.audio_track + '.lang'] !== 'undefined') {
                        if (this.subtitleLanguage !== '') {
                            this.newLanguage('Audio: ' + this.newLanguageSelector(rawData['audio_track.' + rawData.audio_track + '.lang']) + ' (Subtitles in ' + this.subtitleLanguage + ')');
                        }
                        else {
                            this.newLanguage('Audio: ' + this.newLanguageSelector(rawData['audio_track.' + rawData.audio_track + '.lang']));
                        }
                    }
                }
                else {
                }
            }
            if (this.playBackState[0] === false && this.playBackState[1] === false && this.playBackState[2] === false) {
                if (this.counter > 2) {
                    this.mediaDetailsReset();
                    this.counter = 0;
                }
                this.counter += 1
            }
            else {

            }
        }
    }

    mediaDetailsReset() {
        // this.platform.log("Reset details");
        this.newInputState(1);
        this.showState = false;
        this.movieRemaining = 0;
        this.movieElapsed = 0;
        this.currentMoviePosition = 0;
        this.bluryaDVD = false;
        this.subtitleLanguage = '';
        this.newMovieTime(0);

        if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== 'Media Title' && !this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value.includes('Last Played: ') && this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== 'Standby') {
            this.newInputName('Last Played: ' + this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value);
        }
        //this.newAudioFormat('Audio Format');
        //this.newInputDuration('Runtime');
        //this.newVideoInformation('Video Information');
        //this.newCurrentChapter('Current Chapter');
        //this.newLanguage('Audio Language');
    }

    newAudioFormat(audioType) {
        if (typeof audioType !== 'undefined') {
            this.platform.log.debug('New audio format: ' + audioType);
            if (this.mediaAudioFormat !== audioType) {
                this.mediaAudioFormat = audioType;
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaAudioFormat);
                //this.audioFormat.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaAudioFormat);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.audioFormat.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }

    newAudioStatus(audio) {
        if (typeof audio !== 'string' || audio.length === 0) {
            this.newAudioFormat('Unknown');
            return;
        }
        this.platform.log.debug(audio);
        let newAudio = '';
        if (audio.includes('Digital Plus')) {
            newAudio = 'Dolby Digital Plus - Atmos';
        }
        else if (audio.includes('Dolby Digital')) {
            newAudio = 'Dolby Digital';
        }
        else if (audio.includes('TrueHD')) {
            newAudio = 'Dolby TrueHD - Atmos';
        }
        else if (audio.includes('DTS-HD High') || audio.includes('DTS HD High')) {
            newAudio = 'DTS-HD High Resolution';
        }
        else if (audio.includes('DTS HD Master') || audio.includes('DTS HD MA')) {
            newAudio = 'DTS HD MA - DTS X';
        }
        else if (audio.includes('DTS')) {
            newAudio = 'DTS';
        }
        else if (audio.includes('LPCM')) {
            newAudio = 'LPCM';
        }
        else if (audio.includes('MPEG')) {
            newAudio = 'MPEG Audio';

        }
        else if (audio.includes('CD Audio')) {
            newAudio = 'CD Audio';

        }
        else {
            newAudio = audio;

        }
        this.newAudioFormat(newAudio);
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
                //this.currentChaper.getCharacteristic(this.platform.Characteristic.ConfiguredName).updateValue(this.mediaChapter);
                this.currentChaper.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.currentChaper.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }
    }

    newInputDuration(newDuration) {
        if (typeof newDuration !== 'undefined' && newDuration !== null) {
            const runtimeText = String(newDuration);
            this.platform.log.debug('New input duration: ' + runtimeText);
            if (!runtimeText.includes('Runtime')) {
                let hourMintue = ''
                if (this.movieRemaining > 3600) {
                    hourMintue = 'Hours';
                }
                else if (this.movieRemaining == 3600) {
                    hourMintue = 'Hour';
                }
                else {
                    hourMintue = 'Minutes';
                }
                this.mediaDuration = 'Runtime: ' + runtimeText + ' ' + hourMintue;
            }
            else {
                this.mediaDuration = runtimeText;
            }
            if (this.runtime.getCharacteristic(this.platform.Characteristic.ConfiguredName).value !== this.mediaDuration) {
                this.runtime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaDuration)
            }
        }
    }

    newInputName(newName) {
        if (typeof newName === 'string' && newName.length > 0) {
            if (/\.(iso|mkv|mp4|mp3)$/i.test(newName)) {
                newName = newName.slice(0, -4);
            }
            if (newName.length >= 64) {
                newName = newName.slice(0, 60) + "...";
            }
            this.platform.log.debug('New input name: ' + newName);
            if (this.inputName !== newName) {
                this.inputName = newName;
                this.platform.log.debug(this.inputName);
                this.videoAudioTitle.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.inputName);
            }
        }

    }

    newInputState(newInput) {
        this.inputID = newInput;
        this.tvService.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.inputID);
        // this.tvService.getCharacteristic(this.platform.Characteristic.ActiveIdentifier).updateValue(this.inputID);
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

    newLanguageSelector(langSelector) {
        if (typeof langSelector !== 'string' || langSelector.length === 0) {
            return 'Language Undefined';
        }
        langSelector = langSelector.toLowerCase();
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
        else if (langSelector.includes('chi') || langSelector.includes('zho')) {
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
            correctLanguage = 'Egyptian';
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
            correctLanguage = 'Croatian';
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
            correctLanguage = 'Korean';
        }
        else if (langSelector.includes('peo') || langSelector.includes('per')) {
            correctLanguage = 'Persian';
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
            correctLanguage = 'Language Undefined';
        }
        return correctLanguage;

    }

    newMovieTime(newMovieTime) {
        if (this.showState === true || newMovieTime === 0 || this.bluryaDVD === true) {
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
                if (this.config.changeDimmersToFan === false) {
                    if (this.movieControlL.getCharacteristic(this.platform.Characteristic.Brightness).value !== this.currentMovieProgress) {
                        this.movieControlL.updateCharacteristic(this.platform.Characteristic.Brightness, this.currentMovieProgress);
                        // this.movieControlL.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(this.currentMovieProgress);
                        this.movieControlL.updateCharacteristic(this.platform.Characteristic.On, this.currentMovieProgressState);
                        //this.movieControlL.getCharacteristic(this.platform.Characteristic.On).updateValue(this.currentMovieProgressState);
                    }
                }
                else {
                    if (this.movieControlF.getCharacteristic(this.platform.Characteristic.RotationSpeed).value !== this.currentMovieProgress) {
                        this.movieControlF.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.currentMovieProgress);
                        // this.movieControlF.getCharacteristic(this.platform.Characteristic.RotationSpeed).updateValue(this.currentMovieProgress);
                        this.movieControlF.updateCharacteristic(this.platform.Characteristic.Active, this.currentMovieProgressState === true ? 1 : 0);
                        //this.movieControlF.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.currentMovieProgressState === true ? 1 : 0);
                    }
                }
            }
            if (this.config.remainMovieTimer) {
                const targetMovieTimerActiveState = this.currentMovieProgressState ? 1 : 0;
                if (this.movieTimer.getCharacteristic(this.platform.Characteristic.Active).value !== targetMovieTimerActiveState) {
                    this.movieTimer.updateCharacteristic(this.platform.Characteristic.Active, targetMovieTimerActiveState);
                    this.movieTimer.updateCharacteristic(this.platform.Characteristic.InUse, targetMovieTimerActiveState);
                }
                if (this.movieElapsed !== this.movieTimer.getCharacteristic(this.platform.Characteristic.RemainingDuration).value) {
                    this.movieTimer.updateCharacteristic(this.platform.Characteristic.RemainingDuration, this.movieElapsed);
                }
                if (this.movieRemaining !== this.movieTimer.getCharacteristic(this.platform.Characteristic.SetDuration).value) {
                    this.movieTimer.updateCharacteristic(this.platform.Characteristic.SetDuration, this.movieRemaining);
                }
            }
        }
    }

    newPlayBackState(newPlay) {
        this.playBackState = newPlay;
        if (this.turnOffCommand === false || (this.playBackState[0] === false && this.playBackState[1] === false && this.playBackState[2] === false)) {
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
                // this.play.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[0]);
                //this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
            }
            if (this.pause.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[1]) {
                this.pause.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[1]);
                // this.pause.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[1]);
                // this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
            }
            if (this.stop.getCharacteristic(this.platform.Characteristic.On).value !== this.playBackState[2]) {
                this.stop.updateCharacteristic(this.platform.Characteristic.On, this.playBackState[2]);
                //this.stop.getCharacteristic(this.platform.Characteristic.On).updateValue(this.playBackState[2]);
                //  this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                //this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
            }
            if (this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).value !== this.mediaState) {
                this.tvService.updateCharacteristic(this.platform.Characteristic.CurrentMediaState, this.mediaState);
                // this.tvService.getCharacteristic(this.platform.Characteristic.CurrentMediaState).updateValue(this.mediaState);
            }
        }
    }

    newPowerState(newValue) {
        if (this.turnOffCommand === false && this.turnOnCommand === false) {
            if (newValue === true) {
                this.powerStateTV = 1;
                if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value === 'Media Title') {
                    this.newInputName('Standby');
                }
            }
            else {
                this.powerStateTV = 0;
                if (this.videoAudioTitle.getCharacteristic(this.platform.Characteristic.ConfiguredName).value === 'Standby') {
                    this.newInputName('Media Title');
                }
            }
            if (this.powerState !== newValue) {
                this.powerState = newValue;
                this.tvService.updateCharacteristic(this.platform.Characteristic.Active, this.powerStateTV);
                //this.tvService.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.powerStateTV);
                if (this.config.powerB === true) {
                    this.service.updateCharacteristic(this.platform.Characteristic.On, this.powerState);
                    //this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.powerState);
                }
            }
        }
    }

    newVideoInformation(videoFormat) {
        if (typeof videoFormat !== 'undefined') {
            this.platform.log.debug(videoFormat);
            if (this.mediaInformation !== videoFormat) {
                this.mediaInformation = videoFormat;
                this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.ConfiguredName, this.mediaInformation);
                this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.TargetVisibilityState, this.showState ? this.platform.Characteristic.TargetVisibilityState.SHOWN : this.platform.Characteristic.TargetVisibilityState.HIDDEN);
                this.videoAudioElapseTime.updateCharacteristic(this.platform.Characteristic.CurrentVisibilityState, this.showState ? this.platform.Characteristic.CurrentVisibilityState.SHOWN : this.platform.Characteristic.CurrentVisibilityState.HIDDEN);
            }
        }

    }

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
                // this.speakerService.getCharacteristic(this.platform.Characteristic.Volume).updateValue(this.currentVolume);
                // this.speakerService.getCharacteristic(this.platform.Characteristic.Mute).updateValue(this.currentMuteState)
                if (this.config.volume === true) {
                    if (this.config.changeDimmersToFan === false) {
                        this.volumeDimmer.updateCharacteristic(this.platform.Characteristic.Brightness, this.currentVolume);
                        //this.volumeDimmer.getCharacteristic(this.platform.Characteristic.Brightness).updateValue(this.currentVolume);
                        this.volumeDimmer.updateCharacteristic(this.platform.Characteristic.On, this.currentVolumeSwitch);
                        //this.volumeDimmer.getCharacteristic(this.platform.Characteristic.On).updateValue(this.currentVolumeSwitch);
                    }
                    else {
                        this.volumeFan.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.currentVolume);
                        // this.volumeFan.getCharacteristic(this.platform.Characteristic.RotationSpeed).updateValue(this.currentVolume);
                        this.volumeFan.updateCharacteristic(this.platform.Characteristic.Active, this.currentVolumeSwitch === true ? 1 : 0);
                        // this.volumeFan.getCharacteristic(this.platform.Characteristic.Active).updateValue(this.currentVolumeSwitch === true ? 1 : 0);
                    }
                }
            }
        }
    }

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

    pressedButton(name) {
        const baseUrl = "http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=ir_code&ir_code=";
        const irCode = BUTTON_IR_CODE_MAP[name];
        if (typeof irCode === 'undefined') {
            this.platform.log.debug('Unknown button name:', name);
            return null;
        }
        return baseUrl + irCode + 'BF00&result_syntax=json';
    }

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

    safeRemoveService(service) {
        if (!service) {
            return;
        }
        try {
            this.accessory.removeService(service);
        }
        catch (error) {
            this.platform.log.debug('Skipping service removal:', error.message);
        }
    }

    secondsToTime(seconds) {
        let date = new Date(0);
        date.setSeconds(this.toInt(seconds, 0)); // specify value for SECONDS here
        let timeString = date.toISOString().substr(11, 8);
        return timeString
    }

    sending(url) {
        this.platform.log.debug(url);
        if (!Array.isArray(url) || url.length === 0 || typeof url[0] !== 'string') {
            this.platform.log.debug('Skipping send because URL payload is invalid.');
            return;
        }
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
        const isPollRequest = key === 'getDeviceInfo';
        if (isPollRequest === true && this.pollInFlight === true) {
            return;
        }
        if (isPollRequest === true) {
            this.pollInFlight = true;
        }
        const finishRequest = () => {
            if (isPollRequest === true) {
                this.pollInFlight = false;
            }
        };
        this.platform.log.debug(url);
        this.platform.log.debug(key);
        this.httpNotResponding += 1;
        const req = request.get(url, (res) => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                this.platform.log.debug('HTTP status error from Dune HD:', res.statusCode);
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    if (!rawData || rawData.trim().length === 0) {
                        return;
                    }
                    let parsedData = JSON.parse(rawData);
                    this.httpNotResponding = 0;
                    this.httpEventDecoder(parsedData, key);
                } catch (e) {
                    this.platform.log.debug('Invalid JSON response from Dune HD:', e.message);
                }
                finally {
                    finishRequest();
                }
            });
        });
        req.setTimeout(5000, () => {
            this.platform.log.debug('HTTP request timed out for key:', key);
            finishRequest();
            req.destroy(new Error('Request timeout'));
        });
        req.on('error', (e) => {
            finishRequest();
            this.platform.log.debug('HTTP request failed:', e.message);
        });
    }

    setMovieSeekPositionFromPercent(newValue) {
        let newSendValue = Math.round(newValue * this.movieRemaining / 100);
        if (newSendValue > this.movieRemaining) {
            newSendValue = this.movieRemaining;
        }
        this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=set_playback_state&position=" + newSendValue + "&result_syntax=json"]);
        this.newMovieTime(newSendValue);
    }

    setOn(value, callback) {
        let duneHDState = value;
        if (duneHDState === true) {
            this.newPowerState(true);
            this.turnOnCommand = true;
            this.turnOffCommand = false;
            this.sending([this.pressedButton('POWER ON')]);
        }
        else {
            this.sending([this.pressedButton('STOP')]);
            this.turnOffAll();
            this.newPowerState(false);
            this.turnOffCommand = true;
            this.turnOnCommand = false;
            setTimeout(() => {
                this.sending([this.pressedButton('POWER OFF')]);
            }, 1000);
            //this.sending(["http://" + this.DUNEHD_IP + ":" + this.DUNEHD_PORT + "/cgi-bin/do?cmd=standby&result_syntax=json"]);
            //this.sending([this.pressedButton('POWER OFF')]);
        }
        this.platform.log.debug('Set Power to ->', value);
        callback(null);
    }

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

    time() {
        let time = new Date();
        return time.toLocaleDateString() + ' ' + time.toLocaleString('en-US', {
            hour12: false,
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
        });
    }

    toInt(value, fallback = 0) {
        const parsedValue = Number.parseInt(value, 10);
        return Number.isFinite(parsedValue) ? parsedValue : fallback;
    }

    turnOffAll() {
        this.newPowerState(false);
        this.newPlayBackState([false, false, false]);
        this.newVolumeStatus(0);
        this.mediaDetailsReset();
        //this.platform.log(this.accessory.services)
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
