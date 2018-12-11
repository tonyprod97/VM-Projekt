var express = require('express');
var router = express.Router();

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests; 
const operationStates = require('../../constants').databaseErrors; 

router.get('/', (req, res) => res.render('./user/register'));

router.post('/',(req,res) => {
    let user = req.body.user;

   databaseManager.sendRequest(
       { 
           id: sendIds.CREATE_NEW_USER, 
           data: { 
               email: user.email, password: user.password 
            } }, 
            (answer) => {

                console.log(answer.msg);

                if (answer.state != operationStates.OPERATION_SUCCESS) {
                    res.send({ redirectUrl: './register', error: answer.msg, email: user.email });
                    return;
                }

                res.send({
                    redirectUrl: './login'
                });
   }); 
});

module.exports = router;