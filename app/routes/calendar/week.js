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
    //console.log("techer:" + user.email);
    //console.log(teacher.id);

    if(teacher) {
        res.render('./calendar/week', {loggedIn:true,teacher:teacher});
        return;
    }
    res.render('./calendar/week', {loggedIn:true});
});

router.post('/', permit, (req,res)=>{

    if(req.query['operation']=='requestMeeting') {
        let subject = req.body.subject;
        let requestedMeetings = req.body.requestedMeetings[0];
        postOutlookData(req,res,subject,requestedMeetings);

    } else {
        //teacher wants to mark when is available for consultations
        let requestedMeetings = req.body.available;
        let user = req.body.user;
        console.log("User je: "+user);

        console.log("ID: "+ user.id);
        console.log("User :" + user.sessionToken);



        for (var i=0;i <requestedMeetings.length;i++) {

            var event = {
                "Subject": "Test from App",
                "startDate": "",
                "endDate": ""
            };

            var meeting=requestedMeetings[i];
            console.log("Starting time: "+meeting);

            var calculatedEndTime = parseInt(meeting.startingTime, 10) + 1;
            var startTime = meeting.year + '-0' + meeting.month + '-'
                + meeting.day + 'T' + meeting.startingTime + ':00:00' + '.23Z';
            var endTime = meeting.year + '-0' + meeting.month + '-'
                + meeting.day + 'T' + calculatedEndTime + ':00:00' + '.23Z';

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
                });
        }
        console.log([requestedMeetings]);
    }
});

function postOutlookData(req, res, subject,requestedMeetings, recallback) {
    //student has requested meeting from teacher
    //let teacher = req.body.teacher;
    //console.log("Request: "+req.body.subject)
    //console.log("Requested meeeting: "+req.body.requestedMeetings[0].day);
    //console.log("Requested meeeting: "+req.body.rerequestedMeetings)
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

    var calculatedStartTime = parseInt(requestedMeetings.startingTime,10)-1;
    var calculatedEndTime = parseInt(requestedMeetings.startingTime,10);

    event.Subject=subject;
    var startTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
        +requestedMeetings.day+'T'+calculatedStartTime+':00:00'+'Z';
    var endTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
        +requestedMeetings.day+'T'+calculatedEndTime+':00:00'+'Z';

    event.Start.DateTime=startTime;
    event.End.DateTime=endTime;

    //console.log("")
    //console.log("CalculatedEndTime: "+ calculatedEndTime);
    //console.log("Start time: "+ startTime);
    //console.log("End time: "+ endTime);
    console.log("Event je:"+JSON.stringify(event, null, 2));

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
        if(error) {
            console.log(error);
        } else {
            console.log(event);
        }
    });

    //console.log("prošao");
    //console.log('subject: ',subject,'requested meetings: ',requestedMeetings);
    //res.redirect('/sync');
}

module.exports = router;