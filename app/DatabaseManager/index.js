"use strict"

const config = {

    server:   'calendarsyncazure.database.windows.net',
    user:     'calendarAdmin',
    password: 'VMproject123',
    database: 'calendarSyncDatabase', 

    options:
    {
        
        encrypt: true
    }
};

const mssql        = require('mssql');
const dbConsts     = require('../constants').databaseErrors;
const getRequests  = require('../constants').databaseGetRequests;
const sendRequests = require('../constants').databaseSendRequests;

const crypto = require('crypto');

const DATABASE_VERSION = 1;
const NO_OLD_DATABASE  = 0; 

function seededSha256(seed, password) {

    let hashStr   = "";
    let hash      = "";

    let size = Math.min(seed.length, password.length); 
    let counter;

    for (counter = 0; counter < size; counter++) {
        hashStr += seed.charAt(counter);
        hashStr += password.charAt(counter);
    }

    if (seed.length > size) {
        hashStr += seed.slice(counter);
    } else {
        hashStr += password.slice(counter);
    }

    let hasher_sha256 = crypto.createHash('sha256');

    hasher_sha256.update(hashStr);
    hash = hasher_sha256.digest('hex');

    return hash;
}

function randomTokenString(size) {
    return crypto.randomBytes(size).toString('hex');
}

function isValidSessionInfo(database, userid, sessionToken, callback) {
    // TODO
}

function newSession(database, userid, callback) {

    let sessionToken = randomTokenString(64);

    // TODO

    //create session
}

function initDatabase(database, OLD_VERSION) {

    // TODO

    // for creating database and setting up manager
}

function toJSON(rowDataPacket) {
    return Object.values(JSON.parse(JSON.stringify(rowDataPacket)));
}

function login(username,password, callback) {

}

var db = null; //mssql.connect(config).Request();
var readyForUse = false;

class DatabaseManager {

    constructor() {

        mssql.connect(config, (error) => {

            let errorState = -1;
            let errorMSG = "";

            if (!error) {
                errorState = dbConsts.OPERATION_SUCCESS;
                errorMSG = 'connection to database achieved';
                
            } else {
                errorState = dbConsts.OPERATION_FAILED;
                errorMSG = 'failed to connect to database';

            }

            console.log(errorMSG);
            //console.log(error);

            if (errorState == dbConsts.OPERATION_SUCCESS) {

                db = new mssql.Request();

                // example of creating database by code

                //db.query("CREATE TABLE userTest ( \
                //    id INT NOT NULL IDENTITY(1,1), \
                //    username VARCHAR(30) NOT NULL, \
                //    email VARCHAR(70) NOT NULL, \
                //    passwordhash VARCHAR(70) NOT NULL, \
                //    PRIMARY KEY(id), \
                //    CONSTRAINT username_UNIQUE UNIQUE(username), \
                //    CONSTRAINT email_UNIQUE UNIQUE(email) \
                //    );", (error) => { if (error) console.log(error); }
                //);



                //example of SQL injecton free query

                //db.input("name", mssql.VarChar, "Mateo").query("SELECT * FROM Person WHERE firstName = @name", (error, result) => {
                //
                //
                //    if (error) {
                //        console.log(error);
                //    } else {
                //        console.log(result);
                //    }
                //
                //});

                readyForUse = true;
                return;
            } 

            readyForUse = false;
                  
        });
    }

    isReady() {
        return readyForUse;
    }

    getRequest(requestData, callback) {

        let requestsNeeded = [];
        let resultsMSG     = [];
        let resultsState   = [];
        let results        = [];

        let currPos    = 0;
        let length     = 0;
        let doneLength = 0;

        let needsCallback = true;

        Object.keys(getRequests).forEach((key) => { // get requested operations

            let value = getRequests[key];

            if ((requestData.id & value) == value) {

                requestsNeeded[currPos] = value;

                resultsMSG[currPos]   = "";
                resultsState[currPos] = -1;
                results[currPos]      = null;

                currPos++;
            }
        });

        length = currPos;

        //if (length == 0) {
            callback({length: length, states: resultsState, msges: resultsMSG, results: results });
            return;
        //}

        for (currPos = 0; currPos < length; currPos++) {

            switch (requestsNeeded[currPos]) {

            }
        }
    }

    sendRequest(sentData,callback) {

        let username = sentData.data.username;
        let password = sentData.data.password;
        let email    = sentData.data.email;

        let response = {
            id   : sentData.id,
            msg  : "",
            state: -1,
            data : null
        };

        switch (sentData.id) {

        }
    }
}

module.exports  = new DatabaseManager();
