declare var self: DedicatedWorkerGlobalScope;
export {};
declare function postMessage(message: any, transfer: Array<any>): void;

// Redefine some DSP classes for worker function
// See e.g. audio.math.Complex
class Complex {

  real: number;
  img: number;

  public static fromPolarForm(magnitude: number, argument: number): Complex {
    const r = Math.cos(argument) * magnitude;
    const i = Math.sin(argument) * magnitude;
    return new Complex(r, i);
  }

  constructor(real: number, img: number) {
    this.real = real;
    this.img = img;
  }

  public magnitude(): number {
    return Math.sqrt((this.real * this.real) + (this.img * this.img));
  }

  public argument(): number {
    return Math.atan2(this.img, this.real);
  }

  public add(addC: Complex): Complex {
    return new Complex(this.real + addC.real, this.img + addC.img);
  }

  public sub(subC: Complex): Complex {
    return new Complex(this.real - subC.real, this.img - subC.img);
  }

  public mult(multC: Complex): Complex {
    const multR = (this.real * multC.real) - (this.img * multC.img);
    const multI = (this.real * multC.img) + (multC.real * this.img);
    return new Complex(multR, multI);
  }

  public multReal(multF: number): Complex {
    return new Complex(this.real * multF, this.img * multF);
  }

  public div(divisor: Complex): Complex {
    const divReal = divisor.real;
    const divImg = divisor.img;
    const div = (divReal * divReal) + (divImg * divImg);
    const divisionReal = ((this.real * divReal) + (this.img * divImg)) / div;
    const divisionImg = ((divReal * this.img) - (this.real * divImg)) / div;

    return new Complex(divisionReal, divisionImg);
  }

  public divReal(divisor: number): Complex {
    const div = divisor * divisor;
    const divsionReal = (this.real * divisor) / div;
    const divsionImg = (divisor * this.img) / div;

    return new Complex(divsionReal, divsionImg);
  }

  public conjugate(): Complex {
    return new Complex(this.real, -this.img);
  }

  public equals(c: Complex): boolean {
    if (c === null) {
      return false;
    }
    return (this.real === c.real && this.img === c.img);
  }

  public toString(): string {
    return 'Real: ' + this.real + ', Img: ' + this.img;
  }
}

class DFTFloat32 {

  private n: number;
  private m: number;

  private cosLookup: Float32Array;
  private sinLookup: Float32Array;

  constructor(n: number) {
    this.n = n;
    this.m = Math.log(n) / Math.log(2);

    // if(n != (1 << m))throw new RuntimeException("length N must be power of 2");

    // lookup tables
    this.cosLookup = new Float32Array(n / 2);
    this.sinLookup = new Float32Array(n / 2);

    for (let i = 0; i < n / 2; i++) {
      const arc = (-2 * Math.PI * i) / n;
      this.cosLookup[i] = Math.cos(arc);
      this.sinLookup[i] = Math.sin(arc);
    }
  }

  public processReal(srcBuf: Float32Array): Array<Complex> {
    const x = srcBuf.slice();
    const y = new Float32Array(srcBuf.length);
    for (let yi = 0; yi < y.length; yi++) {
      y[yi] = 0.0;
    }
    this.fftCooleyTukey(x, y);
    const rc = new Array<Complex>(x.length);
    for (let i = 0; i < x.length; i++) {
      rc[i] = new Complex(x[i], y[i]);
    }
    return rc;
  }

  public processRealMagnitude(srcBuf: Float32Array): Float32Array {
    const x = srcBuf.slice();
    const y = new Float32Array(srcBuf.length);
    for (let yi = 0; yi < y.length; yi++) {
      y[yi] = 0.0;
    }
    this.fftCooleyTukey(x, y);
    const rc = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) {
      const rcc = new Complex(x[i], y[i]);
      rc[i] = rcc.magnitude();
    }
    return rc;
  }

  public fftCooleyTukey(real: Float32Array, img: Float32Array): void {
    let i: number;
    let j = 0;
    let k: number;
    let n1: number;
    let n2: number = this.n / 2;
    let a: number;
    let c: number;
    let s: number;
    let t1: number;
    let t2: number;

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
  }


  public process(t: Array<Complex>): Array<Complex> {
    const reals: Float32Array = new Float32Array(this.n);
    const imgs: Float32Array = new Float32Array(this.n);
    const trans: Array<Complex> = new Array<Complex>(this.n);
    for (let i = 0; i < this.n; i++) {
      reals[i] = t[i].real;
      imgs[i] = t[i].img;
    }
    this.fftCooleyTukey(reals, imgs);
    for (let i = 0; i < this.n; i++) {
      trans[i] = new Complex(reals[i], imgs[i]);
    }
    return trans;


  }

}

interface WindowFunction {
  getScale(i: number): number;
}

