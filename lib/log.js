var log4js = require('log4js');
log4js.configure({
    appenders: [
        {
            type: 'console',
            category: "console"
        }
    ],
    replaceConsole: true,   //替换console.log
    levels:{
        dateFileLog: 'INFO'
    }
});

var dateFileLog = log4js.getLogger('dateFileLog');

exports.logger = dateFileLog;

exports.use = function(app) {
    app.use(log4js.connectLogger(dateFileLog, {level:'debug', format:':method :url'}));
}