var express = require('express');
var router = express.Router();
const databaseManager = require('../../DatabaseManager');
const sendIds = require('../../constants').databaseSendRequests; 

router.post('/',(req,res)=>{
   let user = req.body.user;
   //console.log(user);

   req.session.destroy();
   databaseManager.sendRequest({
        id: sendIds.TERMINATE_SESSION, 
           data: { 
               userid: user.id, token: user.sessionToken 
            } }, 
            (answer) => {
                //console.log(answer.msg);
                res.send({
                  redirectUrl: '/'
              });
   }); 
});
module.exports = router;