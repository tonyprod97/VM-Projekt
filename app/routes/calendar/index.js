var express = require('express');
var router = express.Router();

router.use('/week',require('./week'));
router.use('/teachers',require('./teachers'));

router.get('/', (req, res) => {
    if (req.session.user == undefined) {
        res.redirect('../user/login');
        return;
    }

    res.render('./calendar/index');
});

module.exports = router;