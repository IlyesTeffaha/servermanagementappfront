import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, startWith, catchError, map, of, BehaviorSubject } from 'rxjs';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { ServerService } from './service/server.service';
import { NotifierModule } from 'angular-notifier';
import { NotificationService } from './service/notification.service';
import { ChangeDetectionStrategy } from '@angular/compiler';

@Component({

  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  // changeDetection:ChangeDetectionStrategy.OnPush,


})



export class AppComponent implements OnInit {

  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<Boolean>(false);
  isLoading$ = this.isLoading.asObservable();


  constructor(private serverService: ServerService, private notifier: NotificationService) {
  }

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);
          this.dataSubject.next(response);
          return {

            //a new server was added in the bottom in the ui so we fixed it by reversing the array of servers we got from the backend and saved it inside our global state
            dataState: DataState.LOADED_STATE, appData: {...response, data:{servers: response.data.servers.reverse()}}
          }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );

  }
  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          const index = this.dataSubject.value.data.servers.findIndex(server =>  server.id === response.data.server.id);
          this.dataSubject.value.data.servers[index] = response.data.server;
          this.notifier.onDefault(response.message);
          this.filterSubject.next('');
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.filterSubject.next('');
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: response };
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }





  saveServer(serverForm: NgForm): void {
    //start doing the spiner to indicate that something is happening in the back it's just a ui addition
    this.isLoading.next(true)
    this.appState$ = this.serverService.save$(serverForm.value as Server)
    // this.appState$ = this.serverService.save$(<Server>serverForm.value) another way to cast data type but not necessary
  
      .pipe(
        map(response => {
        this.dataSubject.next(
          {...response,data:{servers: [response.data.server, ...this.dataSubject.value.data.servers ]} }
        )
        this.notifier.onDefault(response.message);
          // this.notifier.onDefault(response.message);

          //this will close the add form modal after saving the new server in the database and getting the response then continue to run the rest of the code

        document.getElementById('closeModal').click();

        //stop the spinner after the modal is closed
        this.isLoading.next(false); 

        // to set the default value of the server status to server_down after closing the modal
        serverForm.resetForm( {status: this.Status.SERVER_DOWN} );

          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }

        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          //if we get an error we don't want the spinner to be spining because the whole thing is supposed to be stopping when an error occurs
          this.isLoading.next(false);
          this.notifier.onError(error);

          // this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }


  deleteServer(server: Server): void {
    //start doing the spiner to indicate that something is happening in the back it's just a ui addition
    this.appState$ = this.serverService.delete$(server.id)
  
  
      .pipe(
    map(response => {
        this.dataSubject.next(
          {...response,data:{servers:this.dataSubject.value.data.servers.filter(s=>s.id !==server.id)}}
        );
        this.notifier.onDefault(response.message);
        return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
        catchError((error: string) => {
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }






  printReport(type: String): void {
    this.notifier.onDefault('Report downloaded');
    if(type==="pdf"){
      window.print();

    }else{
      let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
      let tableSelect = document.getElementById('servers');
      let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
      let downloadLink = document.createElement('a');
      document.body.appendChild(downloadLink);
      downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
      downloadLink.download = 'server-report.xlsx';
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
    
  }






}
