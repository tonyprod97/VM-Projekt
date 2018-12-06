module.exports.port = 3000;

module.exports.databaseErrors = {

    OPERATION_SUCCESS : 0, // all good
    OPERATION_FAILED  : 1, // failed to execute
    OPERATION_WARRNING: 2, // operation succeded but might couse problems
    OPERATION_DENIED  : 3  // operation might be dangoruse so it was blocked
};

module.exports.databaseGetRequests = {
    USER: 1 // request userData
};

module.exports.databaseSendRequests = {

    CREATE_NEW_USER: 1,  // create new user  (needs in data fild: username,userEmail,password) 
    LOGIN_REQUEST: 2,    // login user (needs in data fild: username or email, password)
    TERMINATE_SESSION: 3 // logout user from session (needs ins data fild: userid, token)
};