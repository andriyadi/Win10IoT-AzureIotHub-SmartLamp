// Copyright (c) DycodeX. All rights reserved.
// Author: Andri Yadi

'use strict';

//var uwp = require("uwp");
//uwp.projectNamespace("Windows");

var Switch = function (gpioPinNo) {
    
    var gpioCtrl = Windows.Devices.Gpio.GpioController.getDefault();

    this.switchGpioPin = gpioCtrl.openPin(gpioPinNo);   
    this.switchGpioPin.setDriveMode(Windows.Devices.Gpio.GpioPinDriveMode.output);
    
    this.currentGpioValue = Windows.Devices.Gpio.GpioPinValue.low;
    this.switchGpioPin.write(this.currentGpioValue);
};

Switch.prototype.isOn = function () {
    return (this.currentGpioValue == Windows.Devices.Gpio.GpioPinValue.high);
}

Switch.prototype.switchOn = function () {
    this.currentGpioValue = Windows.Devices.Gpio.GpioPinValue.high;
    this.switchGpioPin.write(this.currentGpioValue);
};

Switch.prototype.switchOff = function () {
    this.currentGpioValue = Windows.Devices.Gpio.GpioPinValue.low;
    this.switchGpioPin.write(this.currentGpioValue);
};

Switch.prototype.toggle = function () {
    if (this.currentGpioValue == Windows.Devices.Gpio.GpioPinValue.high) {
        this.switchOff();
    } else {
        this.switchOn();
    }
};

//uwp.close();

module.exports = Switch;
