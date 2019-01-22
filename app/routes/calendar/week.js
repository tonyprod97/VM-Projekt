var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests;
const getIds = require('../../constants').databaseGetRequests;
const operationStates = require('../../constants').databaseErrors;

var outlook = require('node-outlook');
const mailHelper = require('../../EmailManager');

const urlParser = require('../../UrlManager');

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

/**
 * Parsiranje datuma
 * @param {Object} dateSent 
 * @returns {String} datum i pocetno vrijeme
 */
exports.parseDate = function (dateSent) {

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
exports.constructIso8601 = function (meeting) {

    let year  = '' + meeting.year;
    let month = '' + meeting.month;
    let day   = '' + meeting.day;
    let hour  = '' + meeting.startingTime;

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hour.length < 2) hour = '0' + hour;

    return [year, month, day].join('-') + "T" + hour + ":00:00Z"; 
}

/**
 * ...... 
 * @param {Object} dateSent 
 * @returns {Object} objekt s varijablama datuma i vremena
 */
exports.dateToMeetingFormat = function (dateSent) {
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

router.post('/', permit, (req,res)=>{

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
        console.log("User je: "+user);

        console.log("ID: "+ user.id);
        console.log("User :" + user.sessionToken);

        for (let i=0;i <requestedMeetings.length;i++) {

            var event = {
                "Subject": "Test from App",
                "startDate": "",
                "endDate": ""
            };

            var meeting=requestedMeetings[i];
            console.log("Starting time: "+meeting);

            //var calculatedEndTime = parseInt(meeting.startingTime, 10) + 1;
            //var startTime = meeting.year + '-0' + meeting.month + '-'
            //    + meeting.day + 'T' + meeting.startingTime + ':00:00' + 'Z';
            //var endTime = meeting.year + '-0' + meeting.month + '-'
            //    + meeting.day + 'T' + calculatedEndTime + ':00:00' + 'Z';


            let startTime = constructIso8601(meeting);
            meeting.startingTime++;
            let endTime   = constructIso8601(meeting);

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

module.exports = router;