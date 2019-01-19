var express = require('express');
var router = express.Router();
var permit = require('./permission');

const authHelper = require('../../OutlookManager');

router.use('/register',require('./register'));
router.use('/login',require('./login'));
router.use('/logout', require('./logout'));
router.use('/verify', require('./verify'));
router.use('/meeting', require('./meeting'));

router.get('/outlookLogin', permit, function (req, res) {
    res.redirect(authHelper.getAuthUrl());
});

module.exports = router;