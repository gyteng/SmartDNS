var PORT = 53;
var HOST = '0.0.0.0';
//var DNS = ['202.96.128.86', '114.114.114.114', '8.8.8.8', '208.67.222.222'];
var DNS = [{ip:'202.96.128.86', port:53},
    {ip:'114.114.114.114', port:53},
    {ip:'8.8.8.8', port:53},
    {ip:'208.67.222.222', port:53}];
var dgram = require('dgram');
var bu = require('./BufferUtils');
var packet = require('native-dns-packet');
var config = require('./config');
var server = dgram.createSocket('udp4');
//var client = dgram.createSocket('udp4');
var fakeIpList = config.fakeIpList;
var async = require('async');

server.bind(PORT, HOST);
server.on('listening', function () {
    var address = server.address();
    console.log('-------------------------------------------');
    console.log('DNS Server listening on ' + address.address + ":" + address.port);
    console.log('-------------------------------------------');
});



server.on('message', function (message, remote) {
    queryDNSs(message, function(data){
        server.send(data, 0, data.length, remote.port, remote.address, function (err, bytes) {

        });
    });
});
/*

function async_auto(message, address, port) {
    async.auto({
            receiveMessage: function (callback, results) {
                var client = dgram.createSocket('udp4');
                callback(null, message, address, port, client);

            },
            sendToDNS: ['receiveMessage', function (callback, results) {
                var message = results['receiveMessage'][0];
                var client = results['receiveMessage'][3];
                client.send(message, 0, message.length, 53, DNS[1], function (err, bytes) {
                    callback(null);
                });
            }],
            receiveFromDNS: ['sendToDNS', function (callback, results) {
                var client = results['receiveMessage'][3];
                client.on("message", function (message, remote) {
                    if (isFakeIp(getIpAddress(message), fakeIpList)) {
                        console.log('fakeIp');
                    } else {
                        client.close();
                        callback(null, message);
                    }
                });
            }],
            sendMessage: ['receiveFromDNS', function (callback, results) {
                var message = results['receiveFromDNS'];
                var port = results['receiveMessage'][2];
                var address = results['receiveMessage'][1];
                server.send(message, 0, message.length, port, address, function (err, bytes) {
                    callback(null);
                });

            }]
        }, function (err, results) {
            //console.log('err = ', err);
            //onsole.log('results = ', results);
        }
    );
}
*/


/*
server.on('message', function (messageReq, remoteReq) {

    console.log('Receive: ' + remoteReq.address + ':' + remoteReq.port);
    console.log('Length: ' + messageReq.length);
//    bu.printBuffer(messageReq);
    console.log('id:' + packet.parse(messageReq).header.id);
    getDomain(messageReq);
    var resLog = '';
    for(var i in DNS) {
        (function(i) {
            var client = dgram.createSocket('udp4');
            client.send(messageReq, 0, messageReq.length, 53, DNS[i], function (err, bytes) {
                if (err) throw err;
                console.log('Message send to ' + DNS[i] + ':' + 53);
                console.log('-------------------------------------------');
                client.on("message", function (messageRes, remoteRes) {
                    console.log('Receive: ' + remoteRes.address + ':' + remoteRes.port);
                    console.log('Length: ' + messageRes.length);
//                    bu.printBuffer(messageRes);
                    var ip = getIpAddress(messageRes);
                    if (isFakeIp(ip, fakeIpList)) {
                        console.log('Fake ip');
                        console.log('-------------------------------------------');
                    } else {
                        server.send(messageRes, 0, messageRes.length, remoteReq.port, remoteReq.address, function (err, bytes) {
                            if (err) throw err;
                            console.log('Message send to ' + remoteReq.address + ':' + remoteReq.port);
                            console.log('-------------------------------------------');
                        });
                    }
                });
            });
        })(i);
    }
});
*/


function getDomain(buffer) {
    var question = packet.parse(buffer).question;
    var domain = question[0].name
    console.log('Domain: ' + domain);
    return domain;
}

function isFakeIp(ip, list) {
    if(ip.length == 0) {
        return true;
    }
    for(var i in list) {
        if(ip[0] == list[i]) {
            return true;
        }
    }
    return false;
}

function getIpAddress(buffer) {
    var ipList  = [];
    var answer = packet.parse(buffer).answer;
    for (i in answer) {
        ipList.push(answer[i].address);
    }
    return ipList;
}


function queryDNSs(message, cb) {
    async.map(DNS, function (item, callback) {
        queryDNSwithUDP(message, item.ip, item.port, function (data) {
            return callback(null, data);
        });
    }, function (err, results) {
        console.log(results);
        for (i in results) {
            if (results[i]) {
                cb(results[i]);
            }
        }
    });
}

function queryDNSwithUDP(message, address, port, cb) {
    var client = dgram.createSocket('udp4');
    async.series({
            send: function (callback) {
                client.send(message, 0, message.length, port, address, function (err, bytes) {
                });
                callback(null);
            },
            receive: function (callback) {
                client.on("message", function (message, remote) {
                    if(!isFakeIp(getIpAddress(message), fakeIpList)) {
                        client.close();
                        callback(null, message);
                    }
                });
                setTimeout(function () {
                    try {
                        callback(null, null);
                    } catch (err) {

                    }
                }, 5000);
            }
        }, function (err, results) {
            cb(results.receive);
        }
    );
}

function queryDNSwithTCP(message) {
}

function queryDNSwithProxy(message) {
}