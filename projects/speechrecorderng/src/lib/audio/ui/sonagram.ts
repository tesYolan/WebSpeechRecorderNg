import {DFTFloat32} from '../../math/dft';
import {DSPUtils} from '../../dsp/utils'
import {CSSUtils} from '../../utils/css_utils'
import {Marker, Point} from './common';
import {Component, ElementRef, ViewChild} from "@angular/core";
import {CanvasLayerComponent} from "../../ui/canvas_layer_comp";
import {Dimension, Rectangle} from "../../math/2d/geometry";
import {AudioCanvasLayerComponent} from "./audio_canvas_layer_comp";


declare function postMessage(message: any, transfer: Array<any>): void;

const DEFAULT_DFT_SIZE = 1024;

@Component({

    selector: 'audio-sonagram',
    template: `
        <canvas #sonagram></canvas>
        <canvas #cursor (mouseover)="drawCursorPosition($event, true)" (mousemove)="drawCursorPosition($event, true)"
                (mouseleave)="drawCursorPosition($event, false)"></canvas>
        <canvas #marker></canvas>`,

    styles: [`canvas {
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        position: absolute;
    }`]

})
export class Sonagram extends AudioCanvasLayerComponent {

    dft: DFTFloat32;
    n: any;
    ce: HTMLDivElement;
    sonagramCanvas: HTMLCanvasElement;
    cursorCanvas: HTMLCanvasElement;
    markerCanvas: HTMLCanvasElement;
    @ViewChild('sonagram', { static: true }) sonagramCanvasRef: ElementRef;
    @ViewChild('cursor', { static: true }) cursorCanvasRef: ElementRef;
    @ViewChild('marker', { static: true }) markerCanvasRef: ElementRef;
    markers: Array<Marker>;
    private _playFramePosition: number;

    private wo: Worker | null;
    //private workerURL: string;
    private dftSize = DEFAULT_DFT_SIZE;

    constructor(private ref: ElementRef) {
        super();
        this.wo = null;
        this.audioData = null;
        this.markers = new Array<Marker>();
        this.dft = new DFTFloat32(this.dftSize);
        //let wb = new Blob(['(' + this.workerFunction.toString() + ')();'], {type: 'text/javascript'});
        //this.workerURL = window.URL.createObjectURL(wb);
    }

    ngAfterViewInit() {

        this.ce = this.ref.nativeElement;
        this.sonagramCanvas = this.sonagramCanvasRef.nativeElement;
        this.sonagramCanvas.style.zIndex = '1';
        this.cursorCanvas = this.cursorCanvasRef.nativeElement;
        this.cursorCanvas.style.zIndex = '3';
        this.markerCanvas = this.markerCanvasRef.nativeElement;
        this.markerCanvas.style.zIndex = '2';

        this.canvasLayers[0] = this.sonagramCanvas;
        this.canvasLayers[1] = this.cursorCanvas;
        this.canvasLayers[2] = this.markerCanvas;

    }

    get playFramePosition(): number {
        return this._playFramePosition;
    }

    set playFramePosition(playFramePosition: number) {
        this._playFramePosition = playFramePosition;
        // this.redraw();
        this.drawPlayPosition();
    }

    private canvasMousePos(c: HTMLCanvasElement, e: MouseEvent): Point {
        const cr = c.getBoundingClientRect();
        let p = new Point();
        p.x = e.x - cr.left;
        p.y = e.y - cr.top;
        return p;
    }

    drawCursorPosition(e: MouseEvent, show: boolean) {

        if (this.cursorCanvas) {
            const w = this.cursorCanvas.width;
            const h = this.cursorCanvas.height;
            const g = this.cursorCanvas.getContext('2d');
          if (g) {
            g.clearRect(0, 0, w, h);
            if (show) {
              const pp = this.canvasMousePos(this.cursorCanvas, e);
              let xViewPortPixelpos = e.offsetX;

              g.fillStyle = 'yellow';
              g.strokeStyle = 'yellow';
              g.beginPath();
              g.moveTo(xViewPortPixelpos, 0);
              g.lineTo(xViewPortPixelpos, h);
              g.closePath();

              g.stroke();
              if (this.audioData) {

                let framePosRound = this.viewPortXPixelToFramePosition(xViewPortPixelpos);
                g.font = '14px sans-serif';
                g.fillStyle = 'yellow';
                g.fillText(framePosRound.toString(), xViewPortPixelpos + 2, 50);
              }
            }
          }
        }
    }

