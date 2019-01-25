
module.exports = {

    getUrlDataFromRequest: function (req) {

        return {
            protocol: req.protocol,
            host: req.get('host'),
            pathname: req.originalUrl,
            //port: req.app.settings.port
        };
    }
}