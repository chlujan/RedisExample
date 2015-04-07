'use strict';

var app,
    port,
    client,
    base_url,
    body_parser,
    express, 
    redistogo,
    short;
 
express = require('express');
app = express();
body_parser = require('body-parser');
short = require('shortid');
port = process.env.PORT || 3000;
base_url = process.env.BASE_URL || 'http://localhost:3000';


/////////////// Setting up connection to Redis//////////////
if (process.env.REDISTOGO_URL) {
    redistogo  = require("url").parse(process.env.REDISTOGO_URL);
    client = require("redis").createClient(redistogo.port, redistogo.hostname);
    client.auth(redistogo.auth.split(":")[1]);
} else {
    client = require('redis').createClient();
}


app.set('views', __dirname + '/views');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.set('base_url', base_url);
app.use(body_parser.json());
app.use(body_parser.urlencoded({
    extended: true
}));



///////////////// Defining different routes////////////////
app.get('/', function (req, res) {
    res.render('index');
});

app.post('/', function (req, res) {
    var url, id;
    url = req.body.url;
    if(url == "undefined")
    {
       var id = req.body.short;
       console.log(id);
       client.get(id, function (err, reply) {
           res.render('result', { id: id, base_url: base_url });
       });
    }
    else {
    id = short.generate();

    //// Storing variables in Redis////
    client.set(id, url, function () {
        res.render('result', { id: id, base_url: base_url });
    });
    }

});

app.get('/:id', function (req, res) {
    var id = req.params.id.trim();
    
    /// Looking up the URL ///
    client.get(id, function (err, reply) {
	res.redirect(reply);
    });
});


app.use(express.static(__dirname + '/static'));
var server = app.listen(port);
var address = server.address();
console.log("Server is listening at http://localhost:" + address.port + "/");
