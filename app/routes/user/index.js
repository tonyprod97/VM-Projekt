var express = require('express');
var router = express.Router();

const authHelper = require('../../OutlookManager');

router.use('/register',require('./register'));
router.use('/login',require('./login'));
router.use('/logout',require('./logout'));

router.get('/outlookLogin', function (req, res) {
    res.redirect(authHelper.getAuthUrl());
});

module.exports = router;