    drawPlayPosition() {
        if (this.markerCanvas) {
            var w = this.markerCanvas.width;
            var h = this.markerCanvas.height;
            var g = this.markerCanvas.getContext("2d");
            if (g) {

                g.clearRect(0, 0, w, h);
                let pixelPos = this.frameToViewPortXPixelPosition(this._playFramePosition);
                if (pixelPos) {
                    g.fillStyle = 'red';
                    g.strokeStyle = 'red';
                    g.beginPath();
                    g.moveTo(pixelPos, 0);
                    g.lineTo(pixelPos, h);
                    g.closePath();
                    g.stroke();

                }
            }
        }
    }

    // layout() {
    //
    //
    //   var offW = this.sonagramCanvas.offsetWidth;
    //   var offH = this.sonagramCanvas.offsetHeight;
    //   this.layoutBounds(0, 0, offW, offH, true);
    // }


    // layoutBounds(left: number, top: number, offW: number, offH: number, virtualWidth:number,redraw: boolean) {
    //
    //   const leftStr = left.toString() + 'px';
    //   this.sonagramCanvas.style.left = leftStr;
    //   const topStr = top.toString() + 'px';
    //   this.sonagramCanvas.style.top = topStr;
    //   this.cursorCanvas.style.top = topStr;
    //   this.markerCanvas.style.top = topStr;
    //
    //   if (offW) {
    //     const wStr = offW.toString() + 'px';
    //     if (redraw) {
    //
    //       this.cursorCanvas.width = offW;
    //       this.markerCanvas.width = offW;
    //     }
    //     this.sonagramCanvas.style.width = wStr;
    //     this.cursorCanvas.style.width = wStr;
    //     this.markerCanvas.style.width = wStr;
    //   }
    //   if (offH) {
    //     const hStr = offH.toString() + 'px';
    //     if (redraw) {
    //       this.cursorCanvas.height = offH;
    //       this.markerCanvas.height = offH;
    //     }
    //     this.sonagramCanvas.style.height = hStr;
    //     this.cursorCanvas.style.height = hStr;
    //     this.markerCanvas.style.height = hStr;
    //
    //   }
    //   if (redraw) {
    //     //this.redraw();
    //     if (offW > 0) {
    //       if (offH > 0) {
    //         this.startDraw(left,top,offW, offH,virtualWidth);
    //       }
    //     }
    //   }
    // }


    workerFunction() {


    }

    startDraw(clear = true) {
        if (clear) {
            this.sonagramCanvas.style.left = Math.round(this.bounds.position.left).toString() + 'px';
            let intW = Math.round(this.bounds.dimension.width)
            let intH = Math.round(this.bounds.dimension.height)
            this.sonagramCanvas.width = intW;
            this.sonagramCanvas.height = intH;

            let g = this.sonagramCanvas.getContext("2d");
            if (g) {
                //g.clearRect(0, 0,w, h);
                g.fillStyle = "white";
                g.fillRect(0, 0, intW, intH);
            }
        }
        this.startRender();
    }

    private startRender() {

        if (this.wo) {
            this.wo.terminate();
            this.wo = null;

        }
        if (this.bounds) {
            let w = Math.round(this.bounds.dimension.width);
            let h = Math.round(this.bounds.dimension.height);


            if (this.audioData && w>0 && h>0) {

                //this.wo = new Worker(this.workerURL);
                this.wo = new Worker('./worker/sonagram.worker', { type: `module` });
                let chs = this.audioData.numberOfChannels;

                let frameLength = this.audioData.getChannelData(0).length;
                let ada = new Array<ArrayBuffer>(chs);
                for (let ch = 0; ch < chs; ch++) {
                    // Need a copy here for the worker, otherwise this.audioData is not accessible after posting to the worker
                    ada[ch] = this.audioData.getChannelData(ch).buffer.slice(0);
                }
                let start = Date.now();
                if (this.wo) {
                    this.wo.onmessage = (me) => {
                        this.drawRendered(me);
                        if (this.wo) {
                            this.wo.terminate();
                        }
                        this.wo = null;
                    }
                }
                if (this.markerCanvas) {
                    let g = this.markerCanvas.getContext("2d");
                    if (g) {
                        g.fillText("Rendering...", 10, 20);
                    }

                }
                this.wo.postMessage({
                    audioData: ada,
                    l: Math.round(this.bounds.position.left),
                    w: w,
                    h: h,
                    vw: Math.round(this.virtualDimension.width),
                    chs: chs,
                    frameLength: frameLength,
                    dftSize: this.dftSize
                }, ada);
            } else {
                let g = this.sonagramCanvas.getContext("2d");
                if (g) {
                    g.clearRect(0, 0, w, h);
                }
            }
        }
    }

