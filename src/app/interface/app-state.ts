import { DataState } from "../enum/data-state.enum";

export interface AppState<T>{



dataState:DataState;
//whatever will be passed in that appstate diamond will be the appdata type
appData?:T; 
error?:string;

//since we can't get the data and the error at the same time , we have to put them as optional so like that only one of them will be passed at a time


}