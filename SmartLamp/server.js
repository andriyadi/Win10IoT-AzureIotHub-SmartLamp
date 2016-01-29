//var http = require('http');
var express = require("express")
    , app = express()
    , SmartLamp = require("./lib/SmartLamp")
//, MCP3008 = require("./lib/MCP3008")
    , CurrentSensor = require("./lib/CurrentSensor.js")
    , PresenceDetector = require("./lib/PresenceDetector")

var uwp = require("uwp");
uwp.projectNamespace("Windows");

//Lamp that can be switch-on/off using GPIO 5
var lamp = new SmartLamp(5, "smartlamp1");

//Current sensor using ADC MCP3008 channel 0
var cs = new CurrentSensor(0);

//Web camera 
var Camera = require("./lib/Camera");
var cam = new Camera("SmartHomeCapture.jpg", function (err) {
    if (err) {
        console.error(err);
    }
});

var USE_LIGHT_SENSOR = true;
var USE_SOUND_SENSOR = true;

/*
var gpio = Windows.Devices.Gpio.GpioController.getDefault();
var pirPin = gpio.openPin(12);
//pirPin.debounceTimeout = 50;
pirPin.setDriveMode(Windows.Devices.Gpio.GpioPinDriveMode.input);
//pirPin.write(Windows.Devices.Gpio.GpioPinValue.low);

pirPin.addEventListener("valuechanged", function (eventArgs) {
    
    //var gpioPinValue = pirPin.read();
    //if (gpioPinValue == Windows.Devices.Gpio.GpioPinValue.high) {
    //    console.log("Motion detected");
    //    lamp.switchOn();
    //}
    //else {
    //    console.log("Motion undetected");
    //    lamp.switchOff();
    //}

    if (eventArgs.edge == Windows.Devices.Gpio.GpioPinEdge.risingEdge) {
        console.log("Motion detected");
        lamp.switchOn();
    }
    else if (eventArgs.edge == Windows.Devices.Gpio.GpioPinEdge.fallingEdge) {
        console.log("Motion undetected");
        lamp.switchOff();
    }
    //console.log("ooooo");
});
*/

//setInterval(function () {
//    var gpioPinValue = pirPin.read();
//    if (gpioPinValue == Windows.Devices.Gpio.GpioPinValue.high) {
//        console.log("Motion detected");
//        lamp.switchOn();
//    }
//    else {
//        console.log("Motion undetected");
//        lamp.switchOff();
//    }
//}, 500);


/*
Part of code that's responsible for uploading captured photo's binary to Azure Blob Storage
*/
var azure = require('azure-storage');
var storageAccountName = "[YOUR_STORAGE_ACCOUNT_NAME]";
var storageAccountKey = "[YOUR_STORAGE_ACCOUNT_KEY]";

var blobSvc = azure.createBlobService(storageAccountName, storageAccountKey, storageAccountName + '.blob.core.windows.net');

var blobIsReady = false;
blobSvc.createContainerIfNotExists('smarthome', { publicAccessLevel: 'blob' }, function (error, result, response) {
    if (!error) {
        // Blob container is created!
        console.log("Yay! Blob container is created");
        blobIsReady = true;
    }
});

function uploadBlob(file, callback) {
    if (!blobIsReady) {
        return;
    }

    blobSvc.createBlockBlobFromLocalFile('smarthome', file.name, file.path, function (error, result, response) {
        if (!error) {
            // file uploaded
            if (callback) {
                callback(null, "http://" + storageAccountName + '.blob.core.windows.net/smarthome/' + result);
            }
        }
    });
}
//End of blob storage-related code


//Event handler upon detection of presence
function presenceDetected() {

    //When presence detected, turn on the lamp to better capture the photo
    lamp.switchOn();
    
    //Take photo of that intuder
    cam.takePhoto(function (err, file) {
        console.log(file);

        //Upload photo binary, and get the photo URL
        uploadBlob(file, function (err2, url) {
            if (url) {

                //Notify newly captured photo to Azure IoT Hub
                sendMotionCapturedData(url);
            }
        });

        //take one more photo of that intruder to be sure
        //cam.takePhoto(function (err, file) {
        //    uploadBlob(file);
        //});
    });
}

//Presence detector using PIR sensor
var presence = new PresenceDetector(12);
presence.onPresenceDetected(function () {
    presenceDetected();
});
presence.onPresenceUndetected(function () {
    lamp.switchOff();
});


//Kinda main loop for detecting light and sound
var lightSensorThresholdOn = 1000;
var lightSensorThresholdOff = 60;

