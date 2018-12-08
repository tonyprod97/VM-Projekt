"use strict"

const config = {

    server:   'calendarsyncazure.database.windows.net',
    user:     'calendarAdmin',
    password: 'VMproject123',
    database: 'calendarSyncDatabase', 

    options: {
        encrypt: true
    }
};

const mssql        = require('mssql');
const dbConsts     = require('../constants').databaseErrors;
const getRequests  = require('../constants').databaseGetRequests;
const sendRequests = require('../constants').databaseSendRequests;

const crypto = require('crypto');

const userTable    = 'Profile';
const sessionTable = 'Session';

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

function createUser(database, email, password, callback) {

    let answer = {
        state: null,
        msg: "",
        data: null
    };

    //database.input('username', mssql.VarChar(30), username);
    database.input('email', mssql.VarChar(100), email);
    database.input('hash', mssql.VarChar(70), seededSha256(email, password));

    database.query('INSERT INTO ' + userTable + '(email,passwordHash) VALUES ( @email, @hash )', (error) => {

        if (error) {

            answer.state = dbConsts.OPERATION_FAILED;
            answer.msg   = 'email is already taken';
            setTimeout(() => callback(answer), 0);

            return;
        }

        answer.state = dbConsts.OPERATION_SUCCESS;
        answer.msg   = "operation success";
        setTimeout(() => callback(answer), 0);

        return;
    });
}

//function getUserByEmail(database, email,callback) {
//
//    database.input('email', mssql.VarChar(100), email);
//
//    database.query('SELECT username FROM ' + userTable + ' WHERE email = @email', (error,result) => {
//
//        if ((error) || (result.rowsAffected[0] == 0)) {
//            setTimeout(() => callback({ state: dbConsts.OPERATION_FAILED }),0);
//            return;
//        }
//
//        setTimeout(() => callback({ state: dbConsts.OPERATION_SUCCESS, username: toJSON(result)[0][0][0].username}), 0);
//    });
//}

function isValidSessionInfo(database, userid, sessionToken, callback) {
    // TODO
}

function newSession(database, userid, callback) {

    let sessionToken = randomTokenString(64);

    database.input('userID', mssql.Int, userid);
    database.input('sessionToken', mssql.VarChar(70), sessionToken);

    database.query('INSERT INTO ' + sessionTable + ' (userID,sessionToken,createDate) VALUES (@userID, @sessionToken, CONVERT(Date, GETDATE()))', (error) => {

        if (error) {

            setTimeout(() => callback({ state: dbConsts.OPERATION_FAILED }), 0);
            //console.log(error);
            return;
        }

        setTimeout(() => callback({ state: dbConsts.OPERATION_SUCCESS, token: sessionToken }));

    });
}

function initDatabase(database, OLD_VERSION) {

    // TODO

    // for creating database and setting up manager
}

function toJSON(rowDataPacket) {
    return Object.values(JSON.parse(JSON.stringify(rowDataPacket)));
}

function login(database,email,password, callback) {

    let data = {
        msg: "",
        state: null,
        data: null
    };

    database.input('email', mssql.VarChar(30), email);
    database.input('hash', mssql.VarChar(70), seededSha256(email, password));

    database.query('SELECT id,email FROM ' + userTable + ' WHERE email = @email and passwordHash = @hash', (error, result) => {

        if ((error) || (result.rowsAffected[0] == 0)) {

            data.state = dbConsts.OPERATION_FAILED;
            data.msg   = "Invalid login data";

            setTimeout(() => callback(data), 0);
            return;
        }

        data.data  = toJSON(result)[0][0][0];

        newSession(database, data.data.id, (result) => {

            if (result.state != dbConsts.OPERATION_SUCCESS) {

                data.state = dbConsts.OPERATION_WARRNING;
                data.msg = "User Found but failed to create session";
                setTimeout(() => callback(data));

                return;
            }

            data.state = dbConsts.OPERATION_SUCCESS;
            data.msg   = "operation success";

            data.data.sessionToken = result.token;
            setTimeout(() => callback(data), 0);
        });
    });

}

//var db = null; //mssql.connect(config).Request();
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

                //db = new mssql.Request();

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

        for (currPos = 0; currPos < length; currPos++) {

            switch (requestsNeeded[currPos]) {

                case getRequests.USER: {
                    this.getSingleRequest(requestData, (result) => {

                        resultMSG[currPos]    = result.msg;
                        resultsState[currPos] = result.state;
                        results[currPos]      = result.data;
                    });
                }
            }
        }

        setTimeout(() => callback({ length: length, states: resultsState, msges: resultsMSG, data: results }), 0);
    }

    getSingleRequest(requestData,callback) {

        let data = {
            state: null,
            msg: "",
            data: null
        };

        switch (requestData.id) {

            case getRequests.USER: {

                let database = new mssql.Request();

                database.query("SELECT firstName,lastName FROM student", (error, result) => {

                    if (error) {

                        data.status = dbConsts.OPERATION_FAILED;
                        msg: "failed to get students";
                        callback(data);
                        return;
                    }

                    data.state = dbConsts.OPERATION_SUCCESS;
                    data.msg   = "operation success";

                    data.data =  toJSON(result)[0][0];
                    setTimeout(() => callback(data),0);
                });

                break;
            } 
        }
    }

    sendRequest(sentData,callback) {

        let response = {
            msg  : "",
            state: -1,
            data : null
        };

        switch (sentData.id) {

            case sendRequests.CREATE_NEW_USER: {
                createUser(new mssql.Request(), sentData.data.email, sentData.data.password, callback);
                break;
            }

            case sendRequests.LOGIN_REQUEST: {

                login(new mssql.Request(), sentData.data.email, sentData.data.password, callback);

                //if (!sentData.data.username) {
                //
                //    getUserByEmail(new mssql.Request(), sentData.data.email, (answer) => {
                //
                //        if (answer.state != dbConsts.OPERATION_SUCCESS) {
                //
                //            response.state = answer.state;
                //            response.msg = "Invalid login data";
                //
                //            setTimeout(() => callback(response), 0);
                //            return;
                //        }
                //
                //        login(new mssql.Request(), answer.username, sentData.data.password, callback);
                //    });
                //
                //} else {
                //    login(new mssql.Request(), sentData.data.username, sentData.data.password, callback);
                //}
                break;
            }

            case sendRequests.TERMINATE_SESSION: {

                let database = new mssql.Request()

                database.input('userid', mssql.Int, sentData.data.userid);
                database.input('token', mssql.VarChar(70), sentData.data.token);

                database.query('DELETE FROM ' + sessionTable + ' WHERE userid = @userid and sessionToken = @token', (error,result) => {

                    if ((error) || (result.rowsAffected[0] == 0)) {

                        response.state = dbConsts.OPERATION_FAILED;
                        response.msg   = "Failed to terminate session";

                        setTimeout(() => callback(response),0);
                        return;
                    }

                    response.state = dbConsts.OPERATION_SUCCESS;
                    response.msg   = "operation success";
                    
                    setTimeout(() => callback(response), 0);
                });
            }
        }
    }
}

module.exports  = new DatabaseManager();
