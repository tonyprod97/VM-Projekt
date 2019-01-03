var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

router.get('/', permit, (req,res)=>{
    res.render('./calendar/week', { loggedIn:true});
});

router.post('/', permit, (req,res)=>{
    let subject = req.body.subject;
    let requestedMeetings = req.body.requestedMeetings;
    console.log('subject: ',subject,'requested meetings: ',requestedMeetings);
})

module.exports = router;