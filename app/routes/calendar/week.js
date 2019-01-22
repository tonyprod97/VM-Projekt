var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests;
const getIds = require('../../constants').databaseGetRequests;
const operationStates = require('../../constants').databaseErrors;
const authHelper = require('../../OutlookManager');

var outlook = require('node-outlook');
const mailHelper = require('../../EmailManager');

const urlParser = require('../../UrlManager');

router.get('/', permit, (req, res) => {

    const teacher = req.query['teacher'];
    //console.log("techer:" + user.email);
    //console.log(teacher.id);

    if (teacher) {
        res.render('./calendar/week', { loggedIn: true, teacher: teacher });
        return;
    }
    res.render('./calendar/week', { loggedIn: true });
});

/**
 * Parsiranje datuma
 * @param {Object} dateSent
 * @returns {String} datum i pocetno vrijeme
 */
function parseDate(dateSent) {

    let date = new Date(dateSent);

    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = '' + date.getFullYear();

    let hours = '' + date.getHours();
    let min = '' + date.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (min.length < 2) min = '0' + min;

    return [day, month, year].join('.') + " starting at " + (hours - 1) + ":" + min;
}

/**
 * Zapis datuma i vremena po ISO 8601 standardu
 * @param {Object} meeting
 * @returns {String} datum i vrijeme
 */
function constructIso8601(meeting) {

    let year = '' + meeting.year;
    let month = '' + meeting.month;
    let day = '' + meeting.day;
    let time = meeting.startingTime.split(":");
    let hour = time[0];
    let minute = time[1];
    console.log("Sati:" + hour);
    console.log("Minute: "+ minute);
    //let hour = '' + meeting.startingTime;

    console.log("Sati poslje:" + hour);
    console.log("Minute poslje: "+ minute);

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hour.length < 2) hour = '0' + hour;
    if (minute.length <2) minute = '0'+ minute;

    return [year, month, day].join('-') + "T" + hour + ":" + minute + ":00Z";
}

function addFifteenMinutes(meeting){
    let time = meeting.startingTime;
    console.log("Početno vrijeme: "+meeting.startingTime)
    let hour = parseInt(time.split(":")[0],10);
    let minute = parseInt(time.split(":")[1],10);

    if (minute == 45 ){
        hour=hour+1;
        minute=0;
    } else{
        minute=minute+15;
    }

    meeting.startingTime=hour+":"+minute;

}

/**
 * ......
 * @param {Object} dateSent
 * @returns {Object} objekt s varijablama datuma i vremena
 */
function dateToMeetingFormat(dateSent) {

    let date = new Date(dateSent);

    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = '' + date.getFullYear();

    let hours = '' + date.getHours();

    return { year: year, month: month, day: day, startingTime: hours };
}

router.post('/get_meetings', (req, res) => {


    let user = req.body.user;

    databaseManager.sendRequest({ id: getIds.GET_MEETING_REQUEST, data: { userid: user.id, token: user.sessionToken, mentFor: user.mentFor } }, (answer) => {

        if (anser.state != operationStates.OPERATION_SUCCESS) {
            req.send({ error: answer.msg });
            return;
        }

        req.send(answer.data);

    });

});

