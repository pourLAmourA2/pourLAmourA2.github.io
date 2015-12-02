// Scaler class

function Scaler(lowRate, highRate) {
    this.lowRate = lowRate;
    this.highRate = highRate;
    this.nbUpscales = 1;

    while ((this.lowRate << this.nbUpscales) < 2 * this.highRate) {
        this.nbUpscales++;
    }

    this.privDownscale = function(samples, N, lowRate, highRate) {
        var finalData = new Float32Array(N * lowRate / highRate);
        var i = 0;
        var wSignSum = 0.0;
        var nbTokens = highRate;

        for (var s = 0; s < N; s++) {
            if (nbTokens > lowRate) {
                wSignSum += lowRate * samples[s];
                nbTokens -= lowRate;
            }
            else {
                wSignSum += nbTokens * samples[s];
                finalData[i] = wSignSum / highRate;
                i++;

                wSignSum = (lowRate - nbTokens) * samples[s];
                nbTokens += highRate - lowRate;
            }
        }

        return finalData;
    }

    this.privUpscale = function(samples, N, nbUpscales) {
        var offset = 16;    // 64 bytes aligned
        var upscaledN = (N << nbUpscales);
        var upscaledData = new Float32Array(offset + upscaledN + offset);
        var tileSize = 1;

        // Convert to float values (tileSize(=1) * N)
        for (var s = 0; s < N; s++) {
            upscaledData[offset + s] = samples[s];
        }

        // For each tileSize
        for (var k = 0; k < nbUpscales; k++) {
            tileSize <<= 1;

            // Enlarge tiles by 2x
            for (var u = tileSize * N - 1; u >= 0; u--) {
                upscaledData[offset + u] = upscaledData[offset + Math.floor(u / 2)];
            }

            // Five iterations
            for (var iter = 0; iter < 5; iter++) {
                // Update limit values: arbitrary outside values
                upscaledData[offset - 1] = upscaledData[offset];
                upscaledData[offset + tileSize * N] = upscaledData[offset + tileSize * N - 1];

                // For each tile
                for (var s = 0; s < N; s++) {
                    var tile = tileSize * s;

                    // For each pair (indexes -1 and 0) of samples in the original tile
                    for (var u = tile + 1; u < tile + tileSize; u++) {
                        var v0 = upscaledData[offset + u - 2];
                        var v1 = upscaledData[offset + u - 1];
                        var v2 = upscaledData[offset + u + 0];
                        var v3 = upscaledData[offset + u + 1];
                        var vSum = v1 + v2;
                        var vDiff = (v3 - v0) * 0.333333333333;

                        v1 = (vSum - vDiff) * 0.5;
                        v2 = (vSum + vDiff) * 0.5;

                        // No value outside of [-1, 1], vAdjust is always negative
                        if (v1 < -1.0) { var vAdjust = 1.0 + v1; v1 -= vAdjust; v2 += vAdjust; }
                        if (v1 >  1.0) { var vAdjust = 1.0 - v1; v1 += vAdjust; v2 -= vAdjust; }
                        if (v2 < -1.0) { var vAdjust = 1.0 + v2; v2 -= vAdjust; v1 += vAdjust; }
                        if (v2 >  1.0) { var vAdjust = 1.0 - v2; v2 += vAdjust; v1 -= vAdjust; }

                        upscaledData[offset + u - 1] = v1;
                        upscaledData[offset + u + 0] = v2;
                    } // For u in a tile, from 1 to tileSize-1
                } // For each tile s
            } // For 5 iterations
        } // For k upscales

        var finalData = new Float32Array(upscaledN);

        for (var s = 0; s < upscaledN; s++) {
            finalData[s] = upscaledData[offset + s];
        }

        return finalData;
    }

    this.downscale = function(samples, N) {
        return this.privDownscale(samples, N, this.lowRate, this.highRate);
    }

    this.upscale = function(samples, N) {
        return this.privDownscale(this.privUpscale(samples, N, this.nbUpscales), (N << this.nbUpscales),
                                  this.highRate, (this.lowRate << this.nbUpscales));
    }
}


