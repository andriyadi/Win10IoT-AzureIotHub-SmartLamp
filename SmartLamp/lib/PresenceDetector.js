'use strict';

/*
class PresenceDetector {
    constructor(pirPin) {

        this.listeners = new Map();   

        var gpio = Windows.Devices.Gpio.GpioController.getDefault();
        this.gpioPin = gpio.openPin(pirPin); 
        this.gpioPin.debounceTimeout = 50;
        this.gpioPin.setDriveMode(Windows.Devices.Gpio.GpioPinDriveMode.input);

        this.gpioPin.addEventListener("valuechanged", function (eventArgs) {
            
            var gpioPinValue = pirPin.read();
            if (gpioPinValue == Windows.Devices.Gpio.GpioPinValue.high) {
                console.log("Motion detected");
                lamp.switchOn();
            }
            else {
                console.log("Motion undetected");
                lamp.switchOff();
            }



            if (eventArgs.edge == Windows.Devices.Gpio.GpioPinEdge.risingEdge) {
                console.log("Motion detected");
                emit("presence");
            }
            else if (eventArgs.edge == Windows.Devices.Gpio.GpioPinEdge.fallingEdge) {
                console.log("Motion undetected");
                emit("unpresence");
            }
        });      
    }

    onPresenceDetected(callback) {
        this.listeners.has("presence") || this.listeners.set("presence", []);
        this.listeners.get("presence").push(callback);
    }

    onPresenceUndetected(callback) {
        this.listeners.has("unpresence") || this.listeners.set("unpresence", []);
        this.listeners.get("unpresence").push(callback);
    }

    emit(label, ...args) {
        let listeners = this.listeners.get(label);

        if (listeners && listeners.length) {
            listeners.forEach((listener) => {
                listener(...args);
            });
            return true;
        }
        return false;
    }
}
 
//module.exports = PresenceDetector;
export { PresenceDetector }

*/


var PresenceDetector = function(pirPin) {

    this._listeners = {};   

    var gpio = Windows.Devices.Gpio.GpioController.getDefault();
    this.gpioPin = gpio.openPin(pirPin); 
    this.gpioPin.debounceTimeout = 50;
    this.gpioPin.setDriveMode(Windows.Devices.Gpio.GpioPinDriveMode.input);

    var self = this;
    this.gpioPin.addEventListener("valuechanged", function (eventArgs) {            
        if (eventArgs.edge == Windows.Devices.Gpio.GpioPinEdge.risingEdge) {
            console.log("Motion detected");
            self._emit("presence");
        }
        else if (eventArgs.edge == Windows.Devices.Gpio.GpioPinEdge.fallingEdge) {
            console.log("Motion undetected");
            self._emit("unpresence");
        }
    });     

    // I don't know why the heck I should call read() so that the interrupt will run
    setInterval(function () {
        var gpioPinValue = self.gpioPin.read();
    }, 1000); 

    //this.presenceDetected = false;
    //setInterval(function () {
    //    var gpioPinValue = self.gpioPin.read();
    //    if (gpioPinValue == Windows.Devices.Gpio.GpioPinValue.high && !self.presenceDetected) {
    //        console.log("Motion detected");
    //        self._emit("presence");

    //        self.presenceDetected = true;
    //    }
    //    else {
    //        console.log("Motion undetected");
    //        self._emit("unpresence");

    //        self.presenceDetected = false;
    //    }
    //}, 500);   
    
};

PresenceDetector.prototype = {
    _addListener: function(eventType, callback) {
        if(typeof callback != "function") {
            throw new TypeError();
        }

        var listeners = this._listeners[eventType] || (this._listeners[eventType] = []);
        if(listeners.indexOf(callback) != -1) {
            return this;
        }

        listeners.push(callback);
    },
    _emit: function(label, args) {

        var listeners = this._listeners[label];

        if(!listeners || !listeners.length) {
          return false;
        }
        listeners.forEach(function(fn) {
            fn.apply(null, args);
        });

        return true;
    }
};

PresenceDetector.prototype.onPresenceDetected = function(callback) {
    this._addListener("presence", callback);
};

PresenceDetector.prototype.onPresenceUndetected = function(callback) {
    this._addListener("unpresence", callback);
};

module.exports = PresenceDetector;