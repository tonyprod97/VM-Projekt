"use strict"
/**
 * @file Ovdje se nalaze sve varijable i metode potrebne za komunikaciju sa bazom podataka
 */

 /**
  * Konstanta koja sadrzi sve potrebne podatke za komunikaciju sa bazom podataka
  */
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

const userTable       = 'Profile';
const sessionTable    = 'Session';
const unverifiedTable = 'Unverified';
const visibilityTable = 'Visibility';
const calendarTable   = 'CalendarData';
const meetingTable    = 'MeetingRequest';

const sessionLifeTime = 10;

/**
 * ...............
 * @param {String}seed
 * @param {String}password
 * @returns {PromiseLike<ArrayBuffer>}hash
 */
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

/**
 * Stvaranje proizvoljnog "string token-a"
 * @param {number}size - velicina "tokena"
 * @returns {*} proizvoljni "string token"
 */
function randomTokenString(size) {
    return crypto.randomBytes(size).toString('hex');
}

/**
 * Dohvati e-mail korisnika
 * @param {Object} database 
 * @param {Object} userid 
 * @param {Object} callback 
 */
function getUserEmailFromID(database, userid, callback) {

    database.input('userid', mssql.Int, userid);

    database.query('SELECT email FROM ' + userTable + ' WHERE id = @userid', (error, result) => {

        if (error) {
            setTimeout(() => callback(null));
            return;
        }

        setTimeout(() => callback(toJSON(result)[0][0][0].email));
    });
}

function getUserIDFromEmail(database, email, callback) {

    database.input('email', mssql.VarChar(100), email);

    database.query('SELECT id FROM ' + userTable + ' WHERE email = @email', (error, result) => {

        if (error) {
            setTimeout(() => callback(null));
            return;
        }

        setTimeout(() => callback(toJSON(result)[0][0][0].id));
    });
}

/**
 * Stvaranje korisnika u bazi podataka
 * @param {Object}database - objekt koji predstavlja bazu podataka
 * @param {String}email - adresa elektronicke poste korisnika
 * @param {String}password - lozinka korisnika
 * @param {Function}callback - funkcija koja ce se izvesti
 */
