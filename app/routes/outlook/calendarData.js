var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

router.post('/', permit, (req,res)=>{
    let user = req.body.user;
    console.log('Current user data:',user);
    
    const teacher = req.query['teacher'];
    if(teacher) {
        //send data for profesor with name teacher
        res.send({
            calendarData: JSON.stringify(require('../index').calendarDataProf)
        });
        return;
    }
    res.send({
        //send data for user
        calendarData: JSON.stringify(require('../index').calendarData)
    });
});

module.exports = router;