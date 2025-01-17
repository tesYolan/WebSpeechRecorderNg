import {
    Component,
    ViewChild,
    ChangeDetectorRef,
    AfterViewInit, Input, OnInit, ElementRef,
} from '@angular/core'

import {AudioClip, Selection} from './persistor'
import {ActivatedRoute} from "@angular/router";
import {Action} from "../action/action";
import {AudioDisplayScrollPane} from "./ui/audio_display_scroll_pane";

@Component({

  selector: 'app-audiodisplay',

  template: `

    <audio-display-scroll-pane #audioDisplayScrollPane></audio-display-scroll-pane>

    <audio-display-control [audioClip]="audioClip"
                             [playStartAction]="playStartAction"
                             [playSelectionAction]="playSelectionAction"
                            [playStopAction]="playStopAction"
    [autoPlayOnSelectToggleAction]="autoPlayOnSelectToggleAction"
    [zoomInAction]="zoomInAction"
    [zoomOutAction]="zoomOutAction"
    [zoomSelectedAction]="zoomSelectedAction"
    [zoomFitToPanelAction]="zoomFitToPanelAction"></audio-display-control>
  `,
  styles: [
      `:host {
      display: flex;
      flex-direction: column;
      position: absolute;
      bottom: 0px;
      height: 100%;
      width: 100%;
      overflow: hidden;
      padding: 20px;
      z-index: 5;
      box-sizing: border-box;
      background-color: rgba(230, 230, 230, 1.0)
    }`,`
          legend{
              margin-left: 1em; padding: 0.2em 0.8em;font-size: 0.8em;
      }`,`
        fieldset{
            border: 1px darkgray solid
      }
      `]

})
export class AudioDisplay implements OnInit,AfterViewInit {

  parentE: HTMLElement;
  private _audioClip:AudioClip

  @Input()
  playStartAction: Action<void>;
  @Input()
  playStopAction: Action<void>;
  @Input()
  playSelectionAction:Action<void>
  @Input()
  autoPlayOnSelectToggleAction:Action<boolean>

  zoomFitToPanelAction:Action<void>;
  zoomSelectedAction:Action<void>
  zoomInAction:Action<void>;
  zoomOutAction:Action<void>;

  clearSelectionAction:Action<void>

  status: string;

  audio: any;

  @ViewChild(AudioDisplayScrollPane, { static: true })
  audioDisplayScrollPane: AudioDisplayScrollPane;

  constructor(private route: ActivatedRoute, private ref: ChangeDetectorRef,private eRef:ElementRef) {
    //console.log("constructor: "+this.ac);
      this.parentE=this.eRef.nativeElement;
    this.playStartAction = new Action("Start");
    this.playSelectionAction=new Action("Play selected");
    this.playStopAction = new Action("Stop");
    this.status="Player created.";

  }

  ngOnInit(){
    this.zoomSelectedAction=this.audioDisplayScrollPane.zoomSelectedAction
    this.zoomFitToPanelAction=this.audioDisplayScrollPane.zoomFitToPanelAction
    this.zoomOutAction=this.audioDisplayScrollPane.zoomOutAction
    this.zoomInAction=this.audioDisplayScrollPane.zoomInAction
  }

  ngAfterViewInit() {

      this.layout();
      let heightListener=new MutationObserver((mrs:Array<MutationRecord>,mo:MutationObserver)=>{
          mrs.forEach((mr:MutationRecord)=>{
              if('attributes'===mr.type && ('class'===mr.attributeName || 'style'===mr.attributeName)){
                  this.layout();
              }
          })
      });
      heightListener.observe(this.parentE,{attributes: true,childList: true, characterData: true});
  }


  layout(){
    this.audioDisplayScrollPane.layout();
  }


  started() {
    console.log("Play started");
    this.status = 'Playing...';
  }


  @Input()
  set audioData(audioBuffer: AudioBuffer){
      this.audioDisplayScrollPane.audioData = audioBuffer;
      this.playStartAction.disabled = (audioBuffer==null)
  }

  @Input()
  set audioClip(audioClip: AudioClip | null) {

    let audioData:AudioBuffer=null;
    let sel:Selection=null;
    if(audioClip){
      audioData=audioClip.buffer;
      sel=audioClip.selection;
      }
    this._audioClip=audioClip
    this.audioDisplayScrollPane.audioClip = audioClip;
    //this.playStartAction.disabled = (audioData!==null)
  }

  get audioClip():AudioClip|null{
    return this._audioClip
  }

  set playFramePosition(playFramePosition:number){
      this.audioDisplayScrollPane.playFramePosition = playFramePosition
  }

  error() {
    this.status = 'ERROR';
  }

}