function createUser(database, email, password, isStudent, callback) {

    let answer = {
        state: null,
        msg: "",
        data: null
    };

    //database.input('username', mssql.VarChar(30), username);
    database.input('email', mssql.VarChar(100), email);
    database.input('hash', mssql.VarChar(70), seededSha256(email, password));
    database.input('isStudent', mssql.Bit, isStudent);

    database.query('INSERT INTO ' + userTable + ' (email, passwordHash, isStudent) VALUES (@email, @hash, @isStudent)', (error) => {

        if (error) {

            answer.state = dbConsts.OPERATION_FAILED;
            answer.msg   = 'email is already taken';
            setTimeout(() => callback(answer), 0);

            return;
        }

        answer.state = dbConsts.OPERATION_SUCCESS;
        answer.msg   = "operation success";
        //setTimeout(() => callback(answer), 0);

        database.query('SELECT id FROM ' + userTable + ' WHERE email = @email', (error, result) => {

            if (error) { // shouldn't happen
                console.log(error);
                setTimeout(() => callback(answer), 0);
                return;
            }

            database.input('userid', mssql.Int, toJSON(result)[0][0][0].id);
            database.input('token', mssql.VarChar(70), randomTokenString(32));

            database.query('INSERT INTO ' + unverifiedTable + ' (userid, token, createdate) VALUES(@userid, @token, CONVERT(Date, GETDATE()))', (error, result) => {

                if (error) { // shouldn't happen
                    console.log(error);
                    setTimeout(() => callback(answer), 0);
                    return;
                }

                setTimeout(() => callback(answer), 0);
            });
        });

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

/**
 * Provjera ako je sjednica vazeca
 * @param {Object}database - objekt koji predstavlja bazu podataka
 * @param {Sting}userid - korisnikov identifikacijski broj
 * @param {String}sessionToken - predstavlja token
 * @param {Object}callback - funkcija koja ce se izvesti
 */
function isValidSessionInfo(database, userid, sessionToken, callback) {

    //console.log({ userid: userid, token: sessionToken });

    database.input('userid', mssql.Int, userid);
    database.input('sessionToken', mssql.VarChar(70), sessionToken);

    database.query('SELECT sessionToken FROM ' + sessionTable + ' WHERE userid = @userid and sessionToken = @sessionToken and CONVERT(Date, GETDATE()) <= DATEADD(DAY,' + sessionLifeTime + ',createdate)', (error, result) => {

        if (error) {
            console.log(error);
            setTimeout(() => callback({ state: dbConsts.OPERATION_FAILED, msg: "can't check for valid token" }));
            return;
        }

        if (result.rowsAffected[0] == 0) {
            setTimeout(() => callback({ state: dbConsts.OPERATION_DENIED, msg: "invalid sessionToken" }));
            return;
        }

        setTimeout(() => callback({ state: dbConsts.OPERATION_SUCCESS, msg: "operation success" }));
    });
}

/**
 * Stvaranje nove sjednice
 * @param {Object}database - predstavlja bazu podataka
 * @param {String}userid - predstavlja korisnicko ime
 * @param {Object}callback - predstavlja funkciju koje ce se izvesti
 */
function newSession(database, userid, callback) {

    let sessionToken = randomTokenString(32);

    database.input('userid', mssql.Int, userid);
    database.input('sessionToken', mssql.VarChar(70), sessionToken);

    database.query('INSERT INTO ' + sessionTable + ' (userID,sessionToken,createDate) VALUES (@userid, @sessionToken, CONVERT(Date, GETDATE()))', (error) => {

        if (error) {

            setTimeout(() => callback({ state: dbConsts.OPERATION_FAILED }), 0);
            //console.log(error);
            return;
        }

        setTimeout(() => callback({ state: dbConsts.OPERATION_SUCCESS, token: sessionToken }));
    });
}

/**
 * Inicijalizacija baze podataka i postavljanje "manager"-a koji upravlja bazom podataka
 * @param {Object}database - Predstavlja bazu podataka
 * @param {Object}OLD_VERSION - Predstavlja staru verziju baze
 */
function initDatabase(database, OLD_VERSION) {

    // TODO

    // for creating database and setting up manager
}

/**
 * Pretvaranje objekta u JSON
 * @param {Object}rowDataPacket - predstavlja dio objekta koji se pretvara u JSON
 * @returns {any[]} objekt pretvoren u JSON
 */
function toJSON(rowDataPacket) {
    return Object.values(JSON.parse(JSON.stringify(rowDataPacket)));
}

/**
 * Prijava u sustav
 * @param {Object}database - predstavljabazu podataka
 * @param {String}email - predstavlja adresu elektronicke poste korisnika
 * @param {String}password - predstavlja lozinku korisnika
 * @param {Object}callback - predstavlja funkciju koja ce se izvrsiti
 */
function login(database,email,password, callback) {

    let data = {
        msg: "",
        state: null,
        data: null
    };

    database.input('email', mssql.VarChar(100), email);
    database.input('hash', mssql.VarChar(70), seededSha256(email, password));

    database.query('SELECT id,email,isStudent FROM ' + userTable + ' WHERE email = @email and passwordHash = @hash', (error, result) => {

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
/**
 * Dohvat korisnika koji dijele kalendar sa nekim korisnikom
 * @param {Object}database - predstavljabazu podataka
 * @param {String}email - predstavlja adresu elektronicke poste korisnika
 * @param {String}password - predstavlja lozinku korisnika
 * @param {Object}callback - predstavlja funkciju koja ce se izvrsiti
 */
function getUsersThatSheredCalendarWithYou(database, userid, sessionToken, callback) {

    isValidSessionInfo(new mssql.Request(), sessionToken, (answer) => {

        //if (!answer.valid) {
        //    setTimeout(() => callback({ state: dbConsts.OPERATION_DENIED, msg: "invalid sessionToken" }), 0);
        //    return;
        //}

        //TODO

    });
}
/**
 * Verifikcaija korisnika 
 * @param {String}email - predstavlja adresu elektronicke poste korisnika
 * @param {String}password - predstavlja lozinku korisnika
 * @param {Object}callback - predstavlja funkciju koja ce se izvrsiti
 */
function getVerification(database, email, callback) {

    let data = {
        state: null,
        msg: "",
        data: null
    };

    database.input('email', mssql.VarChar(100), email);

    database.query('SELECT userid,token FROM ' + userTable + ' JOIN ' + unverifiedTable + ' ON id = userid WHERE email = @email', (error, result) => {

        if (error) {

            console.log(error);
            data.state = dbConsts.OPERATION_FAILED;
            data.msg = "Failed to get verification";
            setTimeout(() => callback(data), 0);
            return;
        }

        data.state = dbConsts.OPERATION_SUCCESS;
        data.msg   = "operation success";

        if (result.rowsAffected[0] == 0) {
            data.data = {verified: true};
            setTimeout(() => callback(data), 0);
            return;
        }

        data.data = toJSON(result)[0][0][0];
        data.data.verified = false;
        setTimeout(() => callback(data), 0);
    });
}

/**
 * Dohvat korisnika
 * @param {Object} database 
 * @param {Object} onlyVerified 
 * @param {Object} callback 
 */
function getUsers(database, onlyVerified, callback) {

    let data = {
        state: null,
        msg: "",
        data: null
    };

    database.query('SELECT email FROM ' + userTable + ' WHERE isStudent = 0' + ((onlyVerified) ? ' AND id NOT IN (SELECT userid FROM ' + unverifiedTable + ' )' : ' '), (error, result) => {

        if (error) {

            data.state = dbConsts.OPERATION_FAILED;
            data.msg   = "Failed to get users";
            setTimeout(() => callback(data));
            return;
        }

        data.state = dbConsts.OPERATION_SUCCESS;
        data.msg   = "operation success";

        data.data = toJSON(result)[0][0];
        setTimeout(() => callback(data));
    });

}

function getIdFromEmail(database, email, callback) {

    let data = {
        state: null,
        msg: "",
        data: null
    };

    database.input('email', mssql.VarChar(100), email);
    console.log("Email: "+ email);
    database.query('SELECT id FROM Profile WHERE email = @email ' , (error, result) => {

        if (error) {
            data.state = dbConsts.OPERATION_FAILED;
            data.msg   = "Failed to get users";
            setTimeout(() => callback(data));
            return;
        }

        data.state = dbConsts.OPERATION_SUCCESS;
        data.msg   = "operation success";

        data.data = toJSON(result)[0][0];
        setTimeout(() => callback(data));
    });

}

function deleteAvailable(database, token, userid, callback) {
    let data = {
        state: dbConsts.OPERATION_SUCCESS,
        msg: "operation success",
        data: null
    };

    isValidSessionInfo(database, userid, token, (answer) => {

        if (answer.state != dbConsts.OPERATION_SUCCESS) {
            setTimeout(() => callback(answer));
            return;
        }

        database.query('DELETE FROM ' + calendarTable + ' WHERE userid=@userid', (error) => {
            if (error) {
                console.log(error);
            }

            setTimeout(() => callback(data));
        });
    });
}

function insertCalendarData(userid, token, calendarInfo, callback) {

    let data = {
        state: dbConsts.OPERATION_SUCCESS,
        msg: "operation success",
        data: null
    };

    isValidSessionInfo(new mssql.Request(), userid, token, (answer) => {

        if (answer.state != dbConsts.OPERATION_SUCCESS) {
            setTimeout(() => callback(answer));
            return;
        }

        let size = calendarInfo.length;

        calendarInfo.forEach((element, index) => {

            let database = new mssql.Request();

            database.input('userid', mssql.Int, userid);
            database.input('subject', mssql.VarChar(100), element.subject);
            database.input('startDate', mssql.DateTime2, element.startDate);
            database.input('endDate', mssql.DateTime2, element.endDate);

            database.query('INSERT INTO ' + calendarTable + '(userid, subject, startDate, endDate) VALUES (@userid, @subject, @startDate, @endDate)', (error) => {

                if (error) {
                    //console.log(error);
                    data.state = dbConsts.OPERATION_WARRNING;
                    data.msg   = "some data was not saved";
                }

                if (index == (size - 1)) setTimeout(() => callback(data));
            });
        });
    });
}

/**
 * Dohvat podataka kalendara
 * @param {Object} database 
 * @param {Object} userid 
 * @param {Object} token 
 * @param {Object} from 
 * @param {Object} callback 
 */
function getCalendarData(database, userid, token, from, callback) {

    let data = {
        state: -1,
        msg: "",
        data: null
    };

    console.log({ userid: userid, email: from });

    isValidSessionInfo(database, userid, token, (answer) => {
        /*
        if (answer.state != dbConsts.OPERATION_SUCCESS) {
            setTimeout(() => callback(answer));
            return;
        }*/

        database.input('email', mssql.VarChar(100), from);

        database.query('SELECT subject, startDate, endDate FROM ' + calendarTable + ' JOIN ' + userTable + ' ON userid = id WHERE email = @email ', (error, result) => {

            if (error) {
                console.log(error);
                data.state = dbConsts.OPERATION_FAILED;
                data.msg   = "failed to get calendar info";
                setTimeout(() => callback(data));
                return;
            }

            data.state = dbConsts.OPERATION_SUCCESS;
            data.msg   = "operation success";
            data.data  = toJSON(result)[0][0];

            setTimeout(() => callback(data));
        });
    });
}


function sendMeetingRequest(database,userid, token, toEmail, startDate,subject, callback) {

    let data = {
        state: -1,
        msg: "",
        data: null
    };

    isValidSessionInfo(database, userid, token, (answer) => {

        if (answer.state != dbConsts.OPERATION_SUCCESS) {
            setTimeout(() => callback(answer));
            return;
        }

        getUserIDFromEmail(database, toEmail, (toid) => {

            let strToken = randomTokenString(64);

            database.input('meetingToken', mssql.VarChar(130), strToken);
            database.input('toid', mssql.Int, toid);
            database.input('date', mssql.DateTime2, startDate);
            database.input('subject', mssql.VarChar(100), subject);

            database.query('INSERT INTO ' + meetingTable + ' (userid,senderid,startDate,token,subject) VALUES (@toid,@userid,@date,@meetingToken,@subject)', (error) => {

                if (error) {
                    data.state = dbConsts.OPERATION_FAILED;
                    data.msg   = 'failed to send request, request already sent or time is not available any more';
                    setTimeout(() => callback(data));
                    return;
                }

                data.state = dbConsts.OPERATION_SUCCESS;
                data.msg   = 'operation success';
                data.data  = {};

                getUserEmailFromID(new mssql.Request(), userid, (email) => {

                    data.data.email = email;
                    data.data.token = strToken;

                    setTimeout(() => callback(data));
                });
            });
        });
    });
}

function answerMeetingRequest(database,token,accept,callback) {

    let data = {
        state: -1,
        msg: "",
        data: null
    };

    database.input('token', mssql.VarChar(130), token);

    database.query('SELECT senderid, userid , startDate, subject FROM ' + meetingTable + ' WHERE token = @token', (error, result) => {

        if (error) {
            data.state = dbConsts.OPERATION_FAILED;
            data.msg   = 'failed to answer a request';
            setTimeout(() => callback(data));
            return;
        }

        if (result.rowsAffected[0] == 0) {
            data.state = dbConsts.OPERATION_FAILED;
            data.msg   = 'invalid request or request not available any more';
            setTimeout(() => callback(data));
            return;
        }

        let tempResult = toJSON(result)[0][0][0];

        database.input('userid', mssql.VarChar(130), tempResult.userid);
        database.input('senderid', mssql.VarChar(130), tempResult.senderid);
        database.input('startDate', mssql.VarChar(130), tempResult.startDate);

        database.query('DELETE FROM ' + meetingTable + ' WHERE userid = @userid AND startDate = @startDate AND senderid = @senderid', (error, result) => {

            if (error) { // shouldn't happen
                console.log(error);
            }

            data.state = dbConsts.OPERATION_SUCCESS;
            data.msg   = 'operation success';

            if (accept) {

                data.data = {};

                data.data.startDate = tempResult.startDate;
                data.data.subject   = tempResult.subject;

                database.query('SELECT endDate FROM ' + calendarTable + ' WHERE userid = @userid AND startDate = @startDate', (error, result) => {

                    if (error) { // shouldn't happen
                        console.log(error);
                    }

                    data.data.endDate = toJSON(result)[0][0][0].endDate;

                    database.query('DELETE FROM ' + calendarTable + ' WHERE userid = @userid AND startDate = @startDate', (error) => {

                        if (error) { // shouldn't happen
                            console.log(error);
                        }

                        getUserEmailFromID(new mssql.Request(), tempResult.userid, (profMail) => {

                            data.data.profMail = profMail;

                            getUserEmailFromID(new mssql.Request(), tempResult.senderid, (senderEmail) => {

                                data.data.senderEmail = senderEmail;

                                setTimeout(() => callback(data));
                            });
                        });
                    });
                });
                return;
            }

            setTimeout(() => callback(data));
        });
    });
}

//var db = null; //mssql.connect(config).Request();
var readyForUse = false;
var databesDown = false;

/**
 * @class Klasa koja reprezentira "upravitelja bazom podataka"
 */
class DatabaseManager {
    /**
     * @constructor
     */
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

            databesDown = true;
            //readyForUse = false;
                  
        });
    }

    /**
     * Provjera ako je baza podataka spremna za koristenje
     * @returns {boolean} - vrijednost spremnosti
     */
    isReady() {
        return readyForUse;
    }
    /**Provjera ako baza podataka reagira na zahtjeve
     * @returns {boolean} - vrijednost koja pokazuje da li baza ne reagira
     */
    isDatabaseDown() {
        return databesDown;
    }

    /**
     * Zahtjev za dohvat podataka
     * @param {Object}requestData - predtavlja podatke koji se dohvacaju
     * @param {Object}callback - predstavlja funkciju koja ce se izvesti
     */
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

    /**
     * Slanje samo jednog zahtjeva
     * @param {Object}requestData - predstavlja podatke koji se zahtjevaju
     * @param {Object}callback - predstavlja funkciju koja ce se izvesti
     */
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

            case getRequests.GET_VERIFICATION: {
                getVerification(new mssql.Request(), requestData.data.email, callback);
                break;
            }
        
            case getRequests.GET_ALL_USERS: {
                getUsers(new mssql.Request(), false, callback);
                break;
            }
                
            case getRequests.GET_VERIFIED_USERS: {
                getUsers(new mssql.Request(), true, callback);
                break;
            }

            case getRequests.GET_ID_FROM_MAIL: {
                getIdFromEmail(new mssql.Request(),requestData.data.email, callback);
                break;
            }

            case getRequests.GET_CALENDAR: {

                if (!requestData.data.from) {
                    getUserEmailFromID(new mssql.Request(), requestData.data.userid, (email) => {
                        getCalendarData(new mssql.Request(), requestData.data.userid, requestData.data.token, email, callback);
                    });
                    break;
                }

                getCalendarData(new mssql.Request(), requestData.data.userid, requestData.data.token, requestData.data.from, callback);
                break;
            }
        }
    }

    /**
     * Slanje zahtjeva
     * @param {Object}sentData - predstavlja podatke koji ce se poslati
     * @param {Object}callback - predstavlja funkciju koja ce se izvesti
     */
    sendRequest(sentData,callback) {

        let response = {
            msg  : "",
            state: -1,
            data : null
        };

        switch (sentData.id) {

            case sendRequests.CREATE_NEW_USER: {
                createUser(new mssql.Request(), sentData.data.email, sentData.data.password, sentData.data.isStudent, callback);
                break;
            }

            case sendRequests.LOGIN_REQUEST: {
                login(new mssql.Request(), sentData.data.email, sentData.data.password, callback);
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

                break;
            }

            case sendRequests.VERIFY_USER: {

                let database = new mssql.Request();

                database.input('userid', mssql.Int, sentData.data.userid);
                database.input('token', mssql.VarChar(70), sentData.data.verificationToken);

                database.query('DELETE FROM ' + unverifiedTable + ' WHERE userid = @userid and token = @token', (error,result) => {

                    if (error) {

                        response.state = dbConsts.OPERATION_FAILED;
                        response.msg   = "failed to verify user";

                        setTimeout(() => callback(response));
                        return;
                    }

                    if ((result.rowsAffected[0] == 0)) {

                        response.state = dbConsts.OPERATION_FAILED;
                        response.msg = "already verified or invalid params";

                        setTimeout(() => callback(response));
                        return;
                    }

                    response.state = dbConsts.OPERATION_SUCCESS;
                    response.msg   = "operation success";

                    setTimeout(() => callback(response), 0);
                });

                break;
            }

            case sendRequests.INSERT_CALENDAR_DATA: {
                insertCalendarData(sentData.data.userid, sentData.data.token, sentData.data.calendarInfo, callback);
                break;
            }

            case sendRequests.SEND_MEETING_REQUEST: {
                sendMeetingRequest(new mssql.Request(), sentData.data.userid, sentData.data.token, sentData.data.toEmail, sentData.data.startDate,sentData.data.subject, callback);
                break;
            }

            case sendRequests.SEND_MEETING_ANSWER: {
                answerMeetingRequest(new mssql.Request(), sentData.data.token, sentData.data.accept, callback);
                break;
            }

            case sendRequests.DELETE_AVAILABLE: {
                deleteAvailable(new mssql.Request(), sentData.data.token, sentData.data.userid, callback);
                break;
            } 
        }
    }
}

module.exports  = new DatabaseManager();
