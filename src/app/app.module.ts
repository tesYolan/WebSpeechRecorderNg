import { BrowserModule } from '@angular/platform-browser';
import { NgModule} from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { StartComponent} from "./start/start";
import {AudioDisplay} from '../../projects/speechrecorderng/src/lib/audio/audio_display';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import {SpeechrecorderngModule} from "../../projects/speechrecorderng/src/lib/speechrecorderng.module";
import {SPR_CFG} from "./app.config";
import {FlexLayoutModule} from "@angular/flex-layout";
import {SessionsComponent} from "./session/sessions";
import {AudioDisplayPlayer} from "../../projects/speechrecorderng/src/lib/audio/audio_player";
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';



const appRoutes: Routes = [

  { path: 'session',
    component: SessionsComponent
  },
    { path: 'test',
        redirectTo: 'session/',
        pathMatch: 'full'
    },
    { path: 'audio_display', component: AudioDisplayPlayer
    },
  { path: '**', component: StartComponent  }
];

@NgModule({
  declarations: [
    AppComponent,StartComponent,SessionsComponent
  ],

  imports: [
      RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' }),FlexLayoutModule,BrowserAnimationsModule,MatFormFieldModule,MatInputModule, MatToolbarModule,MatMenuModule,MatIconModule,MatButtonModule,MatDialogModule,

    BrowserModule,SpeechrecorderngModule.forRoot(SPR_CFG)
  ],
  providers: [],

  bootstrap: [AppComponent]
})
export class AppModule { }

