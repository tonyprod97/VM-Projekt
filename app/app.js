const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const routes = require('./routes/index');
    
//configuring server
const port = require('./constants').port;
const app = express();

const databaseManager = require('./DatabaseManager');

//configuring view engine
app.engine('hbs',hbs({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname,'views','layouts'),
  partialsDir: path.join(__dirname,'views','partials')
}));

app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'hbs');

//serving static files - shortcuts
app.use('/css',express.static(path.join(__dirname,'styles')));
app.use('/bootstrap',express.static(path.join(__dirname,'../node_modules/bootstrap/dist')));
app.use('/controllers', express.static(path.join(__dirname,'controllers')));

//configuring routes
app.use('/', routes);

//starting server
app.listen(port, () => console.log(`App is listening on port ${port}!`));