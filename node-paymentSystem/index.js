var config = require('./config/config');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const port = config.localport;

var routes = require('./routes');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});