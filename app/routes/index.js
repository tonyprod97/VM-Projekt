var express = require('express');
var router = express.Router();

var response ="";

router.use('/user',require('./user'));

/* GET home page. */
router.get('/', function(req, res) {

    var sql = require("mssql");

    console.log(response);
    // config for your database
    var config = {
        user: 'calendarAdmin',
        password: 'VMproject123',
        server: 'calendarsyncazure.database.windows.net',
        database: 'calendarSyncDatabase',
        encrypt: true
    };

    sql.close();
    // connect to your database
    sql.connect(config, function (err) {
        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();
    
        //students array for view
        let students = new Array();
        // query to the database and get the records
        request.query('select * from Student', function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            var jsonPretty = JSON.stringify(recordset,null,2);
            var objectValue = JSON.parse(jsonPretty);

            for(var i = 0; i < objectValue['rowsAffected'][0]; i++){

                var string = JSON.stringify(objectValue['recordset'][i]);
                var objectValuethis = JSON.parse(string);

                students.push({
                    firstName : objectValuethis['firstName'],
                    lastName : objectValuethis['lastName']
                });
            }
            
            res.render('index', {
                message: "Welcome to VM Projekt",
                loggedIn: true,
                students: students
            });
        });
    });
});

module.exports = router;
