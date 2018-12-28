var express = require('express');
var router = express.Router();

router.get('/',(req,res)=>{

    //gets index from request
    let index = req.query.index;

    //gets name from request
    let fullName = req.query.fullName;

    if(index && fullName) {
        console.log(index,fullName)
        res.render('./calendar/week',{teacher: {
            fullName:fullName,
            index:index
        },
        loggedIn:true});
        return;
    }

    console.log(index,fullName);

    res.render('./calendar/teachers', 
    { loggedIn:true,
        teachers: [{
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