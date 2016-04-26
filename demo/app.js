var express = require("express");
var bodyParser = require("body-parser");
var session = require('express-session');

var privateKey = '36fc3fe98530eea08dfc6ce76e3d24c4';
var publicKey = 'b46d1900d0a894591916ea94ea91bd2c';

var Geetest = require('../gt-sdk');
var data = require('./db');

var geetest = new Geetest(privateKey, publicKey);

var app = express();

app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '2mb'
}));
app.use(session({
    secret: 'naiewjafk',
    name: 'sid',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000 // 一周
    }
}));

// 静态文件
app.use(express.static('./'));
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/login.html");
});
app.get("/user", function (req, res) {
    if (!req.session.login) {
        return res.redirect('/');
    }
    res.sendFile(__dirname + '/user.html');
});

app.post('/comment', function (req, res) {
    res.send();
    geetest.collect({
        action: 'comment'
    }, function (err) {
        if (err) {
            console.log(err);
        }
    })
});

app.post('/buy', function (req, res) {
    res.send();
    geetest.collect({
        action: 'buy'
    }, function (err) {
        if (err) {
            console.log(err);
        }
    })
});

// 极验接口
app.get("/geetest/register", function (req, res) {

    // 向极验申请一次验证所需的challenge
    geetest.register({
        action: 'login'
    }, function (err, data) {
        if (err) {
            res.send(JSON.stringify({
                gt: publicKey,
                success: 0
            }));
        } else {
            res.send(JSON.stringify({
                gt: publicKey,
                challenge: data,
                success: 1
            }));
        }
    });
});

app.post("/login", function (req, res) {

    var body = req.body;

    console.log(body);

    if (!body.username || data[body.username] !== body.password) {
        return res.send('<h1 style="text-align: center">用户名或密码错误，请重新登陆。</h1>');
    }

    // 对form表单的结果进行验证
    geetest.validate({

        challenge: body.geetest_challenge,
        validate: body.geetest_validate,
        seccode: body.geetest_seccode,
        user_id: body.username,
        action: 'login'

    }, function (err, result) {
        if (err || !result) {
            res.send("<h1 style='text-align: center'>登陆失败</h1>");
        } else {
            req.session.username = body.username;
            req.session.login = true;
            res.redirect('/user');
        }
    });
});

var port = 8080;
var server = app.listen(port, function () {
    console.log('listening at http://localhost:' + port)
});
