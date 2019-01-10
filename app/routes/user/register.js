var express = require('express');
var router = express.Router();

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests;
const getIds  = require('../../constants').databaseGetRequests;
const operationStates = require('../../constants').databaseErrors; 

const emailManager = require('../../EmailManager');
const urlParser = require('../../UrlManager');

router.get('/', (req, res) => res.render('./user/register'));

router.post('/', (req, res) => {

    let user = req.body.user;
    let isStudent = 1;

    if (user.role) {
        if (user.role === 1) isStudent = 0;
    }

    databaseManager.sendRequest({id: sendIds.CREATE_NEW_USER, data: { email: user.email, password: user.password, isStudent: isStudent}}, (answer) => {

        console.log(answer.msg);

        if (answer.state != operationStates.OPERATION_SUCCESS) {
            res.send({ redirectUrl: './register', error: answer.msg, email: user.email });
            return;
        }

        databaseManager.getSingleRequest({ id: getIds.GET_VERIFICATION, data: { email: user.email } }, (answer) => {

            if (answer.state != operationStates.OPERATION_SUCCESS) {
                res.send({error: answer.msg});
                return;
            }

            let data = urlParser.getUrlDataFromRequest(req);

            //console.log(data);

            url = data.protocol + '://' + data.host  + '/user/verify/' + answer.data.userid + '/' + answer.data.token;

            console.log("account verification url: " + url);

            emailManager.sendVerificationMail(user.email, url);
            res.send({ redirectUrl: './login' });
        });
   }); 
});

module.exports = router;