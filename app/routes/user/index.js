var express = require('express');
var router = express.Router();

router.use('/register',require('./register'));
router.use('/login',require('./login'));

module.exports = router;