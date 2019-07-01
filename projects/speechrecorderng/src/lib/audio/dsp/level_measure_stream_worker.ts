addEventListener('message', ({ data }) => {

      let streamFinished = data.streamFinished;
      if (streamFinished) {
        postMessage({streamFinished: true},"*");

      } else {
        var chs = data.chs;
        let frameLength = null;
        var audioData = new Array<Float32Array>(chs);
        var linLevels = new Array<Float32Array>(chs);
        for (let ch = 0; ch < chs; ch++) {
          linLevels[ch] = new Float32Array(2);
          audioData[ch] = new Float32Array(data.audioData[ch]);
        }

        if (audioData) {

          for (var ch = 0; ch < chs; ch++) {
            let chData = audioData[ch];
            if (frameLength === null) {
              frameLength = chData.length;
            }
            for (let s = 0; s < frameLength; s++) {
              if (chData[s] < linLevels[ch][0]) {
                linLevels[ch][0] = chData[s];
              }
              if (chData[s] > linLevels[ch][1]) {
                linLevels[ch][1] = chData[s];
              }

            }
          }
        }
        var linLevelBufs = new Array<any>(chs);
        for (let ch = 0; ch < chs; ch++) {
          linLevelBufs[ch] = linLevels[ch].buffer;
        }
        postMessage({streamFinished: false, frameLength: frameLength, linLevelBuffers: linLevelBufs},"*", linLevelBufs);
      }
})
