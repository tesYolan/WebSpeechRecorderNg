
//declare var self: DedicatedWorkerGlobalScope;
//export {};
declare function postMessage(message: any, transfer: Array<any>): void;

addEventListener('message', ({ data }) => {

  let audioData = data.audioData;
  let l= data.l;
  let w = data.w;
  let h = data.h;
  let vw = data.vw;
  let chs = data.chs;
  let frameLength = data.frameLength;
  let psMinMax= new Float32Array(0);

  if(audioData && w>=0 && vw>0) {

    let framesPerPixel = frameLength / vw;

    let y = 0;
    let pointsLen = w * chs;
    // one for min one for max
    let arrLen = pointsLen * 2;
    psMinMax = new Float32Array(arrLen);
    let chFramePos = 0;
    for (let ch = 0; ch < chs; ch++) {
      let x = 0;

      chFramePos = ch * frameLength;
      for (let pii = 0; pii < w; pii++) {
        let virtPii=l+pii;
        let pMin = Infinity;
        let pMax = -Infinity;
        let pixelFramePos = Math.round(chFramePos + (virtPii * framesPerPixel));

        // calculate pixel min/max amplitude
        for (let ai = 0; ai < framesPerPixel; ai++) {
          let framePos = pixelFramePos + ai;

          let a = 0;
          if(framePos>=0 && framePos<audioData.length){
            a=audioData[framePos];
          }
          if (a < pMin) {
            pMin = a;
          }
          if (a > pMax) {
            pMax = a;
          }
        }

        let psMinPos = ch * w + pii;
        psMinMax[psMinPos] = pMin;
        let psMaxPos = pointsLen + psMinPos;
        psMinMax[psMaxPos] = pMax;

      }

    }
  }


  postMessage({psMinMax: psMinMax, l:data.l,t:data.t,w: data.w, h: data.h, chs: data.chs}, [psMinMax.buffer]);
})