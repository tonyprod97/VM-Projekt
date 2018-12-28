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
var outlook = require('node-outlook');
var moment = require('moment');
const session = require('express-session');

const mailHelper = require('../EmailManager');

router.use(session(
    {
        secret: '0dc529ba-5051-4cd6-8b67-c9a901bb8bdf',
        resave: false,
        saveUninitialized: false
    }));

//const sendIds = require('../constants').databaseSendRequests; // for testing 

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
    //        databaseManager.getSingleRequest({ id: ids.GET_VERIFICATION, data: { email: 'test@test.com' } }, (answer) => {
    //
    //            if (answer.state != operationStates.OPERATION_SUCCESS) {
    //                console.log(answer.msg);
    //                return;
    //            }
    //
    //            if (answer.data.verified) {
    //                console.log('user verified');
    //                return;
    //            }
    //
    //            console.log(answer.data);
    //
    //            databaseManager.sendRequest({ id: sendIds.VERIFY_USER, data: { userid: answer.data.userid, verificationToken: answer.data.token } }, (answer) => {
    //                if (answer.state != operationStates.OPERATION_SUCCESS) {
    //                    console.log(answer.msg);
    //                }
    //            });
    //        });
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

router.get('/home', (req,res)=>{
    res.render('home',{loggedIn:true});
});

/*
    JSONPathovi.
    za naslov - $.Subject
    početak eventa - $.Start.DateTime
    kraj eventa - $.End.DateTime
    mjesto događaja - $.Location.DisplayName

 */

router.get('/sync', function(req, res) {
    var token = req.session.access_token;
    var email = req.session.email;
    if (token === undefined || email === undefined) {
        console.log('/sync called while not logged in');
        res.redirect('/');
        return;
    }

    // Set the endpoint to API v2
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
    // Set the user's email as the anchor mailbox
    outlook.base.setAnchorMailbox(req.session.email);
    // Set the preferred time zone
    outlook.base.setPreferredTimeZone('Eastern Standard Time');

    // Use the syncUrl if available
    var requestUrl = req.session.syncUrl;
    if (requestUrl === undefined) {
        // Calendar sync works on the CalendarView endpoint
        requestUrl = outlook.base.apiEndpoint() + '/Me/CalendarView';
    }

    // Set up our sync window from midnight on the current day to
    // midnight 7 days from now.
    var startDate = moment().startOf('day');
    var endDate = moment(startDate).add(30, 'days');
    // The start and end date are passed as query parameters
    var params = {
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString()
    };

    // Set the required headers for sync
    var headers = {
        Prefer: [
            // Enables sync functionality
            'odata.track-changes',
            // Requests only 5 changes per response
            'odata.maxpagesize=5'
        ]
    };

    var apiOptions = {
        url: requestUrl,
        token: token,
        headers: headers,
        query: params
    };

    console.log('requestUrl ' + apiOptions.url);
    console.log('token ' + apiOptions.token);
    console.log('headers ' + apiOptions.headers);
    console.log('params ' + apiOptions.query);

    outlook.base.makeApiCall(apiOptions, function(error, response) {
        if (error) {
            console.log(JSON.stringify(error));
            res.send(JSON.stringify(error));
        }
        else {
            if (response.statusCode !== 200) {
                console.log('API Call returned ' + response.statusCode);
                res.send('API Call returned ' + response.statusCode);
            }
            else {
                console.log('API Call returned ' + response.statusCode);
                var nextLink = response.body['@odata.nextLink'];
                if (nextLink !== undefined) {
                    req.session.syncUrl = nextLink;
                }
                var deltaLink = response.body['@odata.deltaLink'];
                if (deltaLink !== undefined) {
                    req.session.syncUrl = deltaLink;
                }

                var finalResponse=JSON.stringify(response.body.value);
                //console.log(JSON.stringify(response.body.value))
                console.log('Final respone: '+ JSON.stringify(response.body.value));
                res.render('home',{calendarData:finalResponse,loggedIn:true});
                //res.redirect('/');

            }
        }
    });
});

router.get('/sendmail', function(req, res) {
    var subjectMail='lovro.knezevic1@gmail.com';
    mailHelper.sendVerificationMail(subjectMail,'added url');
    res.redirect('/');
});

module.exports = router;
