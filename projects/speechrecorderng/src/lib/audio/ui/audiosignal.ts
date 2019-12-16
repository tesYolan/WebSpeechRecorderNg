import {Marker, Point} from './common'
import {Component, ViewChild, ElementRef, Output, EventEmitter, Input, HostListener} from '@angular/core';
import {CanvasLayerComponent} from "../../ui/canvas_layer_comp";
import {Dimension, Rectangle} from "../../math/2d/geometry";
import {AudioCanvasLayerComponent} from "./audio_canvas_layer_comp";

declare function postMessage(message: any, transfer: Array<any>): void;


@Component({

  selector: 'audio-signal',
  template: `
    <canvas #audioSignal></canvas>
    <canvas #cursor (mousedown)="selectionStart($event)" (mouseover)="updateCursorCanvas($event)" (mousemove)="updateCursorCanvas($event)"
            (mouseleave)="updateCursorCanvas($event, false)"></canvas>
    <canvas #marker></canvas>`,

  styles: [`canvas {
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    position: absolute;
  }`]

})
export class AudioSignal extends AudioCanvasLayerComponent{

  n: any;
  ce: HTMLDivElement;
  @ViewChild('audioSignal') audioSignalCanvasRef: ElementRef;
  //@ViewChild('cursor') cursorCanvasRef: ElementRef;
  @ViewChild('marker') playPosCanvasRef: ElementRef;

  signalCanvas: HTMLCanvasElement;

  markerCanvas: HTMLCanvasElement;

  //markers: Array<Marker>;
  private _playFramePosition: number;
  private wo: Worker | null;
  private workerURL: string;



  constructor(private ref: ElementRef) {
    super();
    this.wo = null;
    let wb = new Blob(['(' + this.workerFunction.toString() + ')();'], {type: 'text/javascript'});
    this.workerURL = window.URL.createObjectURL(wb);
    this._audioData = null;
    //this.markers = new Array<Marker>();
  }

  ngAfterViewInit() {

    this.ce = this.ref.nativeElement;
    this.signalCanvas = this.audioSignalCanvasRef.nativeElement;
    this.signalCanvas.style.zIndex = '1';
    this.markerCanvas = this.playPosCanvasRef.nativeElement;
    this.markerCanvas.style.zIndex = '2';
    this.cursorCanvas = this.cursorCanvasRef.nativeElement;
    this.cursorCanvas.style.zIndex = '3';


    this.canvasLayers[0]=this.signalCanvas;
    this.canvasLayers[1]=this.cursorCanvas;
    this.canvasLayers[2]=this.markerCanvas;

  }




  get playFramePosition(): number {
    return this._playFramePosition;
  }

  set playFramePosition(playFramePosition: number) {
    this._playFramePosition = playFramePosition;
    this.drawPlayPosition();
  }



