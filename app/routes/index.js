var express = require('express');
var router = express.Router();

// var response ="";

router.use('/user',require('./user'));
router.use('/calendar',require('./calendar'));
router.get('/home',(req,res)=>{
    res.render('home',{loggedIn:true});
})

const databaseManager = require('../DatabaseManager');
const ids             = require('../constants').databaseGetRequests;
const operationStates = require('../constants').databaseErrors; 

const authHelper = require('../OutlookManager');
const session = require('express-session');

router.use(session(
    {
        secret: '0dc529ba-5051-4cd6-8b67-c9a901bb8bdf',
        resave: false,
        saveUninitialized: false
    }));
// const sendIds = require('../constants').databaseSendRequests; // for testing 

/* GET home page. */
router.get('/', function(req, res) {

    if (!databaseManager.isReady()) {

        setTimeout(()=> {
            console.log('Database Manager is not ready.');
            res.redirect('/');
        },200);
       
        return;
    }

    //for testing

   //databaseManager.sendRequest({ id: sendIds.CREATE_NEW_USER, data: { email: 'test@test.com', password: 'testPass' } }, (answer) => {
   //
   //    console.log(answer.msg);
   //
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
            loggedIn: false,
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

router.get('/authorize', function (req, res) {
    var authCode = req.query.code;
    if (authCode) {
        console.log('');
        console.log('Retrieved auth code in /authorize: ' + authCode);
        authHelper.getTokenFromCode(authCode, tokenReceived, req, res);
    }
    else {
        // redirect to home
        console.log('/authorize called without a code parameter, redirecting to login');
        res.redirect('/');
    }
});

/**
 * Checking if token is received
 * @param {Object} req
 * @param {Object} res
 * @param {Object} error
 * @param {Object} token
 */
function tokenReceived(req, res, error, token) {
    if (error) {
        console.log('ERROR getting token:' + error);
        res.send('ERROR getting token: ' + error);
    }
    else {
        // save tokens in session
        req.session.access_token = token.token.access_token;
        req.session.refresh_token = token.token.refresh_token;
        req.session.email = authHelper.getEmailFromIdToken(token.token.id_token);
        res.redirect('/');
    }
}

router.get('/refreshtokens', function (req, res) {
    var refresh_token = req.session.refresh_token;
    if (refresh_token === undefined) {
        console.log('no refresh token in session');
        res.redirect('/');
    }
    else {
        authHelper.getTokenFromRefreshToken(refresh_token, tokenReceived, req, res);
    }
});

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
