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

}


