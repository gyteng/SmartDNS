var PORT = 53;
var HOST = '0.0.0.0';
//var DNS = ['202.96.128.86', '114.114.114.114', '8.8.8.8', '208.67.222.222'];
var DNS = [
    {ip:'202.96.128.86', port:53, type:'UDP'},
    {ip:'114.114.114.114', port:53, type:'UDP'},
    {ip:'8.8.8.8', port:53, type:'UDP'},
    {ip:'208.67.222.222', port:53, type:'TCP'}
];
var dgram = require('dgram');
var bu = require('./BufferUtils');
var packet = require('native-dns-packet');
var config = require('./config.json');
var server = dgram.createSocket('udp4');
var net = require('net');
var fakeIpList = config.fakeIpList;
var async = require('async');
var now = new Date();

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
//            console.log(getDomain(data));
//            var log = getDomain(data) + '\n';
//            var ip = getIpAddress(data);
//            for(i in ip) {
//                log += ip[i] + '\n'
//            }
//            log += '-------------------------------------------';
//            console.log(log);
        });
    });
});

function getDomain(buffer) {
    var question = packet.parse(buffer).question;
    var domain = question[0].name
//    console.log('Domain: ' + domain);
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
    var dataCallback;
    async.detect(DNS, function (item, callback) {
        if(item.type == 'UDP') {
            queryDNSwithUDP(message, item.ip, item.port, function (data) {
                dataCallback = data;
                callback(data);
            });
        } else if (item.type == 'TCP') {
            queryDNSwithTCP(message, item.ip, item.port, function (data) {
                dataCallback = data;
                callback(data);
            });
        }
    }, function (results) {
        console.log(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
        console.log('From ' + results.ip + ' ' + results.type);
        console.log(getDomain(dataCallback) + ' ->');
        console.log(getIpAddress(dataCallback));
        console.log('-------------------------------------------');
        cb(dataCallback);
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
                client.on("error", function (err) {

                });
//                setTimeout(function () {
//                    try {
//                        client.close();
//                        callback(null, null);
//                    } catch (err) {
//
//                    }
//                }, 2000);
            }
        }, function (err, results) {
            cb(results.receive);
        }
    );
}

function queryDNSwithTCP(message, address, port, cb) {
    var client = new net.Socket();
    var messageTcp = new Buffer(message.length + 2);
    messageTcp[0] = message.length / 256;
    messageTcp[1] = message.length % 256;
    message.copy(messageTcp, 2, 0, messageTcp.length);
    client.connect(port, address, function() {
        client.write(messageTcp);
    });
    client.on('data', function (dataTcp) {
        var length = parseInt(dataTcp[1].toString(10) + dataTcp[0].toString(10) * 256);
        var data = new Buffer(length);
        dataTcp.copy(data, 0, 2, length + 2);
        cb(data);
//        setTimeout(function () {
//            try {
//                cb(null);
//            } catch (err) {
//
//            }
//        }, 2000);
    });
    client.on('error', function (err) {

    });
}

function queryDNSwithProxy(message) {
}