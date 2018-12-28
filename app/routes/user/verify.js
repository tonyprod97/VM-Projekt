var express = require('express');
var router = express.Router();

const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests; 
const operationStates = require('../../constants').databaseErrors; 

router.get('/:id/:token', (req, res) => {
    let user = req.body.user;

    databaseManager.sendRequest({ id: sendIds.VERIFY_USER, data: { userid: req.params.id, verificationToken: req.params.token } }, (answer) => {

        if (answer.state != operationStates.OPERATION_SUCCESS) {
            res.send({error: answer.msg });
            return;
        }

        console.log(answer);

        
        res.redirect('/');
        //res.send({ redirectUrl: '/home', error: "account verification success" });
    });
});

module.exports = router;