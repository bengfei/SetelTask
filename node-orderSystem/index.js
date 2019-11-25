var config = require('./config/config');

const express = require('express');
const app = express();
const port = config.localport;

var routes = require('./routes');

app.use(routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});