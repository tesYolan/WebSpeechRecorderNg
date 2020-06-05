import {
  Component,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit, Input, ElementRef,
} from '@angular/core'


import {ActivatedRoute, Params} from "@angular/router";


import {RecordingFileService} from "./recordingfile-service";
import {MatDialog} from "@angular/material/dialog";
import {AudioDisplayPlayer} from "../../../audio/audio_player";
import {AudioPlayer} from "../../../audio/playback/player";
import {AudioDisplayScrollPane} from "../../../audio/ui/audio_display_scroll_pane";
import {AudioContextProvider} from "../../../audio/context";
import {AudioClip} from "../../../audio/persistor";
import {Selection} from "../../../audio/persistor";
import {MessageDialog} from "../../../ui/message_dialog";
import {RecordingFile} from "./recording-file";
import {PromptitemUtil} from "../../script/script";
import {Action} from "../../../action/action";

@Component({

  selector: 'app-audiodisplayplayer',

  template: `      
      <h1>Recording file editing</h1>
      <p>On export or delivery the editing selection of the recording file is cut out. If no editing selection is applied the original file is exported.</p>
      
    <audio-display-scroll-pane #audioDisplayScrollPane></audio-display-scroll-pane>
      <div class="ctrlview">
        <app-recording-file-meta [recordingFile]="recordingFile"></app-recording-file-meta>
        <app-recording-file-navi [prevAction]="prevAction" [nextAction]="nextAction"></app-recording-file-navi>
    <audio-display-control [audioClip]="audioClip"
                             [playStartAction]="playStartAction"
                             [playSelectionAction]="playSelectionAction"
                             [playStopAction]="playStopAction"
                             [autoPlayOnSelectToggleAction]="ap?.autoPlayOnSelectToggleAction"
                             [zoomInAction]="zoomInAction"
                             [zoomOutAction]="zoomOutAction"
                             [zoomSelectedAction]="zoomSelectedAction"
                           [zoomFitToPanelAction]="zoomFitToPanelAction"></audio-display-control>
      </div>
      <button mat-raised-button color="accent" (click)="applySelection()" [disabled]="editSaved">{{this.applyButtonText()}}</button>
  `,
  styles: [
    `:host {
          flex: 2;
          display: flex;
          flex-direction: column;
          min-height:0;
          overflow: hidden;
      padding: 20px;
      z-index: 5;
      box-sizing: border-box;
      background-color: white;
    }`,`        
        .ctrlview{
          display: flex;
          flex-direction: row;
        }
    `,`
      audio-display-control{
        
        flex: 3;
      }
    `]

})
export class RecordingFileUI extends AudioDisplayPlayer implements AfterViewInit {

  private _recordingFileId: string | number=null;

  parentE: HTMLElement;

  aCtx: AudioContext;
  ap: AudioPlayer;
  status: string;

  currentLoader: XMLHttpRequest | null;

  audio: any;
  updateTimerId: any;
  recordingFile: RecordingFile;
  savedEditSelection:Selection;
  editSaved:boolean=true

  prevAction: Action<void>;
  nextAction: Action<void>;

  @ViewChild(AudioDisplayScrollPane)
  private ac: AudioDisplayScrollPane;

  constructor(protected recordingFileService:RecordingFileService,protected route: ActivatedRoute, protected ref: ChangeDetectorRef,protected eRef:ElementRef, protected dialog:MatDialog) {
    super(route,ref,eRef)
    this.parentE=this.eRef.nativeElement;
    this.prevAction=new Action<void>('Previous');
    this.nextAction=new Action<void>('Next');
  }



  ngAfterViewInit() {
    super.ngAfterViewInit()

    this.route.queryParams.subscribe((params: Params) => {

      let rfIdP=params['recordingFileId'];

      if(rfIdP) {
        this._recordingFileId=rfIdP
        console.log("Loading recording file ID (by query param): "+this._recordingFileId+ " referrer: "+document.referrer)

        this.ap.stop();
        this.loadRecFile()
      }
    });
    this.route.params.subscribe((params: Params) => {

      let rfIdP=params['recordingFileId'];

      if(rfIdP) {
        this._recordingFileId=rfIdP
        console.log("Loading recording file ID (by route param): "+this._recordingFileId)
        this.ap.stop();
        this.loadRecFile()
      }
    });
  }

  applyButtonText():string {
    if(this.audioClip) {
      let s = this.audioClip.selection
      if (s) {
        return "Apply current selection as editing selection";
      }else{
        return "Cancel out editing selection";
      }
    }
    // just as fallback
    return "Apply selection";
  }

  recordingAsPlainText() {
    if (this.recordingFile) {
      let r = this.recordingFile.recording;
      if (r) {
        return PromptitemUtil.toPlainTextString(r);
      }
    }
    return "n/a";
  }

  private loadRecFile() {
    let audioContext = AudioContextProvider.audioContextInstance()
    this.recordingFileService.fetchRecordingFile(audioContext,this._recordingFileId).subscribe(value => {
      console.log("Loaded");
      this.status = 'Audio file loaded.';

      this.recordingFile=value;
      let clip=new AudioClip(value.audioBuffer)
      let sel:Selection=null;
      if(value.editStartFrame!=null){
          if(value.editEndFrame!=null){
            sel=new Selection(value.editStartFrame,value.editEndFrame)
          }else{
            let ch0 = value.audioBuffer.getChannelData(0)
            let frameLength = ch0.length;
            sel=new Selection(value.editStartFrame,frameLength)
          }
      }else if(value.editEndFrame!=null){
        sel=new Selection(0,value.editEndFrame)
      }

      clip.selection=sel
      this.audioClip=clip
      this.audioClip.addSelectionObserver((clip)=>{
          let s=clip.selection

          this.editSaved=((this.savedEditSelection==null && s==null) || this.savedEditSelection!=null && this.savedEditSelection.equals(s))
      })
      this.savedEditSelection=sel
      this.editSaved=true
    },error1 => {
      this.status = 'Error loading audio file!';
    });

  }


  nextFile(){

  }

  nextFileAvail(){
    return true;
  }

  applySelection(){

    console.log("apply selection to "+this._recordingFileId)

    let sf:number=null;
    let ef:number=null;
    if(this.audioClip) {
      let s = this.audioClip.selection
      if (s) {
        sf = s.startFrame
        ef = s.endFrame
      }

      this.recordingFileService.saveEditSelection(this._recordingFileId, sf, ef).subscribe((value) => {

        },
        () => {
          this.dialog.open(MessageDialog, {

            data: {
              type: 'error',
              title: 'Save selection edit error',
              msg: "Could not save edit selection to WikiSpeech server!",
              advice: "Please check network connection and server state."
            }
          })
        },
        () => {
        // Or use returned selection value from server?
          this.savedEditSelection = s
          this.editSaved = true
        })
    }
  }

}