class GaussianWindow implements WindowFunction {

  public static DEFAULT_SIGMA = 0.3;
  // Gaussian window function,
  // http://reference.wolfram.com/language/ref/GaussianWindow.html
  // val=exp(-50*x*x/9) => sigma=0.3

  private buf: Float32Array;

  constructor(size: number, sigma: number = GaussianWindow.DEFAULT_SIGMA) {
    this.buf = new Float32Array(size);
    const center = (size - 1) / 2;
    for (let i = 0; i < size; i++) {
      const quot = (i - center) / (sigma * center);
      const exp = -0.5 * quot * quot;
      this.buf[i] = Math.exp(exp);
    }
  }

  getScale(i: number): number {
    return this.buf[i];
  }

}

self.onmessage = function (msg) {

  let l = msg.data.l;
  let w = msg.data.w;
  let h = msg.data.h;
  let vw = msg.data.vw;
  let chs = msg.data.chs;
  let audioData = new Array(chs);
  for (let ch = 0; ch < chs; ch++) {
    audioData[ch] = new Float32Array(msg.data['audioData'][ch]);
  }

  let frameLength = msg.data.frameLength;
  let dftSize = msg.data.dftSize;

  let dftBands = dftSize / 2;
  let dft = new DFTFloat32(dftSize);
  let wf = new GaussianWindow(dftSize);

  let arrSize=w*h*4;
  if(arrSize<0){
    arrSize=0
  }
  let imgData = new Uint8ClampedArray(arrSize);
  //console.log("Render method:");
  if (audioData && arrSize>0) {
    let chH = Math.round(h / chs);
    let framesPerPixel = frameLength / vw;
    //console.log("Render: ", w, "x", h);

    let b = new Float32Array(dftSize);
    let sona = new Array(chs);

    let maxPsd = -Infinity;
    let p = 0;
    for (let ch = 0; ch < chs; ch++) {
      p = ch * frameLength;
      let chDataLen=audioData[ch].length;
      let x = 0;
      // initialize DFT array buffer
      sona[ch] = new Array(w);
      let framePos = 0;
      for (let pii = 0; pii < w; pii++) {
        let virtPii = l + pii;
        // Position of sample data frame is pixel position mapped to audio frame position.
        // Then "center" the frame by shifting left by half the DFT size (=dftBands)
        framePos = Math.round((virtPii * framesPerPixel)-dftBands);
        // fill DFT buffer with windowed sample values
        for (let i = 0; i < dftSize; i++) {
          let samplePos=framePos + i;
          // initialize for negative sample positions and out of bounds positions
          let chDat=0;

          // Set audio sample if available
          if(samplePos>=0 && samplePos < chDataLen) {
            chDat = audioData[ch][samplePos];
          }

          // apply Window
          b[i] = chDat * wf.getScale(i);
        }
        // Calc DFT magnitudes
        let spectr = dft.processRealMagnitude(b);

        // Get maximum value of spectral energy
        for (let s = 0; s < dftBands; s++) {
          let psd = (2 * Math.pow(spectr[s], 2)) / dftBands;
          if (psd > maxPsd) {
            maxPsd = psd;
          }
        }
        // Set render model data for this pixel
        sona[ch][pii] = spectr;
      }
    }
    //maxPsd = (2 * Math.pow(max, 2)) / dftBands;

    for (let ch = 0; ch < chs; ch++) {

      for (let pii = 0; pii < w; pii++) {
        let allBlack = true;
        for (let y = 0; y < chH; y++) {
          let freqIdx = Math.round(y * dftBands / chH);
          // calculate the one sided power spectral density PSD (f, t) in Pa2/Hz
          // PSD(f) proportional to 2|X(f)|2 / (t2 - t1)
          let val = sona[ch][pii][freqIdx];
          let psd = (2 * Math.pow(val, 2)) / dftBands;
          // Calculate logarithmic value
          //let psdLog = ips.dsp.DSPUtils.toLevelInDB(psd / maxPsd);
          let linearLevel = psd / maxPsd;
          let psdLog = 10 * Math.log(linearLevel) / Math.log(10);
          // Fixed dynamic Range value of 70dB for now
          let dynRangeInDb = 70;
          let scaledVal = (psdLog + dynRangeInDb) / dynRangeInDb;

          // are the following checks necessary for clamped array ?
          if (scaledVal > 1.0)
            scaledVal = 1;
          if (scaledVal < 0.0) {
            scaledVal = 0;
          }
          let rgbVal = Math.round(255 * scaledVal);
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
          let py = chH - y;
          let dataPos = ((((ch * chH) + py) * w) + pii) * 4;
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
  postMessage({imgData: imgData, l: l, w: msg.data.w, h: msg.data.h, vw: vw}, [imgData.buffer]);
}