    drawRendered(me: MessageEvent) {
        if (this.sonagramCanvas) {

            this.sonagramCanvas.width = me.data.w;
            this.sonagramCanvas.height = me.data.h;
            let g = this.sonagramCanvas.getContext("2d");
            if (g) {
                let imgDataArr: Uint8ClampedArray = me.data.imgData;
                if (me.data.w > 0 && me.data.h > 0) {
                    let imgData = g.createImageData(me.data.w, me.data.h);
                    imgData.data.set(imgDataArr);
                    g.putImageData(imgData, 0, 0);
                }
            }
        }

        this.drawPlayPosition();
    }

    // synchronous draw (not used anymore)
    redraw() {

        let g = this.sonagramCanvas.getContext("2d");

        let w = this.sonagramCanvas.width;
        let h = this.sonagramCanvas.height;
        if (g) {
            g.clearRect(0, 0, w, h);
            g.fillStyle = "white";
            g.fillRect(0, 0, w, h);
            if (this.audioData) {
                let spectSize = Math.floor(this.dftSize / 2)
                let chs = this.audioData.numberOfChannels;
                let chH = h / chs;

                let frameLength = this.audioData.getChannelData(0).length;

                let framesPerPixel = frameLength / w;
                let y = 0;
                // TODO
                let b = new Float32Array(this.dftSize)

                let sona = new Array<Array<Float32Array>>(chs);
                let max = 0;
                let maxPsd = -Infinity;
                for (let ch = 0; ch < chs; ch++) {
                    let x = 0;
                    sona[ch] = new Array<Float32Array>(w);

                    let chData = this.audioData.getChannelData(ch);
                    // TODO center buffer

                    let framePos = 0;
                    for (let pii = 0; pii < w; pii++) {
                        framePos = Math.round(pii * framesPerPixel);
                        // calculate DFT at pixel position
                        for (let i = 0; i < this.dftSize; i++) {
                            let chDat = chData[framePos + i];
                            b[i] = chDat;
                        }
                        let spectr = this.dft.processRealMagnitude(b);
                        sona[ch][pii] = spectr;
                        let pMax = Math.max.apply(null, spectr);
                        if (pMax > max) {
                            max = pMax;
                        }

                        for (let s = 0; s < spectSize; s++) {
                            let psd = (2 * Math.pow(spectr[s], 2)) / spectSize;
                            if (psd > maxPsd) {
                                maxPsd = psd;
                            }
                        }
                    }
                }
                //console.log("max: ", max);
                maxPsd = (2 * Math.pow(max, 2)) / spectSize;
                for (let ch = 0; ch < chs; ch++) {

                    let framePos = 0;
                    for (let pii = 0; pii < w; pii++) {
                        framePos = pii * framesPerPixel;

                        for (let y = 0; y < h; y++) {
                            let freqIdx = Math.round(y * spectSize / h);

                            // calculate the one sided power spectral density PSD (f, t) in Pa2/Hz
                            // PSD(f) proportional to 2|X(f)|2 / (t2 - t1)
                            let val = sona[ch][pii][freqIdx];
                            let psd = (2 * Math.pow(val, 2)) / spectSize;

                            // Calculate logarithmic
                            let psdLog = DSPUtils.toLevelInDB(psd / maxPsd);
                            let dynRangeInDb = 70;
                            let scaledVal = (psdLog + dynRangeInDb) / dynRangeInDb;

                            if (scaledVal > 1)
                                scaledVal = 1;
                            if (scaledVal < 0) {
                                scaledVal = 0;
                            }
                            let rgbVal = (255 * scaledVal);
                            if (rgbVal < 0) {
//							System.out.println("Neg RGB val: "+rgbVal);
                                rgbVal = 0;
                            }
                            if (rgbVal > 255) {
                                rgbVal = 255;
                            }
                            rgbVal = 255 - rgbVal;
                            let colorStr = CSSUtils.toColorString(rgbVal, rgbVal, rgbVal);
                            g.fillStyle = colorStr;
                            g.fillRect(pii, chH - y, 1, 1);
                        }
                    }
                }
                this.drawPlayPosition();
            }
        }
    }


    setData(audioData: AudioBuffer | null) {
        this.audioData = audioData;
        this.playFramePosition = 0;
        //this.redraw();
        //this.startRender();
    }


}

