var express = require('express');
var router = express.Router();

router.get('/', (req,res)=>res.render('./user/register'));
router.post('/',(req,res) => {
    console.log('Register post works!')
});

module.exports = router;