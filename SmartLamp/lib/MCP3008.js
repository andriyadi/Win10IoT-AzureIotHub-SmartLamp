// Copyright (c) DycodeX. All rights reserved.
// Author: Andri Yadi

'use strict';

var MCP3008 = function () {
    this._mcp3008 = undefined;
};

MCP3008.prototype.begin = function(cb) {
    var spiSettings = Windows.Devices.Spi.SpiConnectionSettings(0);
    spiSettings.clockFrequency = 3600000; //3.6 MHz
    spiSettings.mode = Windows.Devices.Spi.SpiMode.mode3;
    
    var spiQuery = Windows.Devices.Spi.SpiDevice.getDeviceSelector("SPI0");
    
    var self = this;
    
    //Make sure to put second argument to call findAllAsync(spiQuery, null) method --> second argument should be null
    Windows.Devices.Enumeration.DeviceInformation.findAllAsync(spiQuery, null).done(function (devices) {
        if (devices != null && devices.length > 0) {
            Windows.Devices.Spi.SpiDevice.fromIdAsync(devices[0].id, spiSettings).done(function (device) {
                if (device != null) {
                    self._mcp3008 = device;
                    cb(null);
                }
                else {
                    cb(new Error("SPI Device Not Found :-("));
                }
            });
        } else {
            console.log("SPI Device Not Found :-(");

            cb(new Error("SPI Device Not Found :-("));
        }
    });
};

MCP3008.prototype.read = function(channel) {
    
    if (!this._mcp3008) {
        return null;
    }
    
    var channelBit = 8 + channel << 4;
    
    var transmitBuffer = [1, channelBit, 0];
    var receiveBuffer = [0, 0, 0];
    
    this._mcp3008.transferFullDuplex(transmitBuffer, receiveBuffer);

    //first byte returned is 0 (00000000), 
    //second byte returned we are only interested in the last 2 bits 00000011 (mask of &3) 
    //then shift result 8 bits to make room for the data from the 3rd byte (makes 10 bits total)
    //third byte, need all bits, simply add it to the above result 
    var result = ((receiveBuffer[1] & 3) << 8) + receiveBuffer[2];
    
    return result;
}

module.exports = MCP3008;
