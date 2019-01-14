/**
 * @file Ovdje se nalaze varijable i metode za upravljanje route-ovima
 */

var express = require('express');
var router = express.Router();

// var response ="";

router.use('/user', require('./user'));
router.use('/calendar', require('./calendar'));
router.use('/outlook',require('./outlook'));

const databaseManager = require('../DatabaseManager');
const ids             = require('../constants').databaseGetRequests;
const operationStates = require('../constants').databaseErrors;
var permit = require('./user/permission');

const authHelper = require('../OutlookManager');
var outlook = require('node-outlook');
var moment = require('moment');

const mailHelper = require('../EmailManager');

const sendIds = require('../constants').databaseSendRequests; // for testing 

/* GET home page. */
router.get('/', function(req, res) {

    if (!databaseManager.isReady()) {

        setTimeout(()=> {
            console.log('Database Manager is not ready.');
            res.redirect('/');
        },200);
       
        return;
    }

    //for testing

    //databaseManager.getSingleRequest({ id: ids.GET_ALL_USERS }, (answer) => {
    //
    //    if (answer.state != operationStates.OPERATION_SUCCESS) {
    //        console.log(answer.msg);
    //        return;
    //    }
    //
    //    console.log(answer.data);
    //    console.log('');
    //    databaseManager.getSingleRequest({ id: ids.GET_VERIFIED_USERS }, (answer) => {
    //
    //        if (answer.state != operationStates.OPERATION_SUCCESS) {
    //            console.log(answer.msg);
    //            return;
    //        }
    //
    //        console.log(answer.data);
    //    });
    //});

    //databaseManager.sendRequest({ id: sendIds.CREATE_NEW_USER, data: { email: 'test@test.com', password: 'testPass' } }, (answer) => {
    //
    //    console.log(answer.msg);
    //
    //    databaseManager.sendRequest({ id: sendIds.LOGIN_REQUEST, data: { email: 'test@test.com', password: 'testPass' } }, (answer) => {
    //
    //        if (answer.state != operationStates.OPERATION_SUCCESS) {
    //            console.log(answer.msg);
    //            return;
    //        }
    //
    //        console.log(answer.data);
    //
    //        let userid = answer.data.id;
    //        let token  = answer.data.sessionToken;
    //
    //        databaseManager.sendRequest({
    //            id: sendIds.INSERT_CALENDAR_DATA,
    //            data: {
    //                userid: userid,
    //                token: token,
    //                calendarInfo: [
    //                    { subject: 'test', startDate: '2018-09-23T10:00:00Z', endDate: '2018-09-23T11:00:00Z' },
    //                    { subject: 'test2', startDate: '2018-09-23T12:00:00Z', endDate: '2018-09-23T13:00:00Z' }
    //                ]
    //            }
    //        }, (answer) => {
    //
    //            if (answer.state != operationStates.OPERATION_SUCCESS) {
    //                console.log(answer.msg);
    //                return;
    //            }
    //
    //            console.log('save success');
    //
    //            databaseManager.getSingleRequest({ id: ids.GET_CALENDAR, data: { userid: userid, token: token } }, (answer) => {
    //
    //                if (answer.state != operationStates.OPERATION_SUCCESS) {
    //                    console.log(answer.msg);
    //                    return;
    //                }
    //
    //                console.log(answer.data);
    //            });
    //        });
    //
    //        //databaseManager.getSingleRequest({ id: ids.GET_VERIFICATION, data: { email: 'test@test.com' } }, (answer) => {
    //        //
    //        //    if (answer.state != operationStates.OPERATION_SUCCESS) {
    //        //        console.log(answer.msg);
    //        //        return;
    //        //    }
    //        //
    //        //    if (answer.data.verified) {
    //        //        console.log('user verified');
    //        //        return;
    //        //    }
    //        //
    //        //    console.log(answer.data);
    //        //
    //        //    databaseManager.sendRequest({ id: sendIds.VERIFY_USER, data: { userid: answer.data.userid, verificationToken: answer.data.token } }, (answer) => {
    //        //        if (answer.state != operationStates.OPERATION_SUCCESS) {
    //        //            console.log(answer.msg);
    //        //        }
    //        //    });
    //        //});
    //
    //        //databaseManager.sendRequest({ id: sendIds.TERMINATE_SESSION, data: { userid: answer.data.id, token: answer.data.sessionToken } }, (answer) => {
    //        //
    //        //    if (answer.state != operationStates.OPERATION_SUCCESS) {
    //        //        console.log(answer.msg);
    //        //        return
    //        //    }
    //        //
    //        //    console.log("session terminated");
    //        //});
    //    });
    //}); 

    databaseManager.getSingleRequest({ id: ids.USER }, (answer) => {

        if (answer.state != operationStates.OPERATION_SUCCESS) {

            res.render('index', {
                message : answer.msg,
                loggedIn: false,
                students: null
            });

            return;
        }

        res.render('index', {
            message: "Welcome to VM Projekt",
            loggedIn: false,
            students: answer.data
        });
    });
});

