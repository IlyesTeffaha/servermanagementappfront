import { Server } from "./server";

export interface CustomResponse {

    timeStamp:Date;
    statusCode:number;
    status:string;
    reason:string;
    message:string;
    developerMessage:string;
    //the question mark let's us tell typescript that these things are optional
    data:{servers?:Server[],server?:Server};
}