'use strict';

var util = require('util');
var Switch = require('./Switch');

var SmartLamp = function (gpioPinNo, deviceId) {
    Switch.apply(this, arguments);

    this.deviceId = deviceId;
    this.iotHubDevice = undefined;
}

util.inherits(SmartLamp, Switch);

SmartLamp.prototype.setIotHubDevice = function (dev) {
    this.iotHubDevice = dev;
};

SmartLamp.prototype.setIotHubConnectionString = function (str) {
    this.iotHubConnectionString = str;
};

SmartLamp.prototype.getMetadata = function () {
    this.metadata = {
        "ObjectType": "DeviceInfo",
        "IsSimulatedDevice": 0,
        "Version": "1.0",
        "DeviceProperties": {
            "DeviceID": this.deviceId,
            "Name": "Smart Lamp",
            "Types": ["SmartLamp", "Switch"],
            "HubEnabledState": 1,
            "CreatedTime": "2015-10-13T20:28:55.5448990Z",
            "DeviceState": "normal",
            "UpdatedTime": null,
            "Manufacturer": "DycodeX",
            "ModelNumber": "SL-909",
            "SerialNumber": "SER9090",
            "FirmwareVersion": "1.10",
            "Platform": "node.js",
            "Processor": "ARM",
            "Latitude": 47.617025,
            "Longitude": -122.191285
        },
        "Commands": [
            { "Name": "SetState", "Parameters": [{ "Name": "State", "Type": "boolean" }] }
        ]
    };

    return this.metadata;
}

module.exports = SmartLamp;
