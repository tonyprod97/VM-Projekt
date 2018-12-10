var express = require('express');
var router = express.Router();

router.use('/week',require('./week'));

module.exports = router;