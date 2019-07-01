import {Inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ApiType, SPEECHRECORDER_CONFIG, SpeechRecorderConfig} from "../../spr.config";
import {Session} from "./session";
import {UUID} from "../../utils/utils";
import {Observable} from "rxjs";
import {ProjectService} from "../project/project.service";



@Injectable()
export class SessionService {
  get uploadCount(): number {
    return this._uploadCount;
  }
  public static readonly SESSION_API_CTX='session';
  private apiEndPoint='';
  private sessionsUrl:string;
  private withCredentials:boolean=false;
  private _uploadCount=0;

  constructor(private http:HttpClient,@Inject(SPEECHRECORDER_CONFIG) private config?:SpeechRecorderConfig) {

    if(config && config.apiEndPoint) {
      this.apiEndPoint=config.apiEndPoint;
    }
    if(this.apiEndPoint !== ''){
      this.apiEndPoint=this.apiEndPoint+'/'
    }
    if(config!=null && config.withCredentials!=null){
      this.withCredentials=config.withCredentials;
    }
    this.sessionsUrl = this.apiEndPoint + SessionService.SESSION_API_CTX;
  }

  sessionObserver(id: string): Observable<Session> {

    let sessUrl = this.sessionsUrl + '/' + id;
    if (this.config && this.config.apiType === ApiType.FILES) {
      // for development and demo
      // append UUID to make request URL unique to avoid localhost server caching
      sessUrl = sessUrl + '.json?requestUUID='+UUID.generate();
    }
    return this.http.get<Session>(sessUrl,{ withCredentials: this.withCredentials });

  }


  putSessionObserver(session: Session): Observable<Session> {

    let sesssUrl = this.apiEndPoint + ProjectService.PROJECT_API_CTX + '/' + session.project + '/' + SessionService.SESSION_API_CTX + '/' + session.sessionId

    //console.log("PUT session ID: "+session.sessionId+ " status: "+session.status)
    let wrapObs = new Observable<Session>(subscriber => {
      this._uploadCount++;
      let debugDelay = 30000;
      console.log("Warning: TODO: Debug delay: " + debugDelay + " ms, upload count: " + this.uploadCount + " Remove this in version 0.12.12 !");
      window.setTimeout(() => {
        console.log("Warning: TODO: Debug delayed session object PUT, upload count: " + this.uploadCount);
        let obs = this.http.put<Session>(sesssUrl, session, {withCredentials: this.withCredentials});
        obs.subscribe((value) => {
          subscriber.next(value);
        }, error => {
          this._uploadCount--;
          console.log("Error: Session object PUT, upload count: " + this.uploadCount);
          subscriber.error(error);
        }, () => {

          console.log("Warning: TODO: Debug delay: " + debugDelay + " ms, upload count: " + this.uploadCount + " Remove this in version 0.12.12 !");

          this._uploadCount--;
          console.log("Warning: TODO: Debug delay expired, upload count now: " + this.uploadCount);
          subscriber.complete();
        });
      }, debugDelay)
    });
    return wrapObs;
  }

}



