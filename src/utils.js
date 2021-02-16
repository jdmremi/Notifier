const moment = require('moment'),
      momentTz = require('moment-timezone');

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortenedDaysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

module.exports = {
    getCurrentTimeFormatted: async() => {
        let current = new Date();
        return moment(current, 'HH:mm:ss').format('HH:mm');
    },

    getCurrentDay: async() => {
        return daysOfWeek[new Date().getDay()];
    },

    compareNyaaTimestamp: async (localTime, nyaaTime) => {
        let serverTime = momentTz.tz(nyaaTime, 'America/Los_Angeles').format('HH:mm');
        return (localTime === serverTime) ? true : false;
    },

    formatNyaaTimestamp: (nyaaTime) => {
        return momentTz.tz(nyaaTime, 'America/Los_Angeles').format('ddd, DD MMM YYYY HH:mm');
    },

    formatLocalTimeAsNyaaTimestamp: async () => {
        return moment(new Date().getTime()).format('ddd, DD MMM YYYY HH:mm');
    },

    formatLocal: () => {
        return moment(new Date().getTime()).format('ddd, DD MMM YYYY HH:mm');
    },

    sqlEscape: (str) => {
        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\" + char;
                default:
                    return char;
            }
        });
    }

}