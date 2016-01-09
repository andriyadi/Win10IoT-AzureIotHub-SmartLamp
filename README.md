# Win10IoT-AzureIotHub-SmartLamp
In this project, I put together a real-world working project that shows how we can create an IoT device based on **Raspberry Pi 2**, 
with **Windows 10 IoT Core** OS. It's basically a smart lamp, that's controllable (switched on/off) remotely and able to send wattage telemetry. 
The app is written in **Node.js**, and leverages **Azure IoT Hub** for collecting telemetry data and control the device.

I use this project for a demo during my talk about Windows 10 for Makers in [**Microsoft TechDays 2015 Indonesia**](http://aka.ms/techdaysid) event.

**Update:**
I also use this project to do a demo in [**Bandung IoT Developer Day**](http://edu.dycode.co.id/bdg-iotdevday/) on Nov 14, 2015, for my talk about "Raspberry Pi 2 + Windows 10 IoT Core + Node.js". Of course, I added some new features.

New features:
* Detect motion using PIR sensor
* Automatically capture photo using web camera upon motion detected
* Upload captured photo to Azure Blob Storage
* Opt-in to automatically turn on/off the lamp based on surrounding light, by leveraging light sensor.
* Hey I even integrate sound sensor. When detected surrounding sound is above certain level, turn on the lamp and take photo. Who knows there's an intruder.

##Components

To properly deploy the project, you need to prepare following components:

* Raspberry Pi 2 with Windows 10 IoT Core OS
* Solid state AC switch circuit (circuit is below)
* AC light bulb
* AC current sensor ACS712 5A
* Analog to Digital Converter IC MCP3008
* Voltage divider circuit to convert 5 volts to 3.3 volts. Output from ACS712 is in 5 volts level, while Raspberry Pi expects 3.3 volts. 

**Update:**
Optionally you need additional components for the new features:
* Webcam. Any webcam should do. I use Logitech C170
* Piezoelectric infrared (PIR) sensor
* Sound sensor. I use [this one](http://www.dfrobot.com/index.php?route=product/product&product_id=83#.VpCJbxWriko) from DFRobot

**Circuit**
![Circuit](https://raw.githubusercontent.com/andriyadi/Win10IoT-AzureIotHub-SmartLamp/master/Circuit.jpeg)

##Azure IoT Hub
You need to have [Azure IoT Hub](https://azure.microsoft.com/en-us/develop/iot/) account in order to try control device remotely and sending wattage. After you setup an Azure IoT Hub instance, you should change `[IOT HUB CONNECTION STRING]` value in `server.js` file with an appropriate connection string. Refer to [Azure IoT Hub documentation](https://azure.microsoft.com/en-us/documentation/articles/iot-hub-devguide/) on how to get that the connection string.

##Azure Blob Storage
New feature is able to capture photo (upon motion detected) using webcam and store it in the cloud. I use Azure Blob Storage for that. If you want to use it as well, you should setup Azure Storage instance, and change `[YOUR_STORAGE_ACCOUNT_NAME]` and `[YOUR_STORAGE_ACCOUNT_KEY]` values in `server.js` file with your own account.


## Bonus
### Webcam
For new features above, I want to be able to capture photo using webcam. Accessing webcam in Windows 10, including Windows 10 IoT Core is easy, there're a lot of examples in C#, but not so much in JavaScript (Node.js). So I need to create the library for JavaScript by my own.

So here it is. A freebie for you :)

### MCP3008
For reading energy used by the lamp in Watt, I need to be able to get the current used by lamp. For that I use a current sensor (ACS712) that spits out analog data. 
However, as we know, Raspberry can't read analog data directly. For that, I use ADC chip called MCP3008.

Inside the project, you'll find a JavaScript class (`/lib/MCP3008.js`) for reading analog data from MCP3008 via Serial Peripheral Interface (SPI). 

There are a lot of samples to read data from SPI using C#, but I haven't found one that uses Node.js. I kind of struggle to correctly query and access SPI device in Windows 10 IoT Core with Node.js. After get the right instance, reading the analog data out of MCP3008 is simple. Hopefully the class will save your time.




