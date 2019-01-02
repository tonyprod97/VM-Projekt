var express = require('express');
var router = express.Router();

router.use('/week',require('./week'));
router.use('/community',require('./community'));

router.get('/',(req,res)=>res.render('./calendar/index', { loggedIn:true}));

module.exports = router;