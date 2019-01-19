var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

const databaseManager = require('../../DatabaseManager');
const getRequests = require('../../constants').databaseGetRequests;
const sendIds = require('../../constants').databaseSendRequests;
const operationStates = require('../../constants').databaseErrors;

router.post('/', permit, (req,res)=>{
    let user = req.body.user;
    console.log('Current user data:',user);
    const teacher = req.query['teacher'];
    if(teacher) {
        //send data for profesor with name teacher
        var arrayResponses =[];
        databaseManager.getSingleRequest({
                id: getRequests.GET_ID_FROM_MAIL,
                data: {
                    email: teacher,
                }
            },
            (answer) => {

                var teacherID=answer.data[0].id;
                var teacherMail=teacher;
                console.log(answer);


                databaseManager.getSingleRequest({
                        id: getRequests.GET_CALENDAR,
                        data: {
                            userid: teacherID,
                            token: user.sessionToken,
                            email: teacher
                        }
                    },
                    (answer) => {

                        console.log(answer);
                        console.log(answer.length);
                        for(var i=0;i<answer.data.length;i++){
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
                            event.Start.DateTime=answer.data[i].startDate.substring(0,answer.data[i].startDate.length-1);
                            event.End.DateTime=answer.data[i].endDate.substring(0,answer.data[i].endDate.length-1);
                            arrayResponses.push(event);

                        }
                        console.log(arrayResponses);
                    });
            });
        res.send({
            calendarData: JSON.stringify(require('../index').arrayResponses)
        });
        return;
    }
    res.send({
        //send data for user
        calendarData: JSON.stringify(require('../index').calendarData)
    });
});

module.exports = router;