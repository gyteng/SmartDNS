var PORT = 53;
var HOST = '0.0.0.0';
var DNS = ['202.96.128.86', '114.114.114.114', '8.8.8.8'];
var dgram = require('dgram');
var bu = require('./BufferUtils');
var config = require('./config');
var logger = require('./LogUtils');
var server = dgram.createSocket('udp4');
var client = dgram.createSocket('udp4');
var fakeIpList = config.fakeIpList;

server.on('listening', function () {
    var address = server.address();
    logger = logger.bufferInit();
    logger.log('-------------------------------------------');
    logger.log('DNS Server listening on ' + address.address + ":" + address.port);
    logger.log('-------------------------------------------');
    logger.print();
//    console.log('-------------------------------------------');
//    console.log('DNS Server listening on ' + address.address + ":" + address.port);
//    console.log('-------------------------------------------');
});


server.on('message', function (messageReq, remoteReq) {
    console.log('Receive: ' + remoteReq.address + ':' + remoteReq.port);
    console.log('Length: ' + messageReq.length);
    bu.printBuffer(messageReq);
    getDomain(messageReq);

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
                    bu.printBuffer(messageRes);
                    //var fakeIp = getFakeIp(messageRes);
                    var ip = getIp(messageRes);
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


function getDomain(buffer) {
    var domain = '';
    var offset = 12;
    while(buffer[offset] != 0) {
        for(var i = (offset + 1); i <= (offset + buffer[offset]); i++) {
            domain += String.fromCharCode(buffer[i]);
        }
        domain += '.';
        offset += (buffer[offset] + 1);
    }
    domain = domain.substring(0, domain.length - 1);
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

function getIp(buffer) {
    var ipList = [];
    var ipAddress = '';
    var offset = 12;
    while(buffer[offset] != 0) {
        offset += (buffer[offset] + 1);
    }
    if(offset + 5 >= buffer.length) {
        return ipList;
    }
    if(buffer[offset + 5] != 192) {
        offset += 5;
        while(buffer[offset] != 0) {
            offset += (buffer[offset] + 1);
        }
        offset -= 6;
    }
    offset += 17;
    while(offset < buffer.length) {
        ipAddress = '';
        ipAddress += buffer[offset] + '.' + buffer[offset+1] + '.' + buffer[offset+2] + '.' + buffer[offset+3];
        ipList.push(ipAddress);
        offset += 16;
    }
    console.log(ipList);
    return ipList;
}

server.bind(PORT, HOST);

