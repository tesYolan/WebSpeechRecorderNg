declare function postMessage(message: any, transfer?: Array<any>): void;


addEventListener('message', ({ data }) => {

  let chs = data.chs;
  let bufferFrameLength = data.bufferFrameLength;

  var audioData = new Array<Float32Array>(chs);
  var linLevels = new Array<Float32Array>(chs);

  for (let ch = 0; ch < chs; ch++) {

    audioData[ch] = new Float32Array(data.audioData[ch]);
  }
  let frameLength = audioData[0].length;
  let bufferCount = Math.ceil(frameLength / bufferFrameLength);
  for (let ch = 0; ch < chs; ch++) {
    linLevels[ch] = new Float32Array(bufferCount * 2);
  }
  if (audioData && chs > 0) {
    for (var ch = 0; ch < chs; ch++) {
      let chData = audioData[ch];

      for (let s = 0; s < frameLength; s++) {
        let bi = Math.floor(s / bufferFrameLength);
        let lvlArrPos = bi * 2;
        let bs = s % bufferFrameLength;

        if (chData[s] < linLevels[ch][lvlArrPos]) {
          linLevels[ch][lvlArrPos] = chData[s];
        }
        lvlArrPos++;
        if (chData[s] > linLevels[ch][lvlArrPos]) {
          linLevels[ch][lvlArrPos] = chData[s];
        }
      }
    }
    var linLevelBufs = new Array<any>(chs);
    for (let ch = 0; ch < chs; ch++) {
      linLevelBufs[ch] = linLevels[ch].buffer;
    }
    postMessage({
      bufferFrameLength: bufferFrameLength,
      frameLength: frameLength,
      linLevelBuffers: linLevelBufs
    }, linLevelBufs);

  }
})

