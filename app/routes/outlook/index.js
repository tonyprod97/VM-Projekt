var express = require('express');
var router = express.Router();

router.use('/calendarData',require('./calendarData'));

module.exports = router;