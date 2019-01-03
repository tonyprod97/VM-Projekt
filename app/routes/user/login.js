var express = require('express');
var router = express.Router();

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests; 
const operationStates = require('../../constants').databaseErrors; 

router.get('/', (req, res) =>   res.render('./user/login'));

router.post('/',(req,res) => {
    let user = req.body.user;
    let userData;

    databaseManager.sendRequest({
        id: sendIds.LOGIN_REQUEST, 
           data: { 
               email: user.email, password: user.password 
            } }, 
            (answer) => {
                userData = answer.data;
                //console.log(userData);

                if (answer.state != operationStates.OPERATION_SUCCESS) {
                    res.send({ redirectUrl: './login', error: answer.msg, email: user.email });
                    return;
                }

                req.session.user = userData;

                res.send({
                    userData: JSON.stringify(userData),
                    redirectUrl: '/calendar'
                });
   }); 

});

module.exports = router;