addEventListener('message', function (_a) {
    var data = _a.data;
    var chs = data.chs;
    var bufferFrameLength = data.bufferFrameLength;
    var audioData = new Array(chs);
    var linLevels = new Array(chs);
    for (var ch_1 = 0; ch_1 < chs; ch_1++) {
        audioData[ch_1] = new Float32Array(data.audioData[ch_1]);
    }
    var frameLength = audioData[0].length;
    var bufferCount = Math.ceil(frameLength / bufferFrameLength);
    for (var ch_2 = 0; ch_2 < chs; ch_2++) {
        linLevels[ch_2] = new Float32Array(bufferCount * 2);
    }
    if (audioData && chs > 0) {
        for (var ch = 0; ch < chs; ch++) {
            var chData = audioData[ch];
            for (var s = 0; s < frameLength; s++) {
                var bi = Math.floor(s / bufferFrameLength);
                var lvlArrPos = bi * 2;
                var bs = s % bufferFrameLength;
                if (chData[s] < linLevels[ch][lvlArrPos]) {
                    linLevels[ch][lvlArrPos] = chData[s];
                }
                lvlArrPos++;
                if (chData[s] > linLevels[ch][lvlArrPos]) {
                    linLevels[ch][lvlArrPos] = chData[s];
                }
            }
        }
        var linLevelBufs = new Array(chs);
        for (var ch_3 = 0; ch_3 < chs; ch_3++) {
            linLevelBufs[ch_3] = linLevels[ch_3].buffer;
        }
        postMessage({
            bufferFrameLength: bufferFrameLength,
            frameLength: frameLength,
            linLevelBuffers: linLevelBufs
        }, linLevelBufs);
    }
});
