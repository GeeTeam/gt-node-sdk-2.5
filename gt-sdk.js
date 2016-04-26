"use strict";

var crypto = require('crypto'),
    querystring = require('querystring'),
    request = require('request'),
    pkg = require("./package.json");

var apiServer = 'http://api.geetest.com';

var md5 = function (str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

var makeURL = function (server, query) {
    return server + '?' + querystring.stringify(query);
};

function Geetest(key, id) {

    if (!key) {
        throw new Error('Private Key Required');
    }
    if (!id) {
        throw new Error("Public Key Required");
    }

    this.privateKey = key;

    this.publicKey = id;
}

Geetest.prototype.validate = function (config, callback) {

    var hash = this.privateKey + 'geetest' + config.challenge;

    if (config.validate === md5(hash)) {

        request.post(apiServer + '/validate.php', {
            form: {
                seccode: config.seccode
            }
        }, function (err, res, body) {

            if (err) {

                callback(err);

            } else {

                callback(null, body === md5(config.seccode));

            }
        });

    } else {

        callback(null, false);

    }
};

Geetest.prototype.register = function (data, callback) {

    data.gt = this.publicKey;
    data.sdk = 'Node_' + pkg.version;

    var self = this;
    var server = apiServer + '/register.php';

    console.log('register: ' + makeURL(server, data));
    request.get(makeURL(server, data), {timeout: 2000}, function (err, res, body) {

        if (err) {

            // failback
            callback(err);

        } else {

            callback(null, md5(body + self.privateKey));

        }
    });
};

Geetest.prototype.collect = function (data, callback) {

    data.gt = this.publicKey;
    var server = apiServer + '/collect.php';
    request.get(makeURL(server, data), {timeout: 2000}, function (err, res, body) {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

module.exports = Geetest;