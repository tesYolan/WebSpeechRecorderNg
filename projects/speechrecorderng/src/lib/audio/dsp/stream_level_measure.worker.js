addEventListener('message', function (_a) {
    var data = _a.data;
    var streamFinished = data.streamFinished;
    if (streamFinished) {
        postMessage({ streamFinished: true });
    }
    else {
        var chs = data.chs;
        var frameLength = null;
        var audioData = new Array(chs);
        var linLevels = new Array(chs);
        for (var ch_1 = 0; ch_1 < chs; ch_1++) {
            linLevels[ch_1] = new Float32Array(2);
            audioData[ch_1] = new Float32Array(data.audioData[ch_1]);
        }
        if (audioData) {
            for (var ch = 0; ch < chs; ch++) {
                var chData = audioData[ch];
                if (frameLength === null) {
                    frameLength = chData.length;
                }
                for (var s = 0; s < frameLength; s++) {
                    if (chData[s] < linLevels[ch][0]) {
                        linLevels[ch][0] = chData[s];
                    }
                    if (chData[s] > linLevels[ch][1]) {
                        linLevels[ch][1] = chData[s];
                    }
                }
            }
        }
        var linLevelBufs = new Array(chs);
        for (var ch_2 = 0; ch_2 < chs; ch_2++) {
            linLevelBufs[ch_2] = linLevels[ch_2].buffer;
        }
        postMessage({ streamFinished: false, frameLength: frameLength, linLevelBuffers: linLevelBufs }, linLevelBufs);
    }
});
