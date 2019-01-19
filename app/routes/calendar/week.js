var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests;
const operationStates = require('../../constants').databaseErrors;

var outlook = require('node-outlook');
const mailHelper = require('../../EmailManager');

router.get('/', permit, (req,res)=>{
    const teacher = req.query['teacher'];

    if(teacher) {
        res.render('./calendar/week', {loggedIn:true,teacher:teacher});
        return;
    }
    res.render('./calendar/week', {loggedIn:true});
});

router.post('/', permit, (req,res)=>{

    if(req.query['operation']=='requestMeeting') {
        //student has requested meeting from teacher
        let subject = req.body.subject;
        let requestedMeetings = req.body.requestedMeetings[0];
        let teacher = req.body.teacher;

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
        outlook.base.setPreferredTimeZone('Europe/Paris');

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
            "Body": {
                "ContentType": "HTML",
                "Content": "Pokušaj stavljanja na outlook!"
            },
            "Start": {
                "DateTime": "2019-01-04T12:00:00",
                "TimeZone": "Europe/Paris"
            },
            "End": {
                "DateTime": "2019-01-04T13:00:00",
                "TimeZone": "Europe/Paris"
            }
        };

        var calculatedEndTime = parseInt(requestedMeetings.startingTime,10)+1;

        event.Subject=subject;
        var startTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
            +requestedMeetings.day+'T'+requestedMeetings.startingTime+':00:00'+'Z';
        var endTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
            +requestedMeetings.day+'T'+calculatedEndTime+':00:00'+'Z';

        event.Start.DateTime=startTime;
        event.End.DateTime=endTime;

        console.log("CalculatedEndTime: "+ calculatedEndTime);
        console.log("Start time: "+ startTime);
        console.log("End time: "+ endTime);
        console.log(event);

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

        console.log('requestUrl ' + apiOptions.url);
        console.log('token ' + apiOptions.token);
        console.log('headers ' + apiOptions.headers);

        console.log("Došao");

        outlook.calendar.createEvent(createEventParameters, function (error, event) {
            if(error) {
                console.log(error);
            } else {
                console.log(event);
            }
        });

        console.log("prošao");
        console.log('subject: ',subject,'requested meetings: ',requestedMeetings);

        res.redirect('/sync');

    } else {
        //teacher wants to mark when is available for consultations
        let requestedMeetings = req.body.available[0];
        let user = req.body.user;

        console.log("ID: "+ user.id);
        console.log("User :" + user.sessionToken);

        var event = {
            "Subject": "Test from App",
            "startDate": "",
            "endDate": ""
        };


        var calculatedEndTime = parseInt(requestedMeetings.startingTime,10)+1;
        var startTime = requestedMeetings.year+'-0'+requestedMeetings.month+'-'
            +requestedMeetings.day+'T'+requestedMeetings.startingTime+':00:00'+'.23Z';
        var endTime = requestedMeetings.year+'-0'+requestedMeetings.month+'-'
            +requestedMeetings.day+'T'+calculatedEndTime+':00:00'+'.23Z';

        console.log("startTime: "+startTime);

        event.startDate=startTime;
        event.endDate=endTime;

        databaseManager.sendRequest({
                id: sendIds.INSERT_CALENDAR_DATA,
                data: {
                    userid: user.id,
                    token: user.sessionToken,
                    calendarInfo: [event],
                } },
            (answer) => {
                console.log(answer.state);
            });

        console.log([requestedMeetings]);
    }
    

});

module.exports = router;