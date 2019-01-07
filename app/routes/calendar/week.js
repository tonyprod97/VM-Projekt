var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

var outlook = require('node-outlook');
const mailHelper = require('../../EmailManager');

router.get('/', permit, (req,res)=>{
    //get finalResponse from db
    //const finalResonse = ....;
    res.render('./calendar/week', {loggedIn:true, role: 0}); // 0 is student 1 if teacher
});

router.post('/', permit, (req,res)=>{
    let subject = req.body.subject;
    let requestedMeetings = req.body.requestedMeetings[0];

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
        +requestedMeetings.day+'T'+requestedMeetings.startingTime+':00:00';
    var endTime = requestedMeetings.year+'-'+requestedMeetings.month+'-'
        +requestedMeetings.day+'T'+calculatedEndTime+':00:00';

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

});

module.exports = router;