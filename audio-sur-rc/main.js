// Main code

// Copyright (c) 2015 pourLAmourA2 - <a href="../LICENSE">MIT License</a>

// Recording section

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var scaledSampleRate = 8064;
var nbScaledSamples = 5 * scaledSampleRate;

var nbRecSamples = audioCtx.sampleRate * nbScaledSamples / scaledSampleRate
var recSamples = audioCtx.createBuffer(1, nbRecSamples, audioCtx.sampleRate);
var recIndex = 0;
var mediaReady = false;


// 1D Scaler and BaseRC codec

var scaler = new Scaler(scaledSampleRate, audioCtx.sampleRate);
if (DEBUG) { console.log("scaler.nbUpscales = " + scaler.nbUpscales); }

var baseRC = new BaseRC2audio();


// Buttons, timer label and text area

var boRecord = document.getElementById("boRecord");
var labelTimer = document.getElementById("labelTimer");
var boPlay = document.getElementById("boPlay");
var audioText = document.getElementById("audioText");


// On click actions

var onStartRec = function() {
    if (!mediaReady) {
        initMedia();
        mediaReady = true;
    }

    boRecord.disabled = true;
    labelTimer.value = "5";
    boPlay.disabled = true;

    recIndex = 0;

    audioCtx.resume().then(function() {
        boRecord.onclick = onStopRec;
        boRecord.disabled = false;
    });
}

var onStopRec = function() {
    boRecord.disabled = true;

    audioCtx.suspend().then(function() {
        var recSamplesData = recSamples.getChannelData(0);
        labelTimer.value = "0";
        for (; recIndex < nbRecSamples; recIndex++) {
            recSamplesData[recIndex] = 0.0;
        }
        encodeAudio();

        boRecord.onclick = onStartRec;
        boRecord.disabled = false;
        boPlay.onclick = onStartPlay;
        boPlay.disabled = false;
    });
}

var encodeAudio = function() {
    var inputData = recSamples.getChannelData(0);

    // Downscale audio samples
    scaledSamples = scaler.downscale(inputData, recSamples.length);

    // Convert data to BaseRC
    audioText.value = baseRC.encode(scaledSamples, nbScaledSamples);
}

var decodeAudio = function() {
    // Convert BaseRC to audio data
    scaledSamples = baseRC.decode(nbScaledSamples, audioText.value);

    // Upscale audio data and copy to the output buffer
    var upscaledData = scaler.upscale(scaledSamples, nbScaledSamples);
    var outputData = recSamples.getChannelData(0);

    for (var i = 0; i < recSamples.length; i++) {
        outputData[i] = upscaledData[i];
    }
}

var onStartPlay = function() {
    boRecord.disabled = true;
    boPlay.disabled = true;

    decodeAudio();

    audioCtx.resume().then(function() {
        var bufferSource = audioCtx.createBufferSource();
        bufferSource.buffer = recSamples;
        bufferSource.connect(audioCtx.destination);
        bufferSource.onended = onStopPlay;
        bufferSource.start();

        boPlay.onclick = function() { bufferSource.stop(); }
        boPlay.disabled = false;
    });
}

var onStopPlay = function() {
    boPlay.disabled = true;

    audioCtx.suspend().then(function() {
        boRecord.onclick = onStartRec;
        boRecord.disabled = false;
        boPlay.onclick = onStartPlay;
        boPlay.disabled = false;
    });
}


// Main record function

var recordNode = audioCtx.createScriptProcessor(4096, 1, 1);

recordNode.onaudioprocess = function(audioEvent) {
    if (recIndex < nbRecSamples) {
        var inputBuffer = audioEvent.inputBuffer;
        var nbCopy = Math.min(inputBuffer.length, nbRecSamples - recIndex);

        var inputData = inputBuffer.getChannelData(0);
        var outputData = recSamples.getChannelData(0);

        labelTimer.value = Math.ceil(1.0 * (nbRecSamples - recIndex) / audioCtx.sampleRate - 0.5);

        for (var i = 0; i < nbCopy; i++) {
            outputData[recIndex] = inputData[i];
            recIndex++;
        }

        if (recIndex >= nbRecSamples) {
            onStopRec();
        }
    }
}


// Main block for doing the audio recording

function initMedia() {
    navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia);

    if (navigator.getUserMedia) {
        if (DEBUG) {
            console.log('getUserMedia supported.');
        }

        navigator.getUserMedia(
            {audio:true},
            // Success callback
            function(audioStream) {
                var audioSource = audioCtx.createMediaStreamSource(audioStream);
                audioSource.connect(recordNode);
            },
            // Error callback
            function(err) { console.log('Erreur: ' + err); }
        );
    } else {
        console.log('getUserMedia not supported');
    }
}


// Start with stopped state

onStopRec();

