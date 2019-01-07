var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

router.post('/', permit, (req,res)=>{
    res.send({
        calendarData: JSON.stringify(require('../index').calendarData)
    });
});

module.exports = router;