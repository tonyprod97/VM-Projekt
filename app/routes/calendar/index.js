var express = require('express');
var router = express.Router();

router.use('/week',require('./week'));
router.get('/',(req,res)=>res.render('./calendar/index'));

module.exports = router;