router.post('/', permit, (req, res) => {

    if (req.query['operation'] == 'requestMeeting') {
        //let subject = req.body.subject;
        //let requestedMeetings = req.body.requestedMeetings[0];
        //postOutlookData(req,res,subject,requestedMeetings);

        let size = req.body.requestedMeetings.length;

        for (let counter = 0; counter < size; counter++) {

            let body = req.body;

            let iso8601String = constructIso8601(req.body.requestedMeetings[counter]);

            databaseManager.sendRequest({ id: sendIds.SEND_MEETING_REQUEST, data: { userid: body.user.id, token: body.user.sessionToken, startDate: iso8601String, toEmail: body.teacher, subject: body.subject } }, (answer) => {

                if (answer.state != operationStates.OPERATION_SUCCESS) {
                    //res.send({ error: answer.msg });
                    console.log(answer.msg);
                    if (counter == (size - 1)) res.send({ error: null });
                    return;
                }

                console.log(answer);

                let data = urlParser.getUrlDataFromRequest(req);

                let url_accept = data.protocol + '://' + data.host + '/calendar/week/' + answer.data.token + '/1';
                let url_refuse = data.protocol + '://' + data.host + '/calendar/week/' + answer.data.token + '/0';

                //html for accepting or refusing

                let htmlStr = answer.data.email + " want's to have a meeting at " + parseDate(iso8601String);
                htmlStr += '<br> click here to accept: <a href = "' + url_accept + '"> Accept </a> <br> or here to refuse: <a href = "' + url_refuse + '"> Refuse </a>';

                mailHelper.sendMailForMeetingConfirmation(body.teacher, htmlStr);

                if (counter == (size - 1)) res.send({ error: null });

                //res.redirect('/');
            });
        }
        return;
    } else if (req.query['operation'] == 'deleteAvailable') {
        let user = req.body.user;

        databaseManager.sendRequest({
            id: sendIds.DELETE_AVAILABLE,
            data: {
                userid: user.id,
                token: user.sessionToken
            }
        }, (answer) => {
            console.log(answer);
            res.send({ error: null });
        });

    } else {
        //teacher wants to mark when is available for consultations
        let requestedMeetings = req.body.available;
        let user = req.body.user;
        console.log("User je: " + user);

        console.log("ID: " + user.id);
        console.log("User :" + user.sessionToken);

        for (let i = 0; i < requestedMeetings.length; i++) {

            var event = {
                "Subject": "Test from App",
                "startDate": "",
                "endDate": ""
            };

            var meeting = requestedMeetings[i];
            console.log("Current Meeting:"+ JSON.stringify(meeting))
            console.log("Starting time: " + meeting);

            //var calculatedEndTime = parseInt(meeting.startingTime, 10) + 1;
            //var startTime = meeting.year + '-0' + meeting.month + '-'
            //    + meeting.day + 'T' + meeting.startingTime + ':00:00' + 'Z';
            //var endTime = meeting.year + '-0' + meeting.month + '-'
            //    + meeting.day + 'T' + calculatedEndTime + ':00:00' + 'Z';


            let startTime = constructIso8601(meeting);
            addFifteenMinutes(meeting);
            let endTime = constructIso8601(meeting);

            console.log("startTime: " + startTime);
            console.log("EndTime: " + endTime);

            event.startDate = startTime;
            event.endDate = endTime;

            databaseManager.sendRequest({
                    id: sendIds.INSERT_CALENDAR_DATA,
                    data: {
                        userid: user.id,
                        token: user.sessionToken,
                        calendarInfo: [event],
                    }
                },
                (answer) => {
                    console.log(answer.state);
                    console.log({ i: i, len: requestedMeetings.length });
                    if (i == (requestedMeetings.length - 1)) res.send({ error: null });
                });
        }
        console.log([requestedMeetings]);
    }
});

router.get('/student/:date/:subject', (req, res) => {

    console.log("called");

    postOutlookData(req, res, req.params.subject, dateToMeetingFormat(req.params.date));

    res.redirect('/');
});

router.get('/:token/:answer', (req, res) => {

    let accept = true;
    if (req.params.answer == 0) accept = false;

    console.log(req.session);

    databaseManager.sendRequest({ id: sendIds.SEND_MEETING_ANSWER, data: { token: req.params.token, accept: accept } }, (answer) => {

        if (answer.state != operationStates.OPERATION_SUCCESS) {
            res.send({ error: answer.msg });
            return;
        }

        console.log(answer);

        if (answer.data) {

            let reciveEmail = answer.data.profEmail;
            let senderEmail = answer.data.senderEmail;
            let startDate = answer.data.startDate;
            let subject = answer.data.subject;

            let data = urlParser.getUrlDataFromRequest(req);

            let url_accept = data.protocol + '://' + data.host + '/calendar/week/student/' + startDate + '/' + subject;

            htmlStr = 'your meeting request for ' + parseDate(startDate) + ' has been accepted <br>';
            htmlStr += 'click here to add it to your outlook calendar: <a href = "' + url_accept + '"> Add </a>';

            mailHelper.sendMailForMeetingConfirmation(senderEmail, htmlStr);

            // deal with outlook calendar
            postOutlookData(req, res, subject, dateToMeetingFormat(startDate));

        }

        res.redirect('/');
    });
});

/**
 * Unesi podatke u Outlook
 * @param {Object} req
 * @param {Object} res
 * @param {Object} subject
 * @param {Object} requestedMeetings
 * @param {Object} recallback
 */
