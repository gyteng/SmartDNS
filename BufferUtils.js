exports.printBuffer = function (buffer) {
    var print = '';
    var length = buffer.length;
    var buffer0 = '';
    var buffer1 = '';
    for(var i = 0; i < length; i++) {
        buffer0 += (buffer[i] < 16 ? '0' : '');
        buffer0 += buffer[i].toString(16) + ' ';
        buffer1 += ((buffer[i] >= 41 && buffer[i] <= 176) ? String.fromCharCode(buffer[i]) : ' ');
        if((i % 10 === 9) || (i === (length - 1))) {
            for(var j = 0; j < (9 - (i % 10)); j++) {
                buffer0 += '   ';
            }
            //print += buffer0 + '   ' + buffer1 + '\n';
            console.log(buffer0 + '   ' + buffer1);
            buffer0 = '';
            buffer1 = '';
        }
    }
    return print;
}
