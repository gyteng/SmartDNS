var PORT = 53;
var HOST = '0.0.0.0';
var DNS = '8.8.8.8';
var dgram = require('dgram');
var bu = require('./BufferUtils');
var server = dgram.createSocket('udp4');
var client = dgram.createSocket('udp4');
var fakeIpList = [
    '59.24.3.173',
    '37.61.54.158'];


server.on('listening', function () {
    var address = server.address();
    console.log('-------------------------------------------');
    console.log('DNS Server listening on ' + address.address + ":" + address.port);
    console.log('-------------------------------------------');
});

server.on('message', function (messageReq, remoteReq) {
    console.log('Receive: ' + remoteReq.address + ':' + remoteReq.port);
    console.log('Length: ' + messageReq.length);
    bu.printBuffer(messageReq);
    getDomain(messageReq);

    var client = dgram.createSocket('udp4');
    client.send(messageReq, 0, messageReq.length, 53, DNS, function(err, bytes) {
        if (err) throw err;
        console.log('Message send to ' + DNS + ':' + 53);
        console.log('-------------------------------------------');

        client.on("message", function (messageRes, remoteRes) {
            console.log('Receive: ' + remoteRes.address + ':' + remoteRes.port);
            console.log('Length: ' + messageRes.length);
            bu.printBuffer(messageRes);
            var fakeIp = getFakeIp(messageRes);

            if(isFakeIp(fakeIp, fakeIpList)) {
                console.log('Fake ip');
                // Do nothing;
                console.log('-------------------------------------------');
            } else {
                server.send(messageRes, 0, messageRes.length, remoteReq.port, remoteReq.address, function (err, bytes) {
                    if (err) throw err;
                    console.log('Message send to ' + remoteReq.address + ':' + remoteReq.port);
                    console.log('-------------------------------------------');
                });
            }
        });
        //client.close();
    });

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

function getFakeIp(buffer) {
    offset = buffer.length - 4;
    var ipAddress = '';
    ipAddress += buffer[offset] + '.' + buffer[offset+1] + '.' + buffer[offset+2] + '.' + buffer[offset+3];
    console.log('ip: ' + ipAddress);
    return ipAddress;
}

function isFakeIp(ip, list) {
    var rtn = false;
    for(var l in list) {
        if(ip == list[l]) {
            return true;
        }
    }
    return false;
}
/*
function getRealIp(buffer) {

    var ipAddress = '';
    var offset = 12;
    while(buffer[offset] != 0) {
        offset += (buffer[offset] + 1);
    }
    offset += 17;
    while(offset < buffer.length) {
        ipAddress = '';
        ipAddress += buffer[offset] + '.' + buffer[offset+1] + '.' + buffer[offset+2] + '.' + buffer[offset+3];
        console.log(ipAddress);
        offset += 16;
    }
}
*/

server.bind(PORT, HOST);