function postOutlookData(req, res, subject, requestedMeetings, recallback) {
    //student has requested meeting from teacher
    //let teacher = req.body.teacher;
    //console.log("Request: "+req.body.subject)
    //console.log("Requested meeeting: "+req.body.requestedMeetings[0].day);
    //console.log("Requested meeeting: "+req.body.rerequestedMeetings)
    var token = req.session.access_token;
    var email = req.session.email;

    if (!token || !email) {
        var authCode = req.query.code;
        authHelper.getTokenFromCode(authCode, tokenReceived, req, res);
    } else {
        if (token === undefined || email === undefined) {
            console.log('/post on Outlook called while not logged in');
            res.redirect('/');
            return;
        }

        // Set the endpoint to API v2
        outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
        // Set the user's email as the anchor mailbox
        outlook.base.setAnchorMailbox(req.session.email);
        // Set the preferred time zone
        console.log("Zona je : " + outlook.base.preferredTimeZone());
        outlook.base.setPreferredTimeZone('Europe/Berlin');
        console.log("Zona je : " + outlook.base.preferredTimeZone());

        // Use the syncUrl if available
        var requestUrl = req.session.syncUrl;
        if (requestUrl === undefined) {
            // Calendar sync works on the CalendarView endpoint
            requestUrl = outlook.base.apiEndpoint() + '/me/events';
        }

        // Set the required headers for sync
        var headers = {
            Prefer: [
                // Requests only 5 changes per response
                'odata.maxpagesize=5'
            ]
        };

        var event = {
            "Subject": "Test from App",
            "Start": {
                "DateTime": "2019-01-04T12:00:00",
                "TimeZone": "Europe/Berlin"
            },
            "End": {
                "DateTime": "2019-01-04T13:00:00",
                "TimeZone": "Europe/Berlin"
            }
        };

        //var calculatedStartTime = parseInt(requestedMeetings.startingTime,10)-1;
        //var calculatedEndTime = parseInt(requestedMeetings.startingTime,10);

        event.Subject = subject;
        //var startTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
        //    +requestedMeetings.day+'T'+calculatedStartTime+':00:00'+'Z';
        //var endTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
        //    +requestedMeetings.day+'T'+calculatedEndTime+':00:00'+'Z';

        requestedMeetings.startingTime--;
        let endTime = constructIso8601(requestedMeetings);
        requestedMeetings.startingTime--;
        let startTime = constructIso8601(requestedMeetings);

        event.Start.DateTime = startTime;
        event.End.DateTime = endTime;

        //console.log("")
        //console.log("CalculatedEndTime: "+ calculatedEndTime);
        //console.log("Start time: "+ startTime);
        //console.log("End time: "+ endTime);
        console.log("Event je:" + JSON.stringify(event, null, 2));

        var apiOptions = {
            url: requestUrl,
            token: token,
            headers: headers,
            event: event
        };

        let createEventParameters = {
            token: token,
            event: event
        };

        //console.log('requestUrl ' + apiOptions.url);
        //console.log('token ' + apiOptions.token);
        //console.log('headers ' + apiOptions.headers);
        //console.log("Došao");

        outlook.calendar.createEvent(createEventParameters, function (error, event) {
            if (error) {
                console.log(error);
            } else {
                console.log(event);
            }
        });

        //console.log("prošao");
        //console.log('subject: ',subject,'requested meetings: ',requestedMeetings);
        //res.redirect('/sync');
    }
}

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

        var token = req.session.access_token;
        var email = req.session.email;

        if (token === undefined || email === undefined) {
            console.log('/post on Outlook called while not logged in');
            res.redirect('/');
            return;
        }

        // Set the endpoint to API v2
        outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
        // Set the user's email as the anchor mailbox
        outlook.base.setAnchorMailbox(req.session.email);
        // Set the preferred time zone
        console.log("Zona je : " + outlook.base.preferredTimeZone());
        outlook.base.setPreferredTimeZone('Europe/Berlin');
        console.log("Zona je : " + outlook.base.preferredTimeZone());

        // Use the syncUrl if available
        var requestUrl = req.session.syncUrl;
        if (requestUrl === undefined) {
            // Calendar sync works on the CalendarView endpoint
            requestUrl = outlook.base.apiEndpoint() + '/me/events';
        }

        // Set the required headers for sync
        var headers = {
            Prefer: [
                // Requests only 5 changes per response
                'odata.maxpagesize=5'
            ]
        };

        var event = {
            "Subject": "Test from App",
            "Start": {
                "DateTime": "2019-01-04T12:00:00",
                "TimeZone": "Europe/Berlin"
            },
            "End": {
                "DateTime": "2019-01-04T13:00:00",
                "TimeZone": "Europe/Berlin"
            }
        };

        //var calculatedStartTime = parseInt(requestedMeetings.startingTime,10)-1;
        //var calculatedEndTime = parseInt(requestedMeetings.startingTime,10);

        event.Subject = subject;
        //var startTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
        //    +requestedMeetings.day+'T'+calculatedStartTime+':00:00'+'Z';
        //var endTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
        //    +requestedMeetings.day+'T'+calculatedEndTime+':00:00'+'Z';

        requestedMeetings.startingTime--;
        let endTime = constructIso8601(requestedMeetings);
        requestedMeetings.startingTime--;
        let startTime = constructIso8601(requestedMeetings);

        event.Start.DateTime = startTime;
        event.End.DateTime = endTime;

        //console.log("")
        //console.log("CalculatedEndTime: "+ calculatedEndTime);
        //console.log("Start time: "+ startTime);
        //console.log("End time: "+ endTime);
        console.log("Event je:" + JSON.stringify(event, null, 2));

        var apiOptions = {
            url: requestUrl,
            token: token,
            headers: headers,
            event: event
        };

        let createEventParameters = {
            token: token,
            event: event
        };

        //console.log('requestUrl ' + apiOptions.url);
        //console.log('token ' + apiOptions.token);
        //console.log('headers ' + apiOptions.headers);
        //console.log("Došao");

        outlook.calendar.createEvent(createEventParameters, function (error, event) {
            if (error) {
                console.log(error);
            } else {
                console.log(event);
            }
        });

        //console.log("prošao");
        //console.log('subject: ',subject,'requested meetings: ',requestedMeetings);
        //res.redirect('/sync');
    }
}

module.exports = router;