router.get('/authorize',permit, function (req, res) {
    var authCode = req.query.code;
    if (authCode) {
        console.log('');
        console.log('Retrieved auth code in /authorize: ' + authCode);
        authHelper.getTokenFromCode(authCode, tokenReceived, req, res);
    }
    else {
        // redirect to home
        console.log('/authorize called without a code parameter, redirecting to login');
        res.redirect('/');
    }
});

/**
 * Provjera je li token primljen
 * @param {Object} req
 * @param {Object} res
 * @param {Object} error
 * @param {Object} token
 */

function tokenReceived(req, res, error, token) {
    if (error) {
        console.log('ERROR getting token:' + error);
        res.send('ERROR getting token: ' + error);
    }
    else {
        // save tokens in session
        req.session.access_token = token.token.access_token;
        req.session.refresh_token = token.token.refresh_token;
        req.session.email = authHelper.getEmailFromIdToken(token.token.id_token);
        res.redirect('/sync');
    }
}

router.get('/refreshtokens',permit, function (req, res) {
    var refresh_token = req.session.refresh_token;
    if (refresh_token === undefined) {
        console.log('no refresh token in session');
        res.redirect('/');
    }
    else {
        authHelper.getTokenFromRefreshToken(refresh_token, tokenReceived, req, res);
    }
});

/*
    JSONPathovi.
    za naslov - $.Subject
    početak eventa - $.Start.DateTime
    kraj eventa - $.End.DateTime
    mjesto događaja - $.Location.DisplayName

 */

router.get('/sync',permit, function(req, res) {
    var token = req.session.access_token;
    var email = req.session.email;
    if (token === undefined || email === undefined) {
        console.log('/sync called while not logged in');
        res.redirect('/');
        return;
    }

    // Set the endpoint to API v2
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the user's email as the anchor mailbox
    outlook.base.setAnchorMailbox(req.session.email);
    // Set the preferred time zone
    outlook.base.setPreferredTimeZone('Europe/Paris');

    // Use the syncUrl if available
    var requestUrl = req.session.syncUrl;
    if (requestUrl === undefined) {
        // Calendar sync works on the CalendarView endpoint
        requestUrl = outlook.base.apiEndpoint() + '/Me/CalendarView';
    }

    // Set up our sync window from midnight on the current day to
    // midnight 7 days from now.
    var startDate = moment().startOf('day');
    var endDate = moment(startDate).add(30, 'days');
    // The start and end date are passed as query parameters
    var params = {
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString()
    };

    // Set the required headers for sync
    var headers = {
        Prefer: [
            // Enables sync functionality
            //'odata.track-changes',
            // Requests only 5 changes per response
            'odata.maxpagesize=5'
        ]
    };

    var apiOptions = {
        url: requestUrl,
        token: token,
        headers: headers,
        query: params
    };

    console.log('requestUrl ' + apiOptions.url);
    console.log('token ' + apiOptions.token);
    console.log('headers ' + apiOptions.headers);
    console.log('params ' + apiOptions.query);

    outlook.base.makeApiCall(apiOptions, function(error, response) {
        if (error) {
            console.log(JSON.stringify(error));
            res.send(JSON.stringify(error));
        }
        else {
            if (response.statusCode !== 200) {
                console.log('API Call returned ' + response.statusCode);
                res.send('API Call returned ' + response.statusCode);
            }
            else {
                console.log('API Call returned ' + response.statusCode);
                var nextLink = response.body['@odata.nextLink'];
                if (nextLink !== undefined) {
                    req.session.syncUrl = nextLink;
                }
                var deltaLink = response.body['@odata.deltaLink'];
                if (deltaLink !== undefined) {
                    req.session.syncUrl = deltaLink;
                }

                var finalResponse=JSON.stringify(response.body.value);
                //console.log(JSON.stringify(response.body.value))
                console.log(finalResponse.length,'size')
                console.log('Final respone: '+ JSON.stringify(response.body.value));
                //save in database final response
                //res.render('./calendar/week',{calendarData:finalResponse,loggedIn:true});
                res.redirect('/calendar/week');

            }
        }
    });
});

