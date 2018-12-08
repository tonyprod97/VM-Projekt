var express = require('express');
var router = express.Router();
const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests; 

router.get('/', (req,res)=>res.render('./user/login',));
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

                res.send({
                    userData: JSON.stringify(userData),
                    redirectUrl: '/home'
                });
   }); 

});

module.exports = router;