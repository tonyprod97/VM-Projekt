var clientId = '678c5f43-0181-48da-a411-3e4ae5ded2e5';
var clientSecret = 'tfcPCM76^ejyaCYXP106@--';
var redirectUri = 'http://localhost:3000/authorize';

var scopes = [
    'openid',
    'profile',
    'offline_access',
    'https://outlook.office.com/calendars.readwrite'
];

var credentials = {

    client: {
        id: clientId,
        secret: clientSecret
    },

    auth: {
        tokenHost: 'https://login.microsoftonline.com/',
        authorizePath: '/common/oauth2/v2.0/authorize',
        tokenPath: '/common/oauth2/v2.0/token'
    }
}

var oauth2 = require('simple-oauth2').create(credentials);

module.exports = {
    getAuthUrl: function () {
        var returnVal = oauth2.authorizationCode.authorizeURL({
            redirect_uri: redirectUri,
            scope: scopes.join(' ')
        });
        console.log('');
        console.log('Generated auth url: ' + returnVal);
        return returnVal;
    },

    getTokenFromCode: async function (auth_code, callback, request, response) {
        try {
            const result = await oauth2.authorizationCode.getToken({
                code: auth_code,
                redirect_uri: redirectUri,
                scope: scopes.join(' ')
            });

            const accessToken = oauth2.accessToken.create(result);
            console.log('');
            console.log('Token created: ', accessToken.token);
            callback(request, response, null, accessToken);
        } catch (error) {
            console.log('Access token error: ', error.message);
            callback(request, response, error, null);
        }
    },

    getEmailFromIdToken: function(id_token) {
        // JWT is in three parts, separated by a '.'
        var token_parts = id_token.split('.');

        // Token content is in the second part, in urlsafe base64
        var encoded_token = new Buffer.from(token_parts[1].replace('-', '+').replace('_', '/'), 'base64');

        var decoded_token = encoded_token.toString();

        var jwt = JSON.parse(decoded_token);

        // Email is in the preferred_username field
        return jwt.preferred_username
    },

    getTokenFromRefreshToken: async function(refresh_token, callback, request, response) {
        var token = oauth2.accessToken.create({ refresh_token: refresh_token, expires_in: 0 });
        try {
            token = await token.refresh();

            console.log('New token: ', token.token);
            callback(request, response, null, token);
        } catch (error) {
            console.log('Refresh token error: ', error.message);
            callback(request, response, error, null);
        }
    }
};
