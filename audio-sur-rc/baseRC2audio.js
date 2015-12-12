// Converts baseRC strings to audio signal (no scaling)

// Copyright (c) 2015 pourLAmourA2 - <a href="../LICENSE">MIT License</a>

function BaseRC2audio() {
    //   alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÈÉÊÎÔàèéêîô";
    this.alphabet =           "trjDEFGHIJKLMNOPQRSTUVWXkYZABCalibcdeghnmopquvwxyzÀÈÉÊÔÎàèéêôîsf";   // baseRC
    this.dictAlpha = {};

    for (var a = 0; a < this.alphabet.length; a++) {
        this.dictAlpha[this.alphabet.charAt(a)] = a;
    }

    if (DEBUG) {
        for (var key in this.dictAlpha) {
            if (this.alphabet.charAt(this.dictAlpha[key]) != key)
                console.log('Key:' + key + ' value:' + this.dictAlpha[key]);
        }
    }

    this.bytes2chars = function(byte1, byte2, byte3) {
        var chars = "";
        var sum = byte1 + (byte2 << 8) + (byte3 << 16) ;

        for (var c = 0; c < 4; c++) {
            chars += this.alphabet[sum & 63];
            sum >>= 6;
        }

        return chars;
    }

    this.chars2bytes = function(char1, char2, char3, char4) {
        var sum = 0;
        var chars = [char4, char3, char2, char1];

        for (var c = 0; c < 4; c++) {
            sum <<= 6;
            sum += this.dictAlpha[chars[c]];
        }

        return [(sum & 255), ((sum >> 8) & 255), ((sum >> 16) & 255)];
    }

    if (DEBUG) {
        for (var i = 0; i < this.alphabet.length; i+=3) {
            for (var j = 0; j < this.alphabet.length; j+=5) {
                for (var k = 0; k < this.alphabet.length; k+=7) {
                    for (var l = 0; l < this.alphabet.length; l+=9) {
                        var testStr1 = "" + this.alphabet[i] + this.alphabet[j] + this.alphabet[k] + this.alphabet[l];
                        var tstbytes = this.chars2bytes(testStr1.charAt(0), testStr1.charAt(1), testStr1.charAt(2), testStr1.charAt(3));
                        var testStr2 = this.bytes2chars(tstbytes[0], tstbytes[1], tstbytes[2]);

                        if (testStr1 != testStr2) {
                            console.log('Probleme avec: ' + [i, j, k, l] + ' ' + testStr1 + ' ' + tstbytes + ' ' + testStr2 + ' ' +
                                [this.dictAlpha[testStr2.charAt(0)], this.dictAlpha[testStr2.charAt(1)],
                                    this.dictAlpha[testStr2.charAt(2)], this.dictAlpha[testStr2.charAt(3)]]);
                        }
                    }
                }
            }
        }
    }

    this.center = 128.0;
    this.amp = 127.0;

    this.decode = function(N, strAudio) {
        var samples = new Float32Array(N);
        var tempStr = "";
        var idx = 0;

        // Empty signal
        for (var id = 0; id < N; id++) { samples[id] = 0.0; }

        // Decode baseRC
        for (var a = 0; a < strAudio.length; a++) {
            if (strAudio.charAt(a) in this.dictAlpha) { tempStr += strAudio.charAt(a); }

            if (tempStr.length == 4) {
                if (idx + 2 < N) {
                    var bytes = this.chars2bytes(tempStr.charAt(0), tempStr.charAt(1), tempStr.charAt(2), tempStr.charAt(3));

                    samples[idx + 0] = (bytes[0] - this.center) / this.amp;
                    samples[idx + 1] = (bytes[1] - this.center) / this.amp;
                    samples[idx + 2] = (bytes[2] - this.center) / this.amp;
                }

                tempStr = "";
                idx += 3;
            }
        }

        return samples;
    }

    this.encode = function(samples, N) {
        var strAudio = "### ";

        for (var id = 0; id < N; id += 3) {
            var sample0 = Math.floor(this.amp * samples[id + 0] + this.center);
            var sample1 = Math.floor(this.amp * samples[id + 1] + this.center);
            var sample2 = Math.floor(this.amp * samples[id + 2] + this.center);

            strAudio += this.bytes2chars(sample0, sample1, sample2);
            if (id % 24 == 21) { strAudio += ' '; }
        }

        if (DEBUG) {
            var alphaStats = {};
            var alphaArray = this.alphabet.split("");

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
                    console.log('Key:' + key + ' count:' + alphaStats[key] + ' value:' + this.dictAlpha[key]);
            }
        }

        return strAudio;
    }
}


