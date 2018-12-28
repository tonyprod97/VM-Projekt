var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {

    if (req.session.user == undefined) {
        res.redirect('../../user/login');
        return;
    }

    //gets index from request
    let index = req.query.index;

    //gets name from request
    let fullName = req.query.fullName;

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