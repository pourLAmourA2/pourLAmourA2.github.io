// Main code

// Copyright (c) 2015 pourLAmourA2 - <a href="../LICENSE">MIT License</a>

var audioText = document.getElementById("audioText");

var scaledSampleRate = 8064;
var nbScaledSamples = 5 * scaledSampleRate;
var scaledSamples = new Float32Array(nbScaledSamples);

function loadPhoto() {}
function loadImage() {}


// Recording section

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var audioSource;
var bufferSource;

var nbRecSamples = audioCtx.sampleRate * nbScaledSamples / scaledSampleRate
var recSamples = audioCtx.createBuffer(1, nbRecSamples, audioCtx.sampleRate);
var recIndex = 0;
var mediaReady = false;

var scaler = new Scaler(scaledSampleRate, audioCtx.sampleRate);
if (DEBUG) { console.log("scaler.nbUpscales = " + scaler.nbUpscales); }

var baseRC = new BaseRC2audio();

// Buttons and timer label

var boRecord = document.getElementById("boRecord");
var labelTimer = document.getElementById("labelTimer");
var boPlay = document.getElementById("boPlay");

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
    var j = 0;
    var wSignSum = 0.0;
    var nbTokens = audioCtx.sampleRate;

    // Downscale audio samples
    scaledSamples = scaler.downscale(inputData, recSamples.length);

    var strAudio = "### ";

    for (var id = 0; id < nbScaledSamples; id+=3) {
        var scaledSample0 = 128 + Math.floor(127 * scaledSamples[id + 0]);
        var scaledSample1 = 128 + Math.floor(127 * scaledSamples[id + 1]);
        var scaledSample2 = 128 + Math.floor(127 * scaledSamples[id + 2]);

        strAudio += baseRC.bytes2chars(scaledSample0, scaledSample1, scaledSample2);
        if (id % 24 == 21) { strAudio += ' '; }
    }

    audioText.value = strAudio;

    if (DEBUG) {
        var alphaStats = {};
        var alphaArray = baseRC.alphabet.split("");

        for (var i = 0; i < strAudio.length; i++) {
            if (!(strAudio.charAt(i) in alphaStats)) alphaStats[strAudio.charAt(i)] = 0;
            alphaStats[strAudio.charAt(i)] += 1;
        }

        alphaArray.sort(function(a,b) {
            if (!(a in alphaStats)) return b;
            if (!(b in alphaStats)) return a;
            return alphaStats[b]-alphaStats[a]});

        console.log("--------------------");
        for (var i in alphaArray) {
            var key = alphaArray[i];
            if (key in alphaStats)
                console.log('Key:' + key + ' count:' + alphaStats[key] + ' value:' + baseRC.dictAlpha[key]);
        }
    }
}

var decodeAudio = function() {
    // Empty signal
    for (var id = 0; id < nbScaledSamples; id++) { scaledSamples[id] = 0.0; }

    var strAudio = audioText.value;
    var idx = 0;
    var tempStr = "";

    for (var a = 0; a < strAudio.length; a++) {
        if (strAudio.charAt(a) in baseRC.dictAlpha) { tempStr += strAudio.charAt(a); }

        if (tempStr.length == 4) {
            if (idx + 2 < nbScaledSamples) {
                var bytes = baseRC.chars2bytes(tempStr.charAt(0), tempStr.charAt(1), tempStr.charAt(2), tempStr.charAt(3));

                scaledSamples[idx + 0] = (bytes[0] - 128.0) / 127.0;
                scaledSamples[idx + 1] = (bytes[1] - 128.0) / 127.0;
                scaledSamples[idx + 2] = (bytes[2] - 128.0) / 127.0;
            }

            idx += 3;
            tempStr = "";
        }
    }

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
        bufferSource = audioCtx.createBufferSource();
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
                audioSource = audioCtx.createMediaStreamSource(audioStream);
                audioSource.connect(recordNode);
            },
            // Error callback
            function(err) { console.log('Erreur: ' + err); }
        );
    } else {
        console.log('getUserMedia not supported');
    }
}

onStopRec();

