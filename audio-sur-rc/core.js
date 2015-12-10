// Shared code

// Copyright (c) 2015 pourLAmourA2 - <a href="../LICENSE">MIT License</a>

var DEBUG = false;

var boPlay = document.getElementById("boPlay");
boPlay.disabled = true;


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var scaledSampleRate = 8192;


var onStartPlay = function(boGetSource) {
    boGetSource.disabled = true;
    boPlay.disabled = true;

    var audixel = new Audixel();
    var imageData = mainContex.getImageData(0, mainWidth, mainWidth, mainWidth);
    var onlyData = imageData.data;
    var audioSamples = audixel.decodeAudio(onlyData, mainWidth, scaledSampleRate, audioCtx.sampleRate);

    // audio.play(

    /*audioCtx.resume().then(function() {
        bufferSource = audioCtx.createBufferSource();
        bufferSource.buffer = recSamples;
        bufferSource.connect(audioCtx.destination);
        bufferSource.onended = function() { onStopPlay(boGetSource); }
        bufferSource.start();

        boPlay.onclick = function() { bufferSource.stop(); }
        boPlay.disabled = false;
    });*/

    boPlay.onclick = function() { onStopPlay(boGetSource); }
    boPlay.disabled = false;
}


var onStopPlay = function(boGetSource) {
    boPlay.disabled = true;

    /*audioCtx.suspend().then(function() {
        boGetSource.disabled = false;
        boPlay.onclick = function() { onStartPlay(boGetSource); }
        boPlay.disabled = false;
    });*/

    boGetSource.disabled = false;
    boPlay.onclick = function() { onStartPlay(boGetSource); }
    boPlay.disabled = false;
}



