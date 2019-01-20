/**
 * @file U ovoj datoteci se izlazu kao moduli numericka varijabla "port", objekt "databaseErrors",
 * objekt "databaseGetRequest" te objekt "databaseSendRequests" 
 */
module.exports.port = 3000;

module.exports.databaseErrors = {

    OPERATION_SUCCESS : 0, // all good
    OPERATION_FAILED  : 1, // failed to execute
    OPERATION_WARRNING: 2, // operation succeded but might couse problems
    OPERATION_DENIED  : 3  // operation might be dangoruse so it was blocked
};

module.exports.databaseGetRequests = {

    USER              : 1,  // request developers
    VISIBLE_CALENDARS : 2,  // returns all users a current user has rights to see there calendar (needs in data field: userid, token)
    GET_VERIFICATION  : 4,  // request verification details about user (needs in data field: email) returns (verified, userid *, token *) * -> if not verified 
    GET_ALL_USERS     : 8,  // request all registrated teachers
    GET_VERIFIED_USERS: 16, // request all verified teachers
    GET_CALENDAR      : 32, // request calendar of user needs(in data field: userid, token , from*) * -> email of user you want calendar off, if not specified then return calendar
    GET_ID_FROM_MAIL  : 64
};

module.exports.databaseSendRequests = {

    CREATE_NEW_USER     : 1, // create new user  (needs in data field: username, email, password, isStudent*) 
    LOGIN_REQUEST       : 2, // login user (needs in data field: email, password)
    TERMINATE_SESSION   : 3, // logout user from session (needs in data field: userid, token)
    SHARE_CALENDAR      : 4, // share calendar with other user (needs in data field: userid, token, with) with - email of a user you want to share calendar with
    VERIFY_USER         : 5, // verifie user (needs in data field: userid, verificationToken)
    INSERT_CALENDAR_DATA: 6, // insert calendar data (needs in data field: userid, token, calendarInfo[] : {subject, startDate, endDate});
    SEND_MEETING_REQUEST: 7, // send Meeting Request (needs in data field: toEmail, userid, token, startDate);
    SEND_MEETING_ANSWER: 8,  // send answer to meeting request (needs in data field: token,accept);
    DELETE_AVAILABLE: 9
};