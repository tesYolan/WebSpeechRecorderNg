declare function postMessage(message: any, transfer?: Array<any>): void;


addEventListener('message', ({ data }) => {
  let bufLen=data.frameLength * data.chs;
  let valView = new DataView(data.buf,data.bufPos);

  let bufPos = 0;
  let hDynIntRange = 1 << (data.sampleSizeInBits - 1);
  for (let s = 0; s < data.frameLength; s++) {
    // interleaved channel data

    for (let ch = 0; ch < data.chs; ch++) {
      let srcPos=(ch*data.frameLength)+s;
      let valFlt = data.audioData[srcPos];
      let valInt = Math.round(valFlt * hDynIntRange);
      valView.setInt16(bufPos, valInt, true);
      bufPos+=2;
    }
  }
  postMessage({buf:data.buf}, [data.buf]);
})

