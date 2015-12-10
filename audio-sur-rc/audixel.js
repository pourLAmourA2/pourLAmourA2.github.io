// Interface between Pixels and audio data

function Audixel() {
    this.audioPath = [0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
    this.center = 128.0;
    this.amp = 127.0;

    this.indexToCoord = function(index) {
        var coord = [0, 0];
        var mask = [1, 1];

        for (var p = 0; p < this.audioPath.length; p++) {
            coord[this.audioPath[p]] |= (index & 1) * mask[this.audioPath[p]];
            index >>= 1; mask[this.audioPath[p]] <<= 1;
        }

        return {x:coord[0], y:coord[1]};
    }

    this.decodeAudio = function(audioPixels, cvWidth, lowRate, highRate) {
        var nbScaledSamples = cvWidth * cvWidth;
        var scaledSamples = new Float32Array(nbScaledSamples);

        // Basic decoding: Y=R=G=B
        for (var s = 0; s < nbScaledSamples; s++) {
            var coord = this.indexToCoord(s);
            scaledSamples[s] = (audioPixels[(coord.y * cvWidth + coord.x) * 4 + 1] - this.center) / this.amp;
        }

        var dct = new Dct();
        dct.decode(scaledSamples, nbScaledSamples);

        var scaler = new Scaler(lowRate, highRate);
        return scaler.upscale(scaledSamples, nbScaledSamples);
    }
}


