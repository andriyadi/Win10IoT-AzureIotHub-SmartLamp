// Copyright (c) DycodeX. All rights reserved.
// Author: Andri Yadi

/**
One of my masterpiece so far :)
It's quite hard to access USB-attached web camera using Node.js, as not much documentation. So here it is.
*/

'use strict';

var Camera = function (saveFilename) {
    this.savedPhotoFilename = saveFilename;

    this.mediaCapture = new Windows.Media.Capture.MediaCapture();
    this.mediaCaptureInitialized = false;
    this.isSavingPhoto = false;

    this._init();
}

Camera.prototype = {
    _handleError: function (error) {
        console.error(error); // you can do better than this.
    },
    _init: function () {

        var captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
        //captureInitSettings.audioDeviceId = "";
        //captureInitSettings.videoDeviceId = "";
        //captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audioAndVideo;
        captureInitSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.auto;

        var self = this;
        this.mediaCapture.initializeAsync(captureInitSettings).done(function () {
            console.log("Cam initialized");
            self.mediaCaptureInitialized = true;

        }, self._handleError);


        this.mediaCapture.onfailed = function (sender, errorEventArgs) {
            self._handleError(errorEventArgs);
        }
    }
};

Camera.prototype.takePhoto = function (callback) {
    if (!this.mediaCaptureInitialized) {
        return;
    }

    if (this.isSavingPhoto) {
        return;
    }

    this.isSavingPhoto = true;

    var self = this;

    //var picturesLibrary = Windows.Storage.KnownFolders.picturesLibrary;

    //Store photo to local folder under application data. So no need to deal with permission and stuffs.
    var applicationData = Windows.Storage.ApplicationData.current;
    var picturesLibrary = applicationData.localFolder;

    picturesLibrary.createFileAsync(this.savedPhotoFilename, Windows.Storage.CreationCollisionOption.generateUniqueName).done(

        function (newFile) {
            console.log("File created!");

            var imageEncodingProperties = Windows.Media.MediaProperties.ImageEncodingProperties.createJpeg();
            imageEncodingProperties.width = 1024;
            imageEncodingProperties.height = 768;

            self.mediaCapture.capturePhotoToStorageFileAsync(imageEncodingProperties, newFile).done(
                function (result) {
                    console.log("Photo created!");
                    //mediaCapture.close();

                    self.isSavingPhoto = false;

                    if (callback) {
                        callback(null, newFile);
                    }

                }, function (err) {
                    this.isSavingPhoto = false;
                    self._handleError(err);
                    if (callback) {
                        callback(err, null);
                    }
                }
            );

        }, function (err) {
            this.isSavingPhoto = false;
            self._handleError(err);
            if (callback) {
                callback(err, null);
            }
        });
}

module.exports = Camera;