  drawPlayPosition() {
    if (this.markerCanvas) {
      let w = this.markerCanvas.width;
      let h = this.markerCanvas.height;
      let g = this.markerCanvas.getContext("2d");
      if (g) {
        g.clearRect(0, 0, w, h);
        let pixelPos=this.frameToViewPortXPixelPosition(this._playFramePosition);
        if(pixelPos){
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

  workerFunction() {
    self.onmessage = function (msg) {

      let audioData = msg.data.audioData;
      let l=msg.data.l;
      let w = msg.data.w;
      let h = msg.data.h;
      let vw=msg.data.vw;
      let chs = msg.data.chs;
      let frameLength = msg.data.frameLength;
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


      postMessage({psMinMax: psMinMax, l:msg.data.l,t:msg.data.t,w: msg.data.w, h: msg.data.h, chs: msg.data.chs}, [psMinMax.buffer]);
    }
  }

  startDraw(clear = true) {
    if (clear) {

      this.signalCanvas.style.left = Math.round(this.bounds.position.left).toString() + 'px';
      this.signalCanvas.width = Math.round(this.bounds.dimension.width);
      this.signalCanvas.height = Math.round(this.bounds.dimension.height);

      let g = this.signalCanvas.getContext("2d");
      if (g) {
        //g.clearRect(0, 0,w, h);
        g.fillStyle = "black";
        g.fillRect(0, 0, Math.round(this.bounds.dimension.width), Math.round(this.bounds.dimension.height));
      }
    }
    this.startRender();
    this.drawCursorLayer()
  }


  private startRender() {

    if (this.wo) {
      this.wo.terminate();
      this.wo = null;
    }
    if (this.bounds && this.bounds.dimension) {

      let w = Math.round(this.bounds.dimension.width);
      let h = Math.round(this.bounds.dimension.height);

      if (this._audioData && w>0 && h>0) {
        this.wo = new Worker(this.workerURL);

        let chs = this._audioData.numberOfChannels;

        let frameLength = this._audioData.getChannelData(0).length;
        // if(frameLength != this.audioData.getChannelData(1).length){
        //   alert("Ungleiche Länge");
        // }
        let ad = new Float32Array(chs * frameLength);
        for (let ch = 0; ch < chs; ch++) {
          ad.set(this._audioData.getChannelData(ch), ch * frameLength);
        }
        //let start = Date.now();
        if (this.wo) {
          this.wo.onmessage = (me) => {
            //console.log("As rendertime: ", Date.now() - start);
            this.drawRendered(me);
            if (this.wo) {
              this.wo.terminate();
            }
            this.wo = null;
          }
        }
        this.wo.postMessage({
          l: Math.round(this.bounds.position.left),
          t: Math.round(this.bounds.position.top),
          w: w,
          h: h,
          vw: Math.round(this.virtualDimension.width),
          chs: chs,
          frameLength: frameLength,
          audioData: ad
        }, [ad.buffer]);
      } else {
        let g = this.signalCanvas.getContext("2d");
        if (g) {
          g.clearRect(0, 0, w, h);
        }
      }
    }
  }


  drawRendered(me: MessageEvent) {

    this.signalCanvas.style.left=me.data.l.toString()+'px';
    this.signalCanvas.width = me.data.w;
    this.signalCanvas.height = me.data.h;
    let g = this.signalCanvas.getContext("2d");
    if (g) {
      g.clearRect(0, 0, me.data.w, me.data.h);
      g.fillStyle = "black";
      g.fillRect(0, 0, me.data.w, me.data.h);
      let pointsLen = me.data.w * me.data.chs;
      // one for min one for max
      let arrLen = pointsLen * 2;
      if (this._audioData) {
        let std = Date.now();

        let chH = me.data.h / me.data.chs;

        let y = 0;
        for (let ch = 0; ch < me.data.chs; ch++) {
          let x = 0;

          let psMinPos = ch * me.data.w;
          let psMaxPos = pointsLen + psMinPos;

          g.fillStyle = 'green';
          g.strokeStyle = 'green';

          // draw audio signal as single polygon
          g.beginPath();
          g.moveTo(0, y + (chH / 2) + me.data.psMinMax[psMaxPos] * chH / 2);

          for (let pii = 0; pii < me.data.w; pii++) {
            let psMax = me.data.psMinMax[psMaxPos + pii];
            let pv = psMax * chH / 2;
            let yd=y + (chH / 2) - pv;
            //console.log("LineTo: : "+pii+" "+yd)
            g.lineTo(pii, yd);
          }
          let revPixelStart=me.data.w-1;

          for (let pii = revPixelStart; pii >= 0; pii--) {
            let psMin = me.data.psMinMax[psMinPos + pii];
            let pv = psMin * chH / 2;
            let yd=y + (chH / 2) - pv;
            //console.log("LineTo: : "+pii+" "+yd)
            g.lineTo(pii, yd);
          }
          g.closePath();

          g.fill();
          g.stroke();
          y += chH;
        }

        //this.drawPlayPosition();
      }
    }
  }

  redraw() {

    let g = this.signalCanvas.getContext("2d");
    if (g) {
      let w = this.signalCanvas.width;
      let h = this.signalCanvas.height;
      g.clearRect(0, 0, w, h);
      g.fillStyle = "black";
      g.fillRect(0, 0, w, h);
      if (this._audioData) {
        let std = Date.now();
        let chs = this._audioData.numberOfChannels;
        let chH = h / chs;

        let frameLength = this._audioData.getChannelData(0).length;

        let framesPerPixel = frameLength / w;
        let y = 0;
        for (let ch = 0; ch < chs; ch++) {
          let x = 0;
          let psMin = new Float32Array(w);
          let psMax = new Float32Array(w);
          let framePos = 0;
          for (let pii = 0; pii < w; pii++) {
            let pMin = 0;
            let pMax = 0;

            // calculate pixel min/max amplitude
            for (let ai = 0; ai < framesPerPixel; ai++) {
              //let framePos=(pii*framesPerPixel)+ai;
              let a = this._audioData.getChannelData(ch)[framePos++];

              if (a < pMin) {
                pMin = a;
              }
              if (a > pMax) {
                pMax = a;
              }
            }
            psMin[pii] = pMin;
            psMax[pii] = pMax;
            //console.log("Min: ", pMin, " max: ", pMax);

          }

          g.fillStyle = 'green';
          g.strokeStyle = 'green';

          // draw audio signal as single polygon
          g.beginPath();
          g.moveTo(0, y + (chH / 2) + psMin[0] * chH / 2);

          for (let pii = 0; pii < w; pii++) {
            let pv = psMin[pii] * chH / 2;
            //console.log("Min: ",pv);
            g.lineTo(pii, y + (chH / 2) + pv);
          }
          for (let pii = w; pii >= 0; pii--) {
            let pv = psMax[pii] * chH / 2;
            //console.log("Max: ",pv);
            g.lineTo(pii, y + (chH / 2) + pv);
          }
          g.closePath();
          //g.lineTo()
          g.fill();
          g.stroke();
          g.fillStyle = "yellow";
          g.stroke();
          y += chH;
        }

        //this.drawPlayPosition();
      }
    }
  }

  setData(audioData: AudioBuffer | null) {
    this._audioData = audioData;
    this.playFramePosition = 0;
  }



}

