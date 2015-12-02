// DCT section

var rows2zigzag = [
     0,  1,  5,  6, 14, 15, 27, 28,
     2,  4,  7, 13, 16, 26, 29, 42,
     3,  8, 12, 17, 25, 30, 41, 43,
     9, 11, 18, 24, 31, 40, 44, 53,
    10, 19, 23, 32, 39, 45, 52, 54,
    20, 22, 33, 38, 46, 51, 55, 60,
    21, 34, 37, 47, 50, 56, 59, 61,
    35, 36, 48, 49, 57, 58, 62, 63  ];

var zigzag2rows = [
     0,                                                      1,  8,
    16,  9,  2,                                      3, 10, 17, 24,
    32, 25, 18, 11,  4,                      5, 12, 19, 26, 33, 40,
    48, 41, 34, 27, 20, 13,  6,      7, 14, 21, 28, 35, 42, 49, 56,
        57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58,
                59, 52, 45, 38, 31, 39, 46, 53, 60,
                        61, 54, 47, 55, 62,
                                63  ];

// Verify JPEG zigzag indexes
if (DEBUG) {
    for (var t = 0; t < 64; t++) {
        if (t != rows2zigzag[zigzag2rows[t]]) {
            console.log('Probleme avec: ' + t);
        }
    }
}


var dct64mat = [];
var dct8x8mat = [];
var alphas8 = [Math.sqrt(0.5), 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

// Compute the DCT 64 matrix - align frequencies with JPEG zigzag indexes
for (var i = 0; i < 64; i++) {
    var freq = rows2zigzag[i];
    var alpha_freq = (freq == 0 ? 1.0 : Math.sqrt(2.0));
    dct64mat[i] = new Float32Array(64);

    for (var t = 0; t < 64; t++) {
        dct64mat[i][t] = 0.125 * alpha_freq * Math.cos(freq * Math.PI * (2 * t + 1) / 128);
    }
}

// Compute the DCT 8x8 matrix
for (var v = 0; v < 8; v++) {
    for (var u = 0; u < 8; u++) {
        var i = 8 * v + u;
        dct8x8mat[i] = new Float32Array(64);

        for (var y = 0; y < 8; y++) {
            var dctVY = 0.5 * alphas8[v] * Math.cos(v * Math.PI * (2 * y + 1) / 16);

            for (var x = 0; x < 8; x++) {
                var j = 8 * y + x;
                dct8x8mat[i][j] = 0.5 * alphas8[u] * Math.cos(u * Math.PI * (2 * x + 1) / 16) * dctVY;
            }
        }
    }
}

if (DEBUG) {
    console.log("dct64mat[i][20] dct8x8mat[i][20]");
    for (var i = 1; i < 10; i++) {
        console.log(dct64mat[i][20] + " " + dct8x8mat[i][20]);
    }
}


function Dct() {
    this.freqs = new Float32Array(64);

    this.decode = function(allSamples, N) {
        for (var s = 0; s < N; s += 64) {
            // Cubic, *2
            for (var t = 0; t < 64; t++) {
                allSamples[s + t] = allSamples[s + t] * allSamples[s + t] * allSamples[s + t] * 2.0;
            }

            // Apply DCT 8x8
            for (var i = 0; i < 64; i++) {
                // Initialize frequencies
                this.freqs[i] = 0.0;

                for (var t = 0; t < 64; t++) {
                    this.freqs[i] += dct8x8mat[i][t] * allSamples[s + t];
                }

                // *2, Cubic = *8
                this.freqs[i] = this.freqs[i] * this.freqs[i] * this.freqs[i] * 8.0;
            }

            // Apply Inverse DCT 64

            for (var t = 0; t < 64; t++) {
                // Initialize audio data
                allSamples[s + t] = 0.0;
            }

            for (var i = 0; i < 64; i++) {
                // Rebuild down-scaled audio data
                for (var t = 0; t < 64; t++) {
                    allSamples[s + t] += this.freqs[i] * dct64mat[i][t];
                }
            }
        } // for (id < N)
    }
}



