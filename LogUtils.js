var logBuffer;

exports.bufferInit = function() {
    logBuffer = '';
    return this;
}

exports.log = function(message) {
    logBuffer += (message + '\n');
}

exports.print = function() {
    console.log(logBuffer);
}