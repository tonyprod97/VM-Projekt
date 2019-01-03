var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

router.use('/week',require('./week'));
router.use('/community',require('./community'));

router.get('/', permit, (req,res)=>res.render('./calendar/index', { loggedIn:true}));

module.exports = router;