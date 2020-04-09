const pull = require( 'pull-stream' );
import * as fs from 'fs';
import * as path from 'path'

import express from 'express';

import * as common from './common';
import CTSsb from './ssb';
import { CTApps, CTAppInfo } from './apps';

export class UsersApi {
    ssb: CTSsb;
    users: { [key: string]: User } = {};
    listeners: Function[] = [];

    constructor( nssb: CTSsb ) {
        this.ssb = nssb;
    }

    addListener( f: Function ) {
        this.listeners.push( f );
    }

    getAppInfo(): CTAppInfo {
        var self = this;
        var info: CTAppInfo = new CTAppInfo();

        info.name = "users";

        console.log( "CTApi initializing users app" );

        info.api = ( exp: express.Application ) => {
            exp.get( "/" + info.name, function( req, res ) {
                if ( Object.keys( self.users ).length == 0 ) {
                    console.log( "Users list empty. Responding later." );
                    setTimeout(() => {
                        self.getFollowing().then(( users ) => {
                            res.send( JSON.stringify( users ) );
                        } );
                    }, 2000 );
                } else {
                    self.getFollowing().then(( users ) => {
                        res.send( JSON.stringify( users ) );
                    } );
                }
            } );

            exp.get( "/user/:userid", function( req, res ) {
                res.send( JSON.stringify( self.getUser( req.params.userid ) ) );
            } );

            exp.get( "/users/follow/:userid", function( req, res ) {
                console.log( "CTUsers Follow " + req.params.userid );
                res.send( JSON.stringify( self.ssb.follow( req.params.userid ) ) );
            } );

            exp.get( "/me", function( req, res ) {
                res.send( JSON.stringify( self.getInfo() ) );
            } );
        };

        // to update about -info of users
        setTimeout(() => {
            self.getFollowing();
        }, 1000 );

        return info;
    }

    getInfo(): any {
        var selfinfo: { [key: string]: string } = {};

        selfinfo['userid'] = this.ssb.getUserID();
        selfinfo['hello'] = "Users";
        return selfinfo;
    }

    async getFollowing(): Promise<{}> {
        var userid: string = this.ssb.getUserID();

        try {
            var contacts = await this.ssb.getSbot().contacts.get();
            console.log( "ssb contacts count:" + Object.keys( contacts ).length );
            console.log( "ssb contacts count:" + JSON.stringify( contacts[this.ssb.getUserID()] ) );

            var contact: { [key: string]: any } = contacts[userid];
            if ( contact ) {
                var following: { [key: string]: any } = contact['following'];

                for ( var f in following ) {
                    this.updateAbout( f );
                }

                console.log( "resolving following " + JSON.stringify( this.users ) );
            }
        } catch (e) {
            console.log("getFollowing ERROR " + e);
        }
        return this.users;
    }

    updateAbout( userid: string ) {
        var user: User = this.getUser( userid );
        this.ssb.getSbot().about.latestValue( { key: 'name', dest: userid }, ( err: string, about: any ) => {
            console.log( "about userid:" + userid + " " + JSON.stringify( about ) );
            user.name = about;
        } );
        this.ssb.getSbot().about.latestValue( { key: 'description', dest: userid }, ( err: string, about: any ) => {
            console.log( "about userid:" + userid + " " + JSON.stringify( about ) );
            user.description = about;
        } );
    }

    async init() {
        // nothing to do
    }

    async waitIfEmpty() {
        var counter: number = 0;
        while ( counter++ < 1 && this.isEmpty() ) {
            // TODO this is stupid but I'm not sure how this should be done.
            console.log( "users empty!" );
            await this.delay( 2000 );
        }
    }

    private isEmpty(): Boolean {
        return Object.keys( this.users ).length == 0;
    }

    public checkAuthor( author: string ): boolean {
        // typical ssb ID?
        if ( author.length < 20 || !author.startsWith( "@" ) || author.indexOf( "=.ed" ) < 10 ) {
            console.log( "user id not accepted " + author );
            return false;
        } else if ( typeof ( this.users[author] ) == 'undefined' ) {
            console.log( "adding user " + author + " current count:" + Object.keys( this.users ).length );
            var user: User = new User();
            this.users[author] = user;
            user.userid = author;
        }
        return true;
    }

    public getUser( author: string ): User {
        this.checkAuthor( author );
        return this.users[author];
    }

    async handleContact( author: string, content: any ) {
        if ( author == this.ssb.getUserID() ) {
            console.log( "contact msg:" + JSON.stringify( content ) );
            if ( this.users[content.contact] ) {
                if ( content.following == true ) {
                    this.getUser( content.contact ).following = true;
                    this.fireFollowed( content.contact );
                } else if ( content.following == false ) {
                    this.getUser( content.contact ).following = false;
                } else {
                    console.log( "unknown following value" );
                }
            } else {
                console.log( "unknown user" );
            }
        }
    }

    fireFollowed( contact: string ) {
        for ( var i in this.listeners ) {
            var l: Function = this.listeners[i];
            l( contact, true );
        }
    }

    async delay( ms: number ) {
        return new Promise( resolve => setTimeout( resolve, ms ) );
    }

    stop() { }
}

class User {
    userid: string;
    name: string;
    description: string;
    following: boolean;
}

class CTContactListener {
    following: Function;
    unfollowing: Function;
}