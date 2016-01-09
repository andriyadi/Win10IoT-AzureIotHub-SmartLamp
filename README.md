# Win10IoT-AzureIotHub-SmartLamp
In this project, I put together a real-world working project that shows how we can create an IoT device based on **Raspberry Pi 2**, 
with **Windows 10 IoT Core** OS. It's basically a smart lamp, that's controllable (switched on/off) remotely and able to send wattage telemetry. 
The app is written in **Node.js**, and leverages **Azure IoT Hub** for collecting telemetry data and control the device.

I use this project for a demo during my talk about Windows 10 for Makers in [Microsoft TechDays 2015 Indonesia](http://aka.ms/techdaysid) event.

##Components

To properly deploy the project, you need to prepare following components:

* Raspberry Pi 2 with Windows 10 IoT Core OS
* Solid state AC switch circuit (will detail it later)
* Lamp
* AC current sensor ACS712 5A
* Analog to Digital Converter IC MCP3008
* Voltage divider circuit to convert 5 volts to 3.3 volts. Output from ACS712 is 5 volts, while Raspberry Pi expects 3.3 volts. 


##Azure IoT Hub
You need to have [Azure IoT Hub](https://azure.microsoft.com/en-us/develop/iot/) account in order to try control device remotely and sending wattage. After you setup an Azure IoT Hub instance, you should change `[IOT HUB CONNECTION STRING]` value in `server.js` file with an appropriate connection string. Refer to [Azure IoT Hub documentation](https://azure.microsoft.com/en-us/documentation/articles/iot-hub-devguide/) on how to get that the connection string.


## Bonus
For reading energy used by the lamp in Watt, I need to be able to get the current used by lamp. For that I use a current sensor (ACS712) that spits out analog data. 
However, as we know, Raspberry can't read analog data directly. For that, I use ADC chip called MCP3008.

Inside the project, you'll find a JavaScript class (`/lib/MCP3008.js`) for reading analog data from MCP3008 via Serial Peripheral Interface (SPI). 

There are a lot of samples to read data from SPI using C#, but I haven't found one that uses Node.js. I kind of struggle to correctly query and access SPI device in Windows 10 IoT Core with Node.js. After get the right instance, reading the analog data out of MCP3008 is simple. Hopefully the class will save your time.