router.get('/sendmail', function(req, res) {
    var subjectMail='lovro.knezevic1@gmail.com';
    mailHelper.sendVerificationMail(subjectMail,'added url');
    res.redirect('/');
});

/**
 * @constant ...
 */

const fR = [{
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHy5FY7AAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB8xumDw==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHy5FY7AAA=",
    "CreatedDateTime": "2019-01-05T00:17:50.5323717+01:00",
    "LastModifiedDateTime": "2019-01-05T00:17:50.6194424+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB8xumDw==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000DE4537B683A4D401000000000000000010000000241FB2466977F742B207129A248AC5E7",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Sastanak za OPP",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHy5FY7AAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-07T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-07T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6YAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHmsQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6YAAA=",
    "CreatedDateTime": "2019-01-07T10:31:28.8430568+01:00",
    "LastModifiedDateTime": "2019-01-07T10:31:29.1613216+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHmsQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000194A77C46BA6D401000000000000000010000000E2B46AFAAFEE41499D809135CBD511DA",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Testr 1",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6YAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-09T11:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-09T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6ZAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHopg==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6ZAAA=",
    "CreatedDateTime": "2019-01-07T11:53:12.225385+01:00",
    "LastModifiedDateTime": "2019-01-07T11:53:12.5666686+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHopg==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E008000000004A0E1C2F77A6D401000000000000000010000000732DA8DE1FE01947B471F751C277627B",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Test 2",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6ZAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-09T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-09T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6bAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHoxg==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6bAAA=",
    "CreatedDateTime": "2019-01-07T13:07:35.7196164+01:00",
    "LastModifiedDateTime": "2019-01-07T13:07:35.8106925+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHoxg==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000B5398F9381A6D4010000000000000000100000009B71AEF3B4CC27428F5096C5D9CF1B59",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Test 4",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6bAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-10T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-10T15:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6aAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHowA==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6aAAA=",
    "CreatedDateTime": "2019-01-07T12:45:45.0463215+01:00",
    "LastModifiedDateTime": "2019-01-07T12:45:45.1474058+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHowA==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000388156867EA6D4010000000000000000100000002F8F0A59E6226B4D97F87FC6E6769665",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Test 3",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6aAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-11T11:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-11T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nQzES-AAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nQzES-AAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E301070793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nQzES%2FAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-07T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-07T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nmzOhQAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nmzOhQAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E3010E0793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nmzOhQAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-14T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-14T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1n8zYvhAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1n8zYvhAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E301150793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1n8zYvhAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-21T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-21T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1oSzi9yAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1oSzi9yAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E3011C0793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1oSzi9yAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-28T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-28T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}
];

const fRProf = [{
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHy5FY7AAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB8xumDw==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHy5FY7AAA=",
    "CreatedDateTime": "2019-01-05T00:17:50.5323717+01:00",
    "LastModifiedDateTime": "2019-01-05T00:17:50.6194424+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB8xumDw==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000DE4537B683A4D401000000000000000010000000241FB2466977F742B207129A248AC5E7",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Podaci od profesora",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHy5FY7AAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-07T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-07T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6YAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHmsQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6YAAA=",
    "CreatedDateTime": "2019-01-07T10:31:28.8430568+01:00",
    "LastModifiedDateTime": "2019-01-07T10:31:29.1613216+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHmsQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000194A77C46BA6D401000000000000000010000000E2B46AFAAFEE41499D809135CBD511DA",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Testr 1",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6YAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-09T11:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-09T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6ZAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHopg==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6ZAAA=",
    "CreatedDateTime": "2019-01-07T11:53:12.225385+01:00",
    "LastModifiedDateTime": "2019-01-07T11:53:12.5666686+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHopg==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E008000000004A0E1C2F77A6D401000000000000000010000000732DA8DE1FE01947B471F751C277627B",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Test 2",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6ZAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-09T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-09T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6bAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHoxg==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6bAAA=",
    "CreatedDateTime": "2019-01-07T13:07:35.7196164+01:00",
    "LastModifiedDateTime": "2019-01-07T13:07:35.8106925+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHoxg==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000B5398F9381A6D4010000000000000000100000009B71AEF3B4CC27428F5096C5D9CF1B59",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Test 4",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6bAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-10T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-10T15:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6aAAA=')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHowA==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6aAAA=",
    "CreatedDateTime": "2019-01-07T12:45:45.0463215+01:00",
    "LastModifiedDateTime": "2019-01-07T12:45:45.1474058+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHowA==",
    "Categories": [],
    "OriginalStartTimeZone": "Europe/Paris",
    "OriginalEndTimeZone": "Europe/Paris",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000388156867EA6D4010000000000000000100000002F8F0A59E6226B4D97F87FC6E6769665",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Test 3",
    "BodyPreview": "Pokušaj stavljanja na outlook!",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": true,
    "ResponseRequested": true,
    "SeriesMasterId": null,
    "ShowAs": "Busy",
    "Type": "SingleInstance",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46%2BLDp0piT4R%2BPShdYPsGBwDdPmwLgZCpS4YsQYNDt%2BV7AAAAs%2FZrAAD6D4BRNZIzR5JHqlnOp0RWAAHz2u6aAAA%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Organizer",
        "Time": "0001-01-01T00:00:00Z"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n</head>\r\n<body>\r\nPokušaj stavljanja na outlook!\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-11T11:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-11T12:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "",
        "LocationType": "Default",
        "UniqueIdType": "Unknown",
        "Address": {
            "Type": "Unknown"
        },
        "Coordinates": {}
    },
    "Locations": [],
    "Recurrence": null,
    "Attendees": [],
    "Organizer": {
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nQzES-AAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nQzES-AAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E301070793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nQzES%2FAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-07T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-07T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nmzOhQAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nmzOhQAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E3010E0793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1nmzOhQAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-14T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-14T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1n8zYvhAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1n8zYvhAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E301150793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1n8zYvhAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-21T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-21T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}, {
    "@odata.id": "https://outlook.office.com/api/v2.0/Users('e4d781cc-0793-478a-afa9-9a0036cb8f0b@ca71eddc-cc7b-4e5b-95bd-55b658e696be')/Events('AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1oSzi9yAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==')",
    "@odata.etag": "W/\"+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==\"",
    "Id": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1oSzi9yAAEYAAAAAeOviw6dKYk_Efj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA_g_AUTWSM0eSR6pZzqdEVgABxKvfdgAAEA==",
    "CreatedDateTime": "2018-10-26T15:59:32.5854366+02:00",
    "LastModifiedDateTime": "2019-01-06T20:58:03.173975+01:00",
    "ChangeKey": "+g+AUTWSM0eSR6pZzqdEVgAB9BHXHQ==",
    "Categories": [],
    "OriginalStartTimeZone": "Romance Standard Time",
    "OriginalEndTimeZone": "Romance Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00807E3011C0793B71D346DD401000000000000000010000000860259277CC5CE45B10B49455F87AD07",
    "ReminderMinutesBeforeStart": 15,
    "IsReminderOn": true,
    "HasAttachments": false,
    "Subject": "Radni sastanak - projekt VM",
    "BodyPreview": "To stop receiving messages from VM projekt group, stop following it.",
    "Importance": "Normal",
    "Sensitivity": "Normal",
    "IsAllDay": false,
    "IsCancelled": false,
    "IsOrganizer": false,
    "ResponseRequested": true,
    "SeriesMasterId": "AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwBGAAAAAAB46_LDp0piT4R_PShdYPsGBwDdPmwLgZCpS4YsQYNDt_V7AAAAs-ZrAAD6D4BRNZIzR5JHqlnOp0RWAAHEq992AAA=",
    "ShowAs": "Busy",
    "Type": "Occurrence",
    "WebLink": "https://outlook.office365.com/owa/?itemid=AAMkADc5ZDQ3OTI0LTA0M2UtNDU4NS05YjVjLWI1ODlhZjU4NzJlMwFRAAgI1oSzi9yAAEYAAAAAeOviw6dKYk%2BEfj0oXWD7BgcA3T5sC4GQqUuGLEGDQ7flewAAALP2awAA%2Bg%2BAUTWSM0eSR6pZzqdEVgABxKvfdgAAEA%3D%3D&exvsurl=1&path=/calendar/item",
    "OnlineMeetingUrl": null,
    "ResponseStatus": {
        "Response": "Accepted",
        "Time": "2018-11-04T09:11:43.3634396+01:00"
    },
    "Body": {
        "ContentType": "HTML",
        "Content": "<html>\r\n<head>\r\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\r\n<meta content=\"text/html; charset=iso-8859-2\">\r\n<meta name=\"Generator\" content=\"Microsoft Word 15 (filtered medium)\">\r\n<style>\r\n<!--\r\n@font-face\r\n\t{font-family:\"Cambria Math\"}\r\n@font-face\r\n\t{font-family:Calibri}\r\np.MsoNormal, li.MsoNormal, div.MsoNormal\r\n\t{margin:0cm;\r\n\tmargin-bottom:.0001pt;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\na:link, span.MsoHyperlink\r\n\t{color:#0563C1;\r\n\ttext-decoration:underline}\r\na:visited, span.MsoHyperlinkFollowed\r\n\t{color:#954F72;\r\n\ttext-decoration:underline}\r\np.msonormal0, li.msonormal0, div.msonormal0\r\n\t{margin-right:0cm;\r\n\tmargin-left:0cm;\r\n\tfont-size:11.0pt;\r\n\tfont-family:\"Calibri\",sans-serif}\r\nspan.EmailStyle18\r\n\t{font-family:\"Calibri\",sans-serif}\r\n.MsoChpDefault\r\n\t{font-size:10.0pt}\r\n@page WordSection1\r\n\t{margin:72.0pt 72.0pt 72.0pt 72.0pt}\r\ndiv.WordSection1\r\n\t{}\r\n-->\r\n</style>\r\n</head>\r\n<body lang=\"EN-US\" link=\"#0563C1\" vlink=\"#954F72\">\r\n<div class=\"WordSection1\">\r\n<p class=\"MsoNormal\"><span lang=\"HR\">&nbsp;</span></p>\r\n</div>\r\n<div id=\"a59ada49-a492-4f1d-ac57-74be3a4194fc\" style=\"display:inline-block\">\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:50px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:18px; padding:0; border-width:0 0 1px 0; border-style:none none solid none; border-color:#EAEAEA\">\r\n&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n<table cellspacing=\"0\" style=\"table-layout:fixed; width:90%; line-height:17px; border:0 none black\">\r\n<tbody>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n<tr>\r\n<td style=\"padding:0; border:0 none black; color:#666666; font-size:12px; font-family:'Segoe UI','Segoe WP',sans-serif\">\r\nTo stop receiving messages from <a href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=conversations\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nVM projekt</a> group, <a id=\"BD5134C6-8D33-4ABA-A0C4-08581FDF89DB\" href=\"https://outlook.office365.com/owa/VMprojekt@ferhr.onmicrosoft.com/groupsubscription.ashx?realm=ferhr.onmicrosoft.com&amp;source=EscalatedMessage&amp;action=unsubscribe\" style=\"color:#0072C6; text-decoration:none; font-size:12px; font-family:'Segoe UI Semibold','Segoe WP Semibold','Segoe UI','Segoe WP',sans-serif\">\r\nstop following it</a>.</td>\r\n</tr>\r\n<tr>\r\n<td style=\"height:17px; padding:0; border:0 none black\">&nbsp;</td>\r\n</tr>\r\n</tbody>\r\n</table>\r\n</div>\r\n</body>\r\n</html>\r\n"
    },
    "Start": {
        "DateTime": "2019-01-28T13:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "End": {
        "DateTime": "2019-01-28T14:00:00.0000000",
        "TimeZone": "Europe/Paris"
    },
    "Location": {
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    },
    "Locations": [{
        "DisplayName": "D259 ZPR",
        "LocationType": "Default",
        "UniqueId": "c794d832-01d4-4b63-b9d6-046c0944b572",
        "UniqueIdType": "LocationStore"
    }
    ],
    "Recurrence": null,
    "Attendees": [{
        "Type": "Required",
        "Status": {
            "Response": "None",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }, {
        "Type": "Required",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Vedran Mornar",
            "Address": "Vedran.Mornar@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lara Lokin",
            "Address": "Lara.Lokin@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Antonio Kamber",
            "Address": "Antonio.Kamber@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Mateo Majnarić",
            "Address": "Mateo.Majnaric@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Kristijan Vrbanc",
            "Address": "Kristijan.Vrbanc@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Martin Sršen",
            "Address": "Martin.Srsen@fer.hr"
        }
    }, {
        "Type": "Optional",
        "Status": {
            "Response": "Accepted",
            "Time": "0001-01-01T00:00:00Z"
        },
        "EmailAddress": {
            "Name": "Lovro Knežević",
            "Address": "Lovro.Knezevic@fer.hr"
        }
    }
    ],
    "Organizer": {
        "EmailAddress": {
            "Name": "VM projekt",
            "Address": "VMprojekt@ferhr.onmicrosoft.com"
        }
    }
}
];
module.exports = router;
module.exports.calendarData = fR;
module.exports.calendarDataProf = fRProf;