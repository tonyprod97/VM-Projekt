var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    if (req.session.user == undefined) {
        res.redirect('../../user/login');
        return;
    }

    res.render('./calendar/week');
});

module.exports = router;