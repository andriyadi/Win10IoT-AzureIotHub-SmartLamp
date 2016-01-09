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
        console.error(error);
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

/*
var mediaCapture = new Windows.Media.Capture.MediaCapture();
var mediaCaptureInitialized = false;
var photoSequencePrepared = false;
var lowLagPhotoSequenceCapture;
var pastFrames = 5;
var futureFrames = 5;
var framesCaptured = 0;
var previousFrameTimeStamp = null;
var savedFrames = new Array();

function takePicture() {
    if (!mediaCaptureInitialized) {
        return;
    }
    var picturesLibrary = Windows.Storage.KnownFolders.picturesLibrary;
    picturesLibrary.createFileAsync("SmartHomeCap.jpg", Windows.Storage.CreationCollisionOption.generateUniqueName).done(function (newFile) {
        console.log("File created!");

        var imageEncodingProperties = Windows.Media.MediaProperties.ImageEncodingProperties.createJpeg();
        imageEncodingProperties.width = 1024;
        imageEncodingProperties.height = 768;

        mediaCapture.capturePhotoToStorageFileAsync(imageEncodingProperties, newFile).done(
            function (result) {
                console.log("Photo created!");
                //mediaCapture.close();
            },
            function capturePhotoError(error) {
                console.log("An exception occurred trying to capturePhoto: " + error.message);
            }
        );
    },
        function (error) {
            console.log('capture async exception' + error.message);
        });
}

function preparePhotoSequence() {
    if (!mediacapture.videodevicecontroller.lowlagphotosequence.supported) {
        return;
    }

    var photoFormat = Windows.Media.MediaProperties.ImageEncodingProperties.createJpeg();
    mediaCapture.videoDeviceController.lowLagPhotoSequence.thumbnailRequestedSize = 300;
    mediaCapture.videoDeviceController.lowLagPhotoSequence.thumbnailEnabled = true;

    photoFormat.width = 1024;
    photoFormat.height = 768;


    // Past photos will set the number of photos to keep in the buffer for a photosequence
    if (mediaCapture.videoDeviceController.lowLagPhotoSequence.maxPastPhotos > pastFrames) {
        mediaCapture.videoDeviceController.lowLagPhotoSequence.PastPhotoLimit = pastFrames;
    } else {
        mediaCapture.videoDeviceController.lowLagPhotoSequence.PastPhotoLimit = mediaCapture.videoDeviceController.lowLagPhotoSequence.maxPastPhotos;
    }
 
    // This will set how fast the photos will be taken.
    //if (mediaCapture.videoDeviceController.lowLagPhotoSequence.maximumPhotosPerSecond > 5) {
    //    mediaCapture.videoDeviceController.lowLagPhotoSequence.photosPerSecondLimit = 5;
    //} else {
    //    mediaCapture.videoDeviceController.lowLagPhotoSequence.photosPerSecondLimit = mediaCapture.videoDeviceController.lowLagPhotoSequence.maximumPhotosPerSecond;
    //}

    mediaCapture.prepareLowLagPhotoSequenceCaptureAsync(photoFormat).done(function (result) {
        if (result) {
            lowLagPhotoSequenceCapture = result;
            photoSequencePrepared = true;
        }
    },
        function (err) {
            console.log("Cam error");
        });
}

function savePhotoFromCache(frameIndex) {
    Windows.Storage.KnownFolders.picturesLibrary.createFileAsync("SmartHomeCap.jpg", Windows.Storage.CreationCollisionOption.generateUniqueName).done(
        function (newFile) {
            var photoStorage = newFile;
            photoStorage.openAsync(Windows.Storage.FileAccessMode.readWrite).done(
                function (stream) {
                    var contentStream = savedFrames[frameIndex].cloneStream();
                    Windows.Storage.Streams.RandomAccessStream.copyAndCloseAsync(contentStream.getInputStreamAt(0), stream.getOutputStreamAt(0)).done(function () {
                        console.log("PhotoPath " + photoStorage.path);
                    });
                });
        });
}

function photoCaptured(photo) {
    // We are going to collect a set amount of frames
    if (framesCaptured < (pastFrames + futureFrames)) {
        if (framesCaptured === 0) {
            previousFrameTimeStamp = null;
        }

        savedFrames[framesCaptured] = photo.frame.cloneStream();

        framesCaptured++;
        previousFrameTimeStamp = photo.captureTimeOffset;

    } else {
        lowLagPhotoSequenceCapture.removeEventListener("photocaptured", photoCaptured);
        lowLagPhotoSequenceCapture.stopAsync();

        //save 
        savedFrames.forEach(function (obj, index) {
            savePhotoFromCache(index);
        });
    }
}

function takePhotoSequence() {
    if (photoSequencePrepared) {

        lowLagPhotoSequenceCapture.startAsync().done(function () {
            framesCaptured = 0; 
            // This listener will be called for each photo captured
            lowLagPhotoSequenceCapture.addEventListener("photocaptured", photoCaptured);
        });
    }

}

var captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
//captureInitSettings.audioDeviceId = "";
//captureInitSettings.videoDeviceId = "";
//captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audioAndVideo;
captureInitSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.auto;

mediaCapture.initializeAsync(captureInitSettings).done(function () {
    console.log("Cam done");
    mediaCaptureInitialized = true;

    preparePhotoSequence();

}, function (err) {
});


mediaCapture.onfailed = function (sender, errorEventArgs) {
    console.log("Cam FAILED!");
}
*/