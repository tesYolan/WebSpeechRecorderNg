// Redefine some DSP classes for worker function
// See e.g. audio.math.Complex
var Complex = /** @class */ (function () {
    function Complex(real, img) {
        this.real = real;
        this.img = img;
    }
    Complex.fromPolarForm = function (magnitude, argument) {
        var r = Math.cos(argument) * magnitude;
        var i = Math.sin(argument) * magnitude;
        return new Complex(r, i);
    };
    Complex.prototype.magnitude = function () {
        return Math.sqrt((this.real * this.real) + (this.img * this.img));
    };
    Complex.prototype.argument = function () {
        return Math.atan2(this.img, this.real);
    };
    Complex.prototype.add = function (addC) {
        return new Complex(this.real + addC.real, this.img + addC.img);
    };
    Complex.prototype.sub = function (subC) {
        return new Complex(this.real - subC.real, this.img - subC.img);
    };
    Complex.prototype.mult = function (multC) {
        var multR = (this.real * multC.real) - (this.img * multC.img);
        var multI = (this.real * multC.img) + (multC.real * this.img);
        return new Complex(multR, multI);
    };
    Complex.prototype.multReal = function (multF) {
        return new Complex(this.real * multF, this.img * multF);
    };
    Complex.prototype.div = function (divisor) {
        var divReal = divisor.real;
        var divImg = divisor.img;
        var div = (divReal * divReal) + (divImg * divImg);
        var divisionReal = ((this.real * divReal) + (this.img * divImg)) / div;
        var divisionImg = ((divReal * this.img) - (this.real * divImg)) / div;
        return new Complex(divisionReal, divisionImg);
    };
    Complex.prototype.divReal = function (divisor) {
        var div = divisor * divisor;
        var divsionReal = (this.real * divisor) / div;
        var divsionImg = (divisor * this.img) / div;
        return new Complex(divsionReal, divsionImg);
    };
    Complex.prototype.conjugate = function () {
        return new Complex(this.real, -this.img);
    };
    Complex.prototype.equals = function (c) {
        if (c === null) {
            return false;
        }
        return (this.real === c.real && this.img === c.img);
    };
    Complex.prototype.toString = function () {
        return 'Real: ' + this.real + ', Img: ' + this.img;
    };
    return Complex;
}());
var DFTFloat32 = /** @class */ (function () {
    function DFTFloat32(n) {
        this.n = n;
        this.m = Math.log(n) / Math.log(2);
        // if(n != (1 << m))throw new RuntimeException("length N must be power of 2");
        // lookup tables
        this.cosLookup = new Float32Array(n / 2);
        this.sinLookup = new Float32Array(n / 2);
        for (var i = 0; i < n / 2; i++) {
            var arc = (-2 * Math.PI * i) / n;
            this.cosLookup[i] = Math.cos(arc);
            this.sinLookup[i] = Math.sin(arc);
        }
    }
    DFTFloat32.prototype.processReal = function (srcBuf) {
        var x = srcBuf.slice();
        var y = new Float32Array(srcBuf.length);
        for (var yi = 0; yi < y.length; yi++) {
            y[yi] = 0.0;
        }
        this.fftCooleyTukey(x, y);
        var rc = new Array(x.length);
        for (var i = 0; i < x.length; i++) {
            rc[i] = new Complex(x[i], y[i]);
        }
        return rc;
    };
    DFTFloat32.prototype.processRealMagnitude = function (srcBuf) {
        var x = srcBuf.slice();
        var y = new Float32Array(srcBuf.length);
        for (var yi = 0; yi < y.length; yi++) {
            y[yi] = 0.0;
        }
        this.fftCooleyTukey(x, y);
        var rc = new Float32Array(x.length);
        for (var i = 0; i < x.length; i++) {
            var rcc = new Complex(x[i], y[i]);
            rc[i] = rcc.magnitude();
        }
        return rc;
    };
    DFTFloat32.prototype.fftCooleyTukey = function (real, img) {
        var i;
        var j = 0;
        var k;
        var n1;
        var n2 = this.n / 2;
        var a;
        var c;
        var s;
        var t1;
        var t2;
        for (i = 1; i < this.n - 1; i++) {
            n1 = n2;
            while (j >= n1) {
                j = j - n1;
                n1 = n1 / 2;
            }
            j = j + n1;
            if (i < j) {
                t1 = real[i];
                real[i] = real[j];
                real[j] = t1;
                t1 = img[i];
                img[i] = img[j];
                img[j] = t1;
            }
        }
        n1 = 0;
        n2 = 1;
        for (i = 0; i < this.m; i++) {
            n1 = n2;
            n2 = n2 + n2;
            a = 0;
            for (j = 0; j < n1; j++) {
                c = this.cosLookup[a];
                s = this.sinLookup[a];
                a += (1 << (this.m - i - 1));
                for (k = j; k < this.n; k = k + n2) {
                    t1 = c * real[k + n1] - s * img[k + n1];
                    t2 = s * real[k + n1] + c * img[k + n1];
                    real[k + n1] = real[k] - t1;
                    img[k + n1] = img[k] - t2;
                    real[k] = real[k] + t1;
                    img[k] = img[k] + t2;
                }
            }
        }
    };
    DFTFloat32.prototype.process = function (t) {
        var reals = new Float32Array(this.n);
        var imgs = new Float32Array(this.n);
        var trans = new Array(this.n);
        for (var i = 0; i < this.n; i++) {
            reals[i] = t[i].real;
            imgs[i] = t[i].img;
        }
        this.fftCooleyTukey(reals, imgs);
        for (var i = 0; i < this.n; i++) {
            trans[i] = new Complex(reals[i], imgs[i]);
        }
        return trans;
    };
    return DFTFloat32;
}());
var GaussianWindow = /** @class */ (function () {
    function GaussianWindow(size, sigma) {
        if (sigma === void 0) { sigma = GaussianWindow.DEFAULT_SIGMA; }
        this.buf = new Float32Array(size);
        var center = (size - 1) / 2;
        for (var i = 0; i < size; i++) {
            var quot = (i - center) / (sigma * center);
            var exp = -0.5 * quot * quot;
            this.buf[i] = Math.exp(exp);
        }
    }
    GaussianWindow.prototype.getScale = function (i) {
        return this.buf[i];
    };
    GaussianWindow.DEFAULT_SIGMA = 0.3;
    return GaussianWindow;
}());
addEventListener('message', function (_a) {
    var data = _a.data;
    var l = data.l;
    var w = data.w;
    var h = data.h;
    var vw = data.vw;
    var chs = data.chs;
    var audioData = new Array(chs);
    for (var ch = 0; ch < chs; ch++) {
        audioData[ch] = new Float32Array(data['audioData'][ch]);
    }
    var frameLength = data.frameLength;
    var dftSize = data.dftSize;
    var dftBands = dftSize / 2;
    var dft = new DFTFloat32(dftSize);
    var wf = new GaussianWindow(dftSize);
    var arrSize = w * h * 4;
    if (arrSize < 0) {
        arrSize = 0;
    }
    var imgData = new Uint8ClampedArray(arrSize);
    //console.log("Render method:");
    if (audioData && arrSize > 0) {
        var chH = Math.round(h / chs);
        var framesPerPixel = frameLength / vw;
        //console.log("Render: ", w, "x", h);
        var b = new Float32Array(dftSize);
        var sona = new Array(chs);
        var maxPsd = -Infinity;
        var p = 0;
        for (var ch = 0; ch < chs; ch++) {
            p = ch * frameLength;
            var chDataLen = audioData[ch].length;
            var x = 0;
            // initialize DFT array buffer
            sona[ch] = new Array(w);
            var framePos = 0;
            for (var pii = 0; pii < w; pii++) {
                var virtPii = l + pii;
                // Position of sample data frame is pixel position mapped to audio frame position.
                // Then "center" the frame by shifting left by half the DFT size (=dftBands)
                framePos = Math.round((virtPii * framesPerPixel) - dftBands);
                // fill DFT buffer with windowed sample values
                for (var i = 0; i < dftSize; i++) {
                    var samplePos = framePos + i;
                    // initialize for negative sample positions and out of bounds positions
                    var chDat = 0;
                    // Set audio sample if available
                    if (samplePos >= 0 && samplePos < chDataLen) {
                        chDat = audioData[ch][samplePos];
                    }
                    // apply Window
                    b[i] = chDat * wf.getScale(i);
                }
                // Calc DFT magnitudes
                var spectr = dft.processRealMagnitude(b);
                // Get maximum value of spectral energy
                for (var s = 0; s < dftBands; s++) {
                    var psd = (2 * Math.pow(spectr[s], 2)) / dftBands;
                    if (psd > maxPsd) {
                        maxPsd = psd;
                    }
                }
                // Set render model data for this pixel
                sona[ch][pii] = spectr;
            }
        }
        //maxPsd = (2 * Math.pow(max, 2)) / dftBands;
        for (var ch = 0; ch < chs; ch++) {
            for (var pii = 0; pii < w; pii++) {
                var allBlack = true;
                for (var y = 0; y < chH; y++) {
                    var freqIdx = Math.round(y * dftBands / chH);
                    // calculate the one sided power spectral density PSD (f, t) in Pa2/Hz
                    // PSD(f) proportional to 2|X(f)|2 / (t2 - t1)
                    var val = sona[ch][pii][freqIdx];
                    var psd = (2 * Math.pow(val, 2)) / dftBands;
                    // Calculate logarithmic value
                    //let psdLog = ips.dsp.DSPUtils.toLevelInDB(psd / maxPsd);
                    var linearLevel = psd / maxPsd;
                    var psdLog = 10 * Math.log(linearLevel) / Math.log(10);
                    // Fixed dynamic Range value of 70dB for now
                    var dynRangeInDb = 70;
                    var scaledVal = (psdLog + dynRangeInDb) / dynRangeInDb;
                    // are the following checks necessary for clamped array ?
                    if (scaledVal > 1.0)
                        scaledVal = 1;
                    if (scaledVal < 0.0) {
                        scaledVal = 0;
                    }
                    var rgbVal = Math.round(255 * scaledVal);
                    if (rgbVal < 0) {
                        //							System.out.println("Neg RGB val: "+rgbVal);
                        rgbVal = 0;
                    }
                    if (rgbVal > 255) {
                        rgbVal = 255;
                    }
                    rgbVal = 255 - rgbVal;
                    if (rgbVal > 0) {
                        allBlack = false;
                    }
                    var py = chH - y;
                    var dataPos = ((((ch * chH) + py) * w) + pii) * 4;
                    imgData[dataPos + 0] = rgbVal; //R
                    imgData[dataPos + 1] = rgbVal; //G
                    imgData[dataPos + 2] = rgbVal; //B
                    imgData[dataPos + 3] = 255; //A (alpha: fully opaque)
                }
                // if (allBlack) {
                //   console.log("Black: ", pii, " ", ch);
                // }
            }
        }
    }
    postMessage({ imgData: imgData, l: l, w: data.w, h: data.h, vw: vw }, [imgData.buffer]);
});
