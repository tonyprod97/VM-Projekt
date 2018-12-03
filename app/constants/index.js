module.exports.port = 3000;

module.exports.databaseErrors = {

    OPERATION_SUCCESS : 0, // all good
    OPERATION_FAILED  : 1, // failed to execute
    OPERATION_WARRNING: 2, // operation succeded but might couse problems
    OPERATION_DENIED  : 3  // operation might be dangoruse so it was blocked
};

module.exports.databaseGetRequests = {
    USER: 1 // request userData version 
    
};

module.exports.databaseSendRequests = {
    CREATE_NEW_USER: 1, // create new user  (needs: username,userEmail,password) 
    LOGIN_REQUEST: 2    // login user (needs: username or email, password)
};