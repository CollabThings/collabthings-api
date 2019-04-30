/*
    Copyright (C) 2017  Juuso Vilmunen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var assert = require( 'assert' );
import CTApp from '../modules/app';
import CTApi from '../modules/api';
import CTSsb from '../modules/ssb';
import { CTMessageContent } from '../modules/common';
import { Message, TestMessages } from './messages';
import { UsersApi } from '../modules/users';

var messages = new TestMessages();

export default class UsersTests {
    api: CTApi;
    app: CTApp;
    users: UsersApi;

    constructor( napp: CTApp ) {
        this.app = napp;
        this.api = napp.getApi();
        this.users = this.api.getUsers();
    }

    async run() {
        await this.users.waitIfEmpty();

        var userlist: {} = await this.users.getFollowing();
        
        assert.equal( true, Object.keys( userlist ).length > 0 );
    }
}