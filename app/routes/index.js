var express = require('express');
var router = express.Router();

// var response ="";

router.use('/user',require('./user'));

const databaseManager = require('../DatabaseManager');
const ids             = require('../constants').databaseGetRequests;
const operationStates = require('../constants').databaseErrors; 

// const sendIds = require('../constants').databaseSendRequests; // for testing 

/* GET home page. */
router.get('/', function(req, res) {

    if (!databaseManager.isReady()) {
        setTimeout(()=>{
            console.log('Database Manager is not ready.');
        },200);
        res.redirect('/');
        return;
    }

    //for testing

   //databaseManager.sendRequest({ id: sendIds.CREATE_NEW_USER, data: { username: 'oetmateo', email: 'test@test.com', password: 'testPass' } }, (answer) => {
   //
   //    console.log(answer.msg);
   //
   //    //databaseManager.sendRequest({ id: sendIds.LOGIN_REQUEST, data: { username: 'oetmateo', password: 'testPass' } }, (answer) => {
   //    databaseManager.sendRequest({ id: sendIds.LOGIN_REQUEST, data: { email: 'test@test.com', password: 'testPass' } }, (answer) => {
   //
   //        if (answer.state != operationStates.OPERATION_SUCCESS) {
   //            console.log(answer.msg);
   //            return;
   //        }
   //
   //        console.log(answer.data);
   //
   //        databaseManager.sendRequest({ id: sendIds.TERMINATE_SESSION, data: { userid: answer.data.id, token: answer.data.sessionToken } }, (answer) => {
   //
   //            if (answer.state != operationStates.OPERATION_SUCCESS) {
   //                console.log(answer.msg);
   //                return
   //            }
   //
   //            console.log("session terminated");
   //        });
   //    });
   //}); 

    databaseManager.getSingleRequest({ id: ids.USER }, (answer) => {

        if (answer.state != operationStates.OPERATION_SUCCESS) {

            res.render('index', {
                message : answer.msg,
                loggedIn: false,
                students: null
            });

            return;
        }

        res.render('index', {
            message: "Welcome to VM Projekt",
            loggedIn: true,
            students: answer.data
        });
    });

    //var sql = require("mssql");
    //
    //console.log(response);
    //// config for your database
    //var config = {
    //    user: 'calendarAdmin',
    //    password: 'VMproject123',
    //    server: 'calendarsyncazure.database.windows.net',
    //    database: 'calendarSyncDatabase',
    //    encrypt: true
    //};
    //
    //sql.close();
    //// connect to your database
    //sql.connect(config, function (err) {
    //    if (err) console.log(err);
    //
    //    // create Request object
    //    var request = new sql.Request();
    //
    //    //students array for view
    //    let students = new Array();
    //    // query to the database and get the records
    //    request.query('select * from Student', function (err, recordset) {
    //        if (err) console.log(err)
    //        // send records as a response
    //        var jsonPretty = JSON.stringify(recordset,null,2);
    //        var objectValue = JSON.parse(jsonPretty);
    //
    //        for(var i = 0; i < objectValue['rowsAffected'][0]; i++){
    //
    //            var string = JSON.stringify(objectValue['recordset'][i]);
    //            var objectValuethis = JSON.parse(string);
    //
    //            students.push({
    //                firstName : objectValuethis['firstName'],
    //                lastName : objectValuethis['lastName']
    //            });
    //        }
    //
    //        res.render('index', {
    //            message: "Welcome to VM Projekt",
    //            loggedIn: true,
    //            students: students
    //        });
    //    });
    //});
});

module.exports = router;
