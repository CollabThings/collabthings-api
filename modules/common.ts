"use strict";


export class MessageContent {
    public type: string = "defaulttype";
    public module: string = "defaultmodule";
    public text: string;
    public values:any = {};
	
    constructor() {
    }
}

export class Info {
    public hello: String = "hello";
}
