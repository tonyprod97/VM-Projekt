var express = require('express');
var router = express.Router();
const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests; 

router.get('/', (req,res)=>res.render('./user/register'));
router.post('/',(req,res) => {
    let user = req.body.user;
    
    
   databaseManager.sendRequest(
       { 
           id: sendIds.CREATE_NEW_USER, 
           data: { 
               username: 'unknown', email: user.email, password: user.password 
            } }, (answer) => {
      console.log(answer.msg);
   }); 


});

module.exports = router;