import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { observable, Observable,throwError } from 'rxjs';
import { tap,catchError } from 'rxjs/operators';
import { Status } from '../enum/status.enum';

import { CustomResponse } from '../interface/custom-response';
import { Server } from '../interface/server';

@Injectable({
  providedIn: 'root'
})
export class ServerService {




private readonly apiUrl='http://localhost:8080';


  constructor(private http:HttpClient) { 


  }

  //this is the typical way to get data from the backend this is called procedural approach
// getServers():Observable<CustomResponse>{
//   return this.http.get<CustomResponse>('http://localhost:8080/server/list');
// }


//now this is the reactive approach
// servers$ is called an observable
//the difference between an observable and a promise that the promise will only retrun the data requested from the server when it's complete in a whole response , however the observable will stream the data by not waiting for it's completion and sending it in chunks the observable is not native for js or angular , it's provided by  a 3rd party library called RxJS(Reactive extension library for js) ,A Promise will return the data even if there is no one to use it.  However a Observable will return the data only when some one subscribes to it,A observable is a function which converts a ordinary stream of data into a Observable stream of data. Observable is a wrapper around ordinary stream of data.,A Observer is something which uses the  Observable data In order to use the data of Observable the Observer must subscribe to the Observer.
//ps :if The server send a list as an answer does the observer still treats it as chunks?
//No, in that case it will emit the whole list as one chunk

servers$ = <Observable<CustomResponse>> 
this.http.get<CustomResponse>(`${this.apiUrl}/server/list`).pipe(
  tap(console.log),
  catchError(this.handleError)
);

save$ = (server:Server)=> <Observable<CustomResponse>> 
this.http.post<CustomResponse>(`${this.apiUrl}/save`,server).pipe(
  tap(console.log),
  catchError(this.handleError)
);


ping$ = (ipAddress:string)=> <Observable<CustomResponse>> 
this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`).pipe(
  tap(console.log),
  catchError(this.handleError)
);

filter$ = (status:Status,reponse: CustomResponse)=> <Observable<CustomResponse>> 
new Observable<CustomResponse>(
  subscriber=>{
    console.log(reponse);
    subscriber.next(
      status ===Status.ALL ? { ...reponse, message:`Servers filtered by ${status} status`}: {
        ...reponse,
        message: reponse.data.servers.filter(server =>server.status=== status).length > 0 ? `Servers filtered by ${status=== Status.SERVER_UP ? 'SERVER_UP': 'SERVER_DOWN'} status` : `no servers of ${status} found`,
        data:{servers : reponse.data.servers.filter(server =>server.status=== status)}
      }
    );
    subscriber.complete();
  }
)
.pipe(
  tap(console.log),
  catchError(this.handleError)
);

delete$ = (serverId:number)=> <Observable<CustomResponse>> 
this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${serverId}`).pipe(
  tap(console.log),
  catchError(this.handleError)
);


private handleError(error: HttpErrorResponse): Observable<never> {
  console.log(error)
  return throwError(`an error occured - Error code : ${error.status}`);
 }


}
