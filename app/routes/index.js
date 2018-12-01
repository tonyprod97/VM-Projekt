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
        response = "{message:\"Welcome to VM Projekt\"," +
            "condition: true,"+
            "loggedIn: true," +
            "students: [";

        // query to the database and get the records
        request.query('select * from Student', function (err, recordset) {
            if (err) console.log(err)
            // send records as a response
            var jsonPretty = JSON.stringify(recordset,null,2);
            var objectValue = JSON.parse(jsonPretty);
            console.log(objectValue['rowsAffected'][0]);

            for(var i = 0; i < objectValue['rowsAffected'][0]; i++){

                var string = JSON.stringify(objectValue['recordset'][i]);
                var objectValuethis = JSON.parse(string);
                if (i+1==objectValue['rowsAffected'][0]) {
                    response+="\""+objectValuethis['firstName']+" "+objectValuethis['lastName']+"\"";
                } else {
                    response+="\""+objectValuethis['firstName']+" "+objectValuethis['lastName']+"\""+",";
                }

            }
            response=response+"]}";
            //var str = JSON.stringify(recordset, null, 2);
            var responsePretty = JSON.stringify(response,null,2);
            var responseValue = JSON.parse(responsePretty);
            console.log(responseValue);
            res.render('index', {responseValue});
        });
    });
    //console.log(response)

});

module.exports = router;