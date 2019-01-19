var express = require('express');
var router = express.Router();

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests;
const operationStates = require('../../constants').databaseErrors;

const emailManager = require('../../EmailManager');
const urlParser = require('../../UrlManager');

function parseDate(dateSent) {

    let date = new Date(dateSent);

    let month = '' + (date.getMonth() + 1);
    let day   = '' + date.getDate();
    let year  = '' + date.getFullYear();

    let hours = '' + date.getHours();
    let min   = '' + date.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (min.length < 2) min = '0' + min;

    return [day, month, year].join('.') + " starting at " + hours + ":" + min;
}

router.post('/request', (req, res) => {
    let user = req.body.user;

    let size = user.startDate.length;

    for (let counter = 0; counter < size; counter++) {

        databaseManager.sendRequest({ id: sendIds.SEND_MEETING_REQUEST, data: { userid: user.userid, token: user.token, startDate: user.startDate[counter], toEmail: user.toEmail } }, (answer) => {

            if (answer.state != operationStates.OPERATION_SUCCESS) {
                //res.send({ error: answer.msg });
                if (counter == (size - 1)) res.send({ error: null });
                return;
            }

            console.log(answer);

            let data = urlParser.getUrlDataFromRequest(req);

            url_accept = data.protocol + '://' + data.host + '/user/meeting/' + answer.data.token + '/1';
            url_refuse = data.protocol + '://' + data.host + '/user/meeting/' + answer.data.token + '/0';

            //html for accepting or refusing

            htmlStr = answer.data.email + " want's to have a meeting at " + parseDate(user.startDate[counter]);
            htmlStr += '<br> click here to accept: <a href = "' + url_accept + '"> Accept </a> <br> or here to refuse: <a href = "' + url_refuse + '"> Refuse </a>';

            emailManager.sendMailForMeetingConfirmation(user.toEmail, htmlStr);

            if(counter == (size - 1)) res.send({ error: null });

            //res.redirect('/');
        });
    }
});

router.get('/:token/:answer', (req, res) => {
    
    let accept = true;
    if (req.params.answer == 0) accept = false;

    databaseManager.sendRequest({ id: sendIds.SEND_MEETING_ANSWER, data: { token: req.params.token, accept: accept } }, (answer) => {

        if (answer.state != operationStates.OPERATION_SUCCESS) {
            res.send({ error: answer.msg });
            return;
        }

        console.log(answer);

        if (answer.data) {

            let reciveEmail = answer.data.profEmail;
            let senderEmail = answer.data.senderEmail;
            let startDate   = answer.data.startDate;
            let endDate     = answer.data.endDate;

            // deal with outlook calendar

        }

        res.redirect('/');
    });
});


module.exports = router;