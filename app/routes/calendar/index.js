var express = require('express');
var router = express.Router();
var permit = require('../user/permission');

router.use('/week', require('./week'));
router.use('/teachers', require('./teachers'));
router.get('/', permit, (req, res) => res.render('./calendar/week', { loggedIn: true }));


module.exports = router;