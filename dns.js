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
var net = require('net');
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
            console.log(data);
            return callback(null, data);
        });
    }, function (err, results) {
        //console.log(results);
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

function queryDNSwithTCP(message, address, port, cb) {
    var client = new net.Socket();
    var messageTcp = new Buffer(message.length + 2);
    messageTcp[0] = 0x00;
    messageTcp[1] = message.length;
    message.copy(messageTcp, 2, 0, messageTcp.length);
    client.connect(port, address, function() {
        client.write(messageTcp);
    });
    client.on('data', function(dataTcp) {
        var length = parseInt(dataTcp[1].toString(10));
        var data = new Buffer(length);
        dataTcp.copy(data, 0, 2, length + 2);
        cb(data);
        client.destroy();
    });
}

function queryDNSwithProxy(message) {
}