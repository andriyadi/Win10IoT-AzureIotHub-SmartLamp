// Copyright (c) DycodeX. All rights reserved.
// Author: Andri Yadi

'use strict';

var ADC = function (adcType) {
    this._adcDevice = undefined;
    this._adcType = adcType || ADC.AdcType.MCP3008;
};

ADC.AdcType = {
    MCP3008: 0,
    MCP3208: 1
};

ADC.prototype.begin = function(cb) {
    var spiSettings = Windows.Devices.Spi.SpiConnectionSettings(0);
    spiSettings.clockFrequency = 3600000; //3.6 MHz
    spiSettings.mode = Windows.Devices.Spi.SpiMode.mode3;
    
    var spiQuery = Windows.Devices.Spi.SpiDevice.getDeviceSelector("SPI0");
    
    var self = this;
    
    //Make sure to put second argument to call findAllAsync(spiQuery, null) method --> second argument should be null
    Windows.Devices.Enumeration.DeviceInformation.findAllAsync(spiQuery, null).done(function (devices) {
        console.log(devices);
        if (devices != null && devices.length > 0) {
            Windows.Devices.Spi.SpiDevice.fromIdAsync(devices[0].id, spiSettings).done(function (device) {
                if (device != null) {
                    self._adcDevice = device;
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

ADC.prototype.read = function(channel) {
    
    if (!this._adcDevice) {
        return null;
    }
    
    var receiveBuffer = [0, 0, 0];
    var transmitBuffer = [0, 0, 0];
    
    if (this._adcType == ADC.AdcType.MCP3008) {
        var channelBit = 8 + channel << 4;
        transmitBuffer = [1, channelBit, 0];
    }
    else if (this._adcType == ADC.AdcType.MCP3208) {        
        transmitBuffer[0] = 0x06 | ((channel & 0x07) >> 7);
        transmitBuffer[1] = ((channel & 0x07) << 6);
        transmitBuffer[2] = 0x00;
    }
    
    this._adcDevice.transferFullDuplex(transmitBuffer, receiveBuffer);

   
    if (this._adcType == ADC.AdcType.MCP3008) {
        
        //first byte returned is 0 (00000000), 
        //second byte returned we are only interested in the last 2 bits 00000011 (mask of &3) 
        //then shift result 8 bits to make room for the data from the 3rd byte (makes 10 bits total)
        //third byte, need all bits, simply add it to the above result 

        var result = ((receiveBuffer[1] & 3) << 8) + receiveBuffer[2];        
        return result;
    }
    else if (this._adcType == ADC.AdcType.MCP3208) {
        //console.log(receiveBuffer);
        var result = ((receiveBuffer[1] & 0x0F) << 8) + receiveBuffer[2];
        return result;
    }
}

module.exports = ADC;
