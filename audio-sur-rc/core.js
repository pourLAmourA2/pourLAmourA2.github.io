var DEBUG = false;

var mainCanvas = document.getElementById("mainCanvas");
var mainContex = mainCanvas.getContext('2d');
var mainWidth = mainCanvas.width;
var mainHeight = mainCanvas.height;

var boPlay = document.getElementById("boPlay");
boPlay.disabled = true;


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var scaledSampleRate = 8192;


var onStartPlay = function(boGetSource) {
    boGetSource.disabled = true;
    boPlay.disabled = true;

    var audixel = new Audixel();
    var audioSamples = audixel.decodeAudio(mainContex, mainWidth, scaledSampleRate, audioCtx.sampleRate);

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



