var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

router.get('/', permit, (req,res)=>{

    //gets index from request
    let index = req.query.index;

    //gets name from request
    let fullName = req.query.fullName;

    if(index && fullName) {
        console.log(index,fullName)
        res.render('./calendar/week',{person: {
            fullName:fullName,
            index:index
        },
        loggedIn:true});
        return;
    }

    console.log(index,fullName);

    res.render('./calendar/community', 
    { loggedIn:true,
        people: [{
            index:1,
            fullName: 'Vedran Mornar'
        },
        {
            index:2,
            fullName: 'Test A'
        }
    ]
    });
});

module.exports = router;