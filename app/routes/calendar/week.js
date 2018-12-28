var express = require('express');
var router = express.Router();

router.get('/',(req,res)=>{
    res.render('./calendar/week', { loggedIn:true});
});

router.post('/',(req,res)=>{
    let subject = req.body.subject;
    let requestedMeetings = req.body.requestedMeetings;
    console.log('subject: ',subject,'requested meetings: ',requestedMeetings);
})

module.exports = router;