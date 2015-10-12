//var http = require('http');
var express = require("express")
    , app = express()
    , SmartLamp = require("./lib/SmartLamp")
    , MCP3008 = require("./lib/MCP3008")

var uwp = require("uwp");
uwp.projectNamespace("Windows");

var lamp = new SmartLamp(5, "smartlamp1");
var adc = new MCP3008();

adc.begin(function (err) {
    if (!err) {
        readAdcZero();
    }
});

var currentReadAdcZero = 0;

function readAdcZero() {
    var total = 0;
    var count = 1024;
    for (var i = 0; i < count; i++) {
        total += adc.read(0);
    }
    
    currentReadAdcZero = total * 1.0 / count;
    console.log(currentReadAdcZero);
}

function readCurrentSensor(channel) {
    
    //var adc = readAdc(channel);
    //var mA = (3.4 / 189.44) * (adc - adcZero) * 1000;
    //return mA;

    var CS_READ_SAMPLE_NUM = 255;

    var currentTotal = 0;
    for (var i = 0; i < CS_READ_SAMPLE_NUM; i++) {
        var readCS = adc.read(channel) - currentReadAdcZero;
        currentTotal += (readCS * readCS);
    }
    
    var rmsCS = (Math.sqrt(1.0 * currentTotal / CS_READ_SAMPLE_NUM) - 1.7543) / 0.259;
    return rmsCS;
}

app.get("/", function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send('Hello there. Nothing here...');
});

app.get("/toggle", function (req, res) {
    //if (currentValue == Windows.Devices.Gpio.GpioPinValue.high) {
    //    currentValue = Windows.Devices.Gpio.GpioPinValue.low;
    //} else {
    //    currentValue = Windows.Devices.Gpio.GpioPinValue.high;
    //}
    //switchPin.write(currentValue);
    
    lamp.toggle();

    res.set('Content-Type', 'text/plain');
    res.send('Switch value: ' + lamp.isOn() + '\n');
});

app.get("/adc", function (req, res) {
    var channel = req.query.channel || 0;

    var curVal = adc.read(channel);
    res.json({ channel: 0, value: curVal });
});

app.get("/sensor/current", function (req, res) {
    var curVal = readCurrentSensor(0);
    res.json({ value: curVal });
});

var server = app.listen(1337, function () {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('Listening at http://%s:%s', host, port);
});


//Azure IoT Hub related

var iothub = require('./lib/iothub');
var iothubDev = require("azure-iot-device");

var iothubConnString = "HostName=dycode-iot.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=0x6guyDTwTWKbbbVxNT6d/kxPRIoLZf5jryvoK79EpU=";
var iothubRegistry = new iothub.Registry(iothubConnString, new iothub.Https());

var iothubClient;

//first, check if device is register
iothubRegistry.get(lamp.deviceId, function (err, res, obj) {
    if (obj) {
        console.log(obj);
        deviceIsReady(obj);
    }
    else {
        //register new device
        var newDev = new iothub.Device(null);
        newDev.deviceId = lamp.deviceId;
        iothubRegistry.create(newDev, function (err, res, msg) {
            if (!err) {
                iothubRegistry.get(lamp.deviceId, function (err, res, obj) {
                    if (obj) {
                        console.log(obj);
                        deviceIsReady(obj);
                    }
                });
            }
        });
    }
});

function deviceIsReady(dev) {
    lamp.setIotHubDevice(dev);
    
    if (!dev.authentication || !dev.authentication.SymmetricKey) {
        return;
    }

    //create conn string
    var connStr = "HostName=" + iothubRegistry.config.host + ";CredentialScope=Device;DeviceId=" + dev.deviceId + ";SharedAccessKey=" + dev.authentication.SymmetricKey.primaryKey;
    lamp.setIotHubConnectionString(connStr);
    
    //set client
    
    iothubClient = new iothubDev.Client(connStr, new iothub.Https());
    
    //register metadata first
    var metadataMsg = new iothubDev.Message(JSON.stringify(lamp.getMetadata()));
    iothubClient.sendEvent(metadataMsg, printResultFor('send'));
    
    // start telemetry data send routing
    setInterval(sendTelemetryData, 5000);

    //listen for notif
    setInterval(function () { if (!isWaiting) waitForNotifications(); }, 200);
}

// function to send telemetry data
function sendTelemetryData() {
    
    if (!iothubClient) {
        return;
    }

    var currentMA = readCurrentSensor(0);
    var wattage = 220 * currentMA * 1.0 / 1000;

    var data = JSON.stringify({ "DeviceID": lamp.deviceId, "Wattage": wattage });
    console.log("Sending device telemetry data:\n" + data);

    iothubClient.sendEvent(new iothubDev.Message(data), printResultFor('send'));
}

// function to wait on notifications
var isWaiting = false;
function waitForNotifications() {
    if (!iothubClient) {
        return;
    }

    isWaiting = true;
    iothubClient.receive(function (err, res, msg) {
        printResultFor('receive')(err, res);
        if (!err && res.statusCode !== 204) {
            console.log('receive data: ' + msg.getData());
            try {
                var msgData = msg.getData();
                var command = JSON.parse(msgData);
                if (command.Name === "SetState") {
                    var state = command.Parameters.State;
                    
                    //do command
                    if (state == 1) {
                        lamp.switchOn();
                    }
                    else {
                        lamp.switchOff();
                    }
                }
            }
            catch (e) {

            }

            iothubClient.complete(msg, printResultFor('complete'));
        }
        isWaiting = false;
    });
}

// Helper function to print results for an operation
function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.statusCode + ' ' + res.statusMessage);
    };
}

uwp.close();