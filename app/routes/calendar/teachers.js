var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

const databaseManager = require('../../DatabaseManager');
const getIds = require('../../constants').databaseGetRequests;
const operationStates = require('../../constants').databaseErrors;

router.get('/', permit, (req, res) => {
    databaseManager.getSingleRequest({ id: getIds.GET_VERIFIED_USERS }, (answer) => {

        if (answer.state != operationStates.OPERATION_SUCCESS) {
            res.render('index', { error: answer.msg });
            return;
        }

        let people = [];

        answer.data.forEach((element, index) => {
            people.push({ fullName: element.email, index: (index + 1) });
        });

        res.render('./calendar/teachers', { loggedIn: true, people: people });
    });

    //gets index from request
    //let index = req.query.index;
    //
    ////gets name from request
    //let fullName = req.query.fullName;
    //
    //if(index && fullName) {
    //    console.log(index,fullName)
    //    res.render('./calendar/week',{person: {
    //        fullName:fullName,
    //        index:index
    //    },
    //    loggedIn:true});
    //    return;
    //}
    //
    //console.log(index,fullName);
    //
    //res.render('./calendar/teachers', 
    //{ loggedIn:true,
    //    people: [{
    //        index:1,
    //        fullName: 'Vedran Mornar'
    //    },
    //    {
    //        index:2,
    //        fullName: 'Test A'
    //    }
    //]
    //});
});

module.exports = router;