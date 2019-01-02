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
    USER: 1,               // request developers
    VISIBLE_CALENDARS: 2,  // returns all users a current user has rights to see there calendar (needs in data field: userid, token)
    GET_VERIFICATION : 4,  // request verification details about user (needs in data field: email) returns (verified, userid *, token *) * -> if not verified 
    GET_ALL_USERS: 8,      // request all registrated users
    GET_VERIFIED_USERS: 16 // request all verified users
};

module.exports.databaseSendRequests = {

    CREATE_NEW_USER  : 1, // create new user  (needs in data field: username, email, password) 
    LOGIN_REQUEST    : 2, // login user (needs in data field: email, password)
    TERMINATE_SESSION: 3, // logout user from session (needs in data field: userid, token)
    SHARE_CALENDAR   : 4, // share calendar with other user (needs in data field: userid, token, with) with - email of a user you want to share calendar with
    VERIFY_USER      : 5  // verifie user (needs in data field: userid, verificationToken)
};