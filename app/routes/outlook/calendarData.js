var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

const databaseManager = require('../../DatabaseManager');
const getRequests = require('../../constants').databaseGetRequests;
const sendIds = require('../../constants').databaseSendRequests;
const operationStates = require('../../constants').databaseErrors;

const authHelper = require('../../OutlookManager');
var outlook = require('node-outlook');
var moment = require('moment');



router.post('/', permit, (req,res)=>{
    let user = req.body.user;
    console.log('Current user data:',user);
    const teacher = req.query['teacher'];
    var arrayResponses =[];

    getOutlookData(req, res, (data) => {
        for (var i = 0; i < data.length; i++) {
            arrayResponses.push(data[i]);
        }

        if (teacher) {
            //send data for profesor with name teacher
            databaseManager.getSingleRequest({
                id: getRequests.GET_ID_FROM_MAIL,
                data: {
                    email: teacher,
                }
            },
                (answer) => {
                    var teacherID = answer.data[0].id;

                    getTeacherChecked(teacherID, teacher, user, (data) => {
                        for (var i = 0; i < data.length; i++) {
                            arrayResponses.unshift(data[i]);
                        }

                        res.send({
                            calendarData: JSON.stringify(arrayResponses)
                        });
                    });
                });
        } else if (!user.isStudent) {
            getTeacherChecked(user.id, user.email, user, (data) => {
                for (var i = 0; i < data.length; i++) {
                    arrayResponses.unshift(data[i]);
                }

                res.send({
                    calendarData: JSON.stringify(arrayResponses)
                });
            });
        } else {
            res.send({
                calendarData: JSON.stringify(arrayResponses)
            });
        }
    });
});

 function getTeacherChecked(teacherID, teacher, user, callback) {
    var arrayResponses = [];
    databaseManager.getSingleRequest({
        id: getRequests.GET_CALENDAR,
        data: {
            userid: teacherID,
            token: user.sessionToken,
            email: teacher
        }
    },
        (answer) => {

            //console.log(answer);
            //console.log(answer.length);
            for (var i = 0; i < answer.data.length; i++) {
                var event = {
                    "Subject": "Odabrani termin",
                    "Start": {
                        "DateTime": "",
                        "TimeZone": "Europe/Paris"
                    },
                    "End": {
                        "DateTime": "",
                        "TimeZone": "Europe/Paris"
                    },
                    "Location": "D259"
                };
                event.Start.DateTime = answer.data[i].startDate.substring(0, answer.data[i].startDate.length - 1);
                event.End.DateTime = answer.data[i].endDate.substring(0, answer.data[i].endDate.length - 1);
                arrayResponses.push(event);

            }
            //console.log('array for frontend: ', typeof arrayResponses, arrayResponses);
            callback(arrayResponses);
        });
}

function getOutlookData(req, res, callback) {
    var token = req.session.access_token;
    var email = req.session.email;

    if (token === undefined || email === undefined) {
        console.log('/sync called while not logged in');
        callback('');
        return;
    }

    // Set the endpoint to API v2
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the user's email as the anchor mailbox
    outlook.base.setAnchorMailbox(email);
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

    outlook.base.makeApiCall(apiOptions, function (error, response) {
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

                var data = response.body.value;
                //console.log(JSON.stringify(response.body.value))
                //save in database final response
                //res.render('./calendar/week',{calendarData:JSON.stringify(finalResponse),loggedIn:true});
                callback(data);
            }
        }
    });
}
/*
res.send({
    calendarData: finalResponse
});
*/

module.exports = router;