var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', 
  { message:"Welcome to VM Projekt",
    condition: true, 
    loggedIn:true,
    students: [
    "Antonio Kamber",
    "Mateo Majnarić",
    "Filip Budiša",
    "Vedran Mornar",
    "Lara Lokin",
    "Kristijan Vrbanac",
    "Martin Sršen"
  ] });
});

module.exports = router;