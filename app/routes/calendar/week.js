var express = require('express');
var router = express.Router();

router.get('/',(req,res)=>{
    res.render('./calendar/week', { loggedIn:true});
});

router.post('/',(req,res)=>{
    let requestedMeetings = req.body.requestedMeetings;
    console.log('requested meetings: ',requestedMeetings);
})

module.exports = router;