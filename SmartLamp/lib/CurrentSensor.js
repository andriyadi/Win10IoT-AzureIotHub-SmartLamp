'use strict';

var MCP3008 = require('./MCP3008.js');

var CurrentSensor = function (adcChannel) {
    this.adc = new MCP3008();

    this.adcChannel = adcChannel;
    this.currentReadAdcZero = 0;
    
    var self = this;
    this.adc.begin(function (err) {
        if (!err) {
            self._readAdcZero();
        }
    });
};

CurrentSensor.prototype = {
    //Function to get average reading when lamp is not switched on --> zero current
    _readAdcZero: function () {
        
        var total = 0;
        var count = 1024;
        for (var i = 0; i < count; i++) {
            total += this.adc.read(this.adcChannel);
        }
        
        this.currentReadAdcZero = total * 1.0 / count;
        console.log(this.currentReadAdcZero);
    }
}

CurrentSensor.prototype.readCurrent = function() {
    
    var analogReadAmplitude = 0, min = this.currentReadAdcZero, max = this.currentReadAdcZero, filter = 4;
    var hz = 50;
    var sensitivity = 185; //185 mv/A
    
    var start = Date.now();
    do {
        var val = 0;
        for (var i = 0; i < filter; i++) {
            val += this.adc.read(this.adcChannel);
        }
        
        val = (val / filter);     // fine tuning of 0A AC reading! 512 = 0V
        if (max < val) max = val;
        if (val < min) min = val;

    } while (Date.now() - start <= 1100 / hz);     //10% + to ensure p2p is acquired
    
    analogReadAmplitude = (max - min) / 2;
    
    // should be around 3300
    var internalVcc = 1642*2;
    //var internalVcc = (Math.round(this.currentReadAdcZero) / 1024) * 3300 * 2;
    
    // (analogReadAmplitude/2) * internalVcc / 1024               -> 0: 0               1024: 3300
    var sensedVoltage = (analogReadAmplitude * internalVcc) / (Math.round(this.currentReadAdcZero * 2));//1024;
    
    var sensedCurrent = sensedVoltage / sensitivity;
    
    //var analogRead = wpi.analogRead(200 + channel);
    //mA = ((analogRead * (1687*2) / 1024) - 1687 ) / 187;
    
    return sensedCurrent;
}

module.exports = CurrentSensor;