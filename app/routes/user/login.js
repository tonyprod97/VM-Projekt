var express = require('express');
var router = express.Router();

router.get('/', (req,res)=>res.render('./user/login'));
router.post('/',(req,res) => {
    console.log('Login post works!')
});

module.exports = router;