setInterval(function () {
    
    //Get ADC instance from current sensor, instead of creating one.
    var theADC = cs.adc;

    if (USE_LIGHT_SENSOR) {
        //Read ADC channel 1, connected to light sensor
        var adc1 = theADC.read(1);

        if (!lamp.isOn() && adc1 >= lightSensorThresholdOn) {
            lamp.switchOn();
            setTimeout(function () {
                adc1 = theADC.read(1);
                lightSensorThresholdOff = adc1;

            }, 1000);
        }

        if (lamp.isOn() && (adc1 < lightSensorThresholdOff)) {
            lamp.switchOff();
        }
    }

    if (USE_SOUND_SENSOR) {
        //Read ADC channel 2, connected to sound sensor
        var adc2 = theADC.read(2);
        if (adc2 > 5) { //5 is my magic number, you should adjust
            presenceDetected();
        }
    }

}, 500);


//Express' Routes

app.get("/", function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send('Hello there. Nothing here...');
});

app.get("/toggle", function (req, res) {
    
    lamp.toggle();

    res.set('Content-Type', 'text/plain');
    res.send('Switch value: ' + lamp.isOn() + '\n');
});

app.get("/adc", function (req, res) {
    var channel = req.query.channel || 0;

    var theADC = cs.adc;
    var curVal = theADC.read(channel);
    res.json({ channel: 0, value: curVal });
});

app.get("/sensor/current", function (req, res) {
    var curVal = cs.readCurrent();
    res.json({ value: curVal });
});

app.get("/cam/takePhoto", function (req, res) {
    cam.takePhoto(function (err, file) {
        console.log(file);
                
        //res.sendFile(file);
        if (err) {
            res.set('Content-Type', 'text/plain');
            res.send(err.message);
        }
        else {
            res.set('Content-Type', 'image/jpeg');
            res.sendFile(file.path);
        }
    });
});

var server = app.listen(1337, function () {
    var host = server.address().address;
    var port = server.address().port;
    
    console.log('Listening at http://%s:%s', host, port);
});


//Azure IoT Hub related

var iothub = require('./lib/iothub');
var iothubDev = require("azure-iot-device");

var iothubConnString = "[IOT HUB CONNECTION STRING]";
var iothubRegistry = new iothub.Registry(iothubConnString, new iothub.Https());

var iothubClient;

//first, check if device is registered
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

    //create Azure IoT Hub conn string for a device
    var connStr = "HostName=" + iothubRegistry.config.host + ";CredentialScope=Device;DeviceId=" + dev.deviceId + ";SharedAccessKey=" + dev.authentication.SymmetricKey.primaryKey;
    lamp.setIotHubConnectionString(connStr);
    
    //set client    
    iothubClient = new iothubDev.Client(connStr, new iothub.Https());
    
    //register metadata first
    var metadataMsg = new iothubDev.Message(JSON.stringify(lamp.getMetadata()));
    iothubClient.sendEvent(metadataMsg, printResultFor('send'));
    
    // start telemetry data send routing
    setInterval(sendTelemetryData, 10000);

    //listen for notif
    setInterval(function () {
        if (!isWaiting) waitForNotifications();
    }, 1000);
}

// function to send telemetry data
function sendTelemetryData() {
    
    if (!iothubClient) {
        return;
    }

    var currentInMilliAmpere = cs.readCurrent();
    var wattage = 220 * currentInMilliAmpere * 1.0 / 1000;

    var adc1 = cs.adc.read(1);
    var adc2 = cs.adc.read(2);

    var data = JSON.stringify({
        "DeviceID": lamp.deviceId, 
        "Wattage": wattage,
        "LightSensor": adc1,
        "SoundSensor": adc2
    });

    console.log("Sending device telemetry data:\n" + data);

    iothubClient.sendEvent(new iothubDev.Message(data), printResultFor('send'));
}

// Notify Azure-IoT-Hub upon photo captured, so anyone listening can react to newly available photo URL.
function sendMotionCapturedData(photoUrl) {

    if (!iothubClient) {
        return;
    }

    var currentMA = cs.readCurrent();
    var wattage = 220 * currentMA * 1.0 / 1000;

    var data = JSON.stringify({
        "DeviceID": lamp.deviceId,
        "motionDetected": true,
        "capturedPhotoUrl": photoUrl
    });

    console.log("Sending device alert data:\n" + data);

    iothubClient.sendEvent(new iothubDev.Message(data), printResultFor('sendAlertData'));

    sendTelemetryData();
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