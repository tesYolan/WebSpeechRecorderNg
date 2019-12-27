addEventListener('message', function (_a) {
    var data = _a.data;
    var bufLen = data.frameLength * data.chs;
    var valView = new DataView(data.buf, data.bufPos);
    var bufPos = 0;
    var hDynIntRange = 1 << (data.sampleSizeInBits - 1);
    for (var s = 0; s < data.frameLength; s++) {
        // interleaved channel data
        for (var ch = 0; ch < data.chs; ch++) {
            var srcPos = (ch * data.frameLength) + s;
            var valFlt = data.audioData[srcPos];
            var valInt = Math.round(valFlt * hDynIntRange);
            valView.setInt16(bufPos, valInt, true);
            bufPos += 2;
        }
    }
    postMessage({ buf: data.buf }, [data.buf]);
});
