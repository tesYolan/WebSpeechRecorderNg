import {
  Component,
  ChangeDetectorRef,
  AfterViewInit,
  ElementRef
} from '@angular/core'


import {ActivatedRoute, Router} from "@angular/router";
import {RecordingFileService} from "./recordingfile-service";
import {MatDialog} from "@angular/material/dialog";
import {Selection} from "../../../audio/persistor";
import {MessageDialog} from "../../../ui/message_dialog";
import {Action} from "../../../action/action";
import {RecordingFileViewComponent} from "./recording-file-view.component";
import {SessionService} from "../session.service";
import {RecordingService} from "../../recordings/recordings.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({

  selector: 'app-audiodisplayplayer',

  template: `      
      <h1>Recording file editing</h1>
      <p>On export or delivery the editing selection of the recording file is cut out. If no editing selection is applied the original file is exported.</p>
      
    <audio-display-scroll-pane #audioDisplayScrollPane></audio-display-scroll-pane>
      <div class="ctrlview">
        <app-recording-file-meta [sessionId]="sessionId"  [recordingFile]="recordingFile"></app-recording-file-meta>
    <audio-display-control [audioClip]="audioClip"
                             [playStartAction]="playStartAction"
                             [playSelectionAction]="playSelectionAction"
                             [playStopAction]="playStopAction"
                             [autoPlayOnSelectToggleAction]="ap?.autoPlayOnSelectToggleAction"
                             [zoomInAction]="zoomInAction"
                             [zoomOutAction]="zoomOutAction"
                             [zoomSelectedAction]="zoomSelectedAction"
                           [zoomFitToPanelAction]="zoomFitToPanelAction"></audio-display-control>
        <app-recording-file-navi [items]="availRecFiles?.length" [itemPos]="posInList" [version]="recordingFile?.version" [versions]="versions" [firstAction]="firstAction" [prevAction]="prevAction" [nextAction]="nextAction" [lastAction]="lastAction" [selectVersion]="toVersionAction" [naviInfoLoading]="naviInfoLoading"></app-recording-file-navi>
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
export class RecordingFileUI extends RecordingFileViewComponent implements AfterViewInit {

  savedEditSelection:Selection;
  editSaved:boolean=true

  constructor(protected recordingFileService:RecordingFileService,protected recordingService:RecordingService,protected sessionService:SessionService,protected router:Router,protected route: ActivatedRoute, protected ref: ChangeDetectorRef,protected eRef:ElementRef, protected dialog:MatDialog,private snackBar: MatSnackBar) {
    super(recordingFileService,recordingService,sessionService,router,route,ref,eRef,dialog)
    this.parentE=this.eRef.nativeElement;

  }

  ngAfterViewInit() {
    super.ngAfterViewInit()
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

  protected loadRecFile(rfId:number | string) {
    this.editSaved = true;
    super.loadRecFile(rfId);
  }

protected loadedRecfile() {
  super.loadedRecfile();

  this.audioClip.addSelectionObserver((clip) => {
    let s = clip.selection
    this.editSaved = ((this.savedEditSelection == null && s == null) || this.savedEditSelection != null && this.savedEditSelection.equals(s))
  })
  this.savedEditSelection = this.audioClip.selection;
  this.editSaved = true
}

  applySelection(){

    let sf:number=null;
    let ef:number=null;
    let sr=null;
    if(this.audioClip) {
      let ab=this.audioClip.buffer;
      let s = this.audioClip.selection
      if (s && ab) {
        sr= ab.sampleRate;
        sf = s.startFrame;
        ef = s.endFrame;
      }

      this.recordingFileService.saveEditSelection(this.recordingFile.recordingFileId, sr,sf, ef).subscribe((value) => {

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
          this.snackBar.open('Selection edit saved successfully.','OK',{duration: 1500})
        })
    }
  }

}

