addEventListener('message', function (_a) {
    var data = _a.data;
    var audioData = data.audioData;
    var l = data.l;
    var w = data.w;
    var h = data.h;
    var vw = data.vw;
    var chs = data.chs;
    var frameLength = data.frameLength;
    var psMinMax = new Float32Array(0);
    if (audioData && w >= 0 && vw > 0) {
        var framesPerPixel = frameLength / vw;
        var y = 0;
        var pointsLen = w * chs;
        // one for min one for max
        var arrLen = pointsLen * 2;
        psMinMax = new Float32Array(arrLen);
        var chFramePos = 0;
        for (var ch = 0; ch < chs; ch++) {
            var x = 0;
            chFramePos = ch * frameLength;
            for (var pii = 0; pii < w; pii++) {
                var virtPii = l + pii;
                var pMin = Infinity;
                var pMax = -Infinity;
                var pixelFramePos = Math.round(chFramePos + (virtPii * framesPerPixel));
                // calculate pixel min/max amplitude
                for (var ai = 0; ai < framesPerPixel; ai++) {
                    var framePos = pixelFramePos + ai;
                    var a = 0;
                    if (framePos >= 0 && framePos < audioData.length) {
                        a = audioData[framePos];
                    }
                    if (a < pMin) {
                        pMin = a;
                    }
                    if (a > pMax) {
                        pMax = a;
                    }
                }
                var psMinPos = ch * w + pii;
                psMinMax[psMinPos] = pMin;
                var psMaxPos = pointsLen + psMinPos;
                psMinMax[psMaxPos] = pMax;
            }
        }
    }
    postMessage({ psMinMax: psMinMax, l: data.l, t: data.t, w: data.w, h: data.h, chs: data.chs }, [psMinMax.buffer]);
});
