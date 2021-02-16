require('dotenv').config()
const sqlImport = require('sqlite3').verbose();
const sql = new sqlImport.Database(process.env.database);
const moment = require('moment');
const utils = require('../utils');

const dataTables = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// CREATE TABLE IF NOT EXISTS Airing (UserID TEXT, Title TEXT)
// INSERT OR IGNORE INTO Airing(UserID, Title) VALUES (?, ?)
// DELETE FROM AIRING WHERE lower(Title) = ? AND UserID = ?

let initializers = [
    `CREATE TABLE IF NOT EXISTS "Other" (
        "index"	INTEGER,
        "site"	TEXT,
        "guid"	TEXT,
        PRIMARY KEY("index")
    );`,
    `CREATE TABLE IF NOT EXISTS "Nyaa" (
        "title"	TEXT,
        "url"	TEXT,
        "date"	TEXT,
        "seeders"	INTEGER,
        "leechers"	INTEGER,
        "downloads"	INTEGER,
        "hash"	TEXT,
        "category"	TEXT,
        "size"	TEXT,
        "comments"	INTEGER,
        "trusted"	TEXT,
        "remake"	TEXT,
        "guid"	TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "All" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            "day"	TEXT,
            PRIMARY KEY("index")
        );`,
    `CREATE TABLE IF NOT EXISTS "Monday" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            PRIMARY KEY("index")
        );`,
    `CREATE TABLE IF NOT EXISTS "Tuesday" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            PRIMARY KEY("index")
        );`,
    `CREATE TABLE IF NOT EXISTS "Wednesday" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            PRIMARY KEY("index")
        );`,
    `CREATE TABLE IF NOT EXISTS "Thursday" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            PRIMARY KEY("index")
        );`,
    `CREATE TABLE IF NOT EXISTS"Friday" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            PRIMARY KEY("index")
        );`,
    `CREATE TABLE IF NOT EXISTS "Saturday" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            PRIMARY KEY("index")
        );`,
    `CREATE TABLE IF NOT EXISTS "Sunday" (
            "index"	INTEGER,
            "name"	TEXT,
            "time"	TEXT,
            PRIMARY KEY("index")
        );`
];

const database = {
    name: 'database',

    init: async () => {
        initializers.forEach((statement) => {
            sql.run(statement, (err, rows) => {
                if (err) {
                    console.error(`Error initializing table: ${err}`);
                }
            });
        })
    },

    refreshShows: async (shows) => {
        sql.serialize(() => {
            dataTables.forEach((table) => {
                sql.run(`DELETE FROM "${table}"`, (err, rows) => {
                    if (err) {
                        console.error(`Error deleting table data: ${err}`);
                    }
                });
            });

            sql.run('BEGIN TRANSACTION');

            for (var show of shows) {
                let name = show.showName,
                    time = show.releaseTime,
                    weekday = show.dayOfWeek;

                sql.run(`INSERT INTO ${weekday}(name, time) VALUES(?, ?)`, [name, time], (err, rows) => {
                    if (err) {
                        console.error(`Error refreshing shows: ${err}`);
                    }
                });

                sql.run(`INSERT INTO 'All' (name, time, day) VALUES(?, ?, ?)`, [name, time, weekday], (err, rows) => {
                    if (err) {
                        console.error(`Error inserting data: ${err}`);
                    }
                });
            }

            sql.run('COMMIT');

        });
    },

    checkForNewEpisodes: async () => {
        return new Promise((res, rej) => {
            sql.all(`SELECT * FROM 'All'`, async (err, rows) => {
                if (err) {
                    rej(`Error checking database for new episodes: ${err}`);
                } else {
                    let currentDay = await utils.getCurrentDay();
                    let currentTime = await utils.getCurrentTimeFormatted();
                    let allShows = rows.filter((show) => show.day === currentDay && show.time === currentTime);
                    if (allShows.length >= 1) {
                        res(allShows);
                    }
                }
            });
        });

    },

    sub: async (userId, show) => {
        // Maybe add a check to see if the show is airing? If it isn't, say that the show might not be airing
        return new Promise((res, rej) => {
            sql.run(`INSERT OR IGNORE INTO Airing(UserID, Title) VALUES (?, ?)`, [userId, utils.sqlEscape(show)], (err, rows) => {
                if (err) {
                    rej(`An error occured while subscribing to that show: ${err}`);
                }
            });
        });
    },

    // this doesn't work for some reason. pls fix
    listSubscriptions: async (userId) => {
        return new Promise((res, rej) => {
            sql.all(`SELECT * FROM Users WHERE UserID = ?`, [userId], (err, rows) => {
                res(rows);
            });
        });
    },

    unsub: async (userid, show) => {

    },

    listCurrent: async () => {

    },

    refreshNyaa: async (data) => {
        sql.serialize(() => {
            sql.run(`DELETE FROM "Nyaa"`, (err, rows) => {
                if (err) {
                    console.error(`Error deleting table data: ${err}`);
                }
            });

            sql.run('BEGIN TRANSACTION');

            data.forEach((item) => {
                let splitGuid = item.guid.$t.split('/');
                let guid = splitGuid[splitGuid.length - 1];

                sql.run(`INSERT INTO Nyaa(title, url, date, seeders, leechers, downloads, hash, category, size, comments, trusted, remake, guid) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    utils.sqlEscape(item.title),
                    utils.sqlEscape(item.guid.$t),
                    utils.sqlEscape(item.pubDate),
                    utils.sqlEscape(item['nyaa:seeders']),
                    utils.sqlEscape(item['nyaa:leechers']),
                    utils.sqlEscape(item['nyaa:downloads']),
                    utils.sqlEscape(item['nyaa:infoHash']),
                    utils.sqlEscape(item['nyaa:category']),
                    utils.sqlEscape(item['nyaa:size']),
                    utils.sqlEscape(item['nyaa:comments']),
                    utils.sqlEscape(item['nyaa:trusted']),
                    utils.sqlEscape(item['nyaa:remake']),
                    utils.sqlEscape(guid)
                ], (err, rows) => {
                    if (err) {
                        console.error(`Error refreshing shows: ${err}`);
                    }
                });
            });

            sql.run('COMMIT');
        });
    },

    getMostRecentNyaaGuidFromDatabase: async() => {
        return new Promise((res, rej) => {
            sql.all(`SELECT guid FROM 'Other' WHERE site = 'nyaa'`, (err, rows) => {
                if(err) {
                    res(`Failed to obtain guid from database: ${err}`);
                } else {
                    res(rows[0].guid);
                }
            })
        })
    },

    setMostRecentNyaaGuid: async(newGuid) => {
        return new Promise((res, rej) => {
            sql.run(`UPDATE Other SET guid = ? WHERE site = ?`, [newGuid, 'nyaa'], (err, rows) => {
                if(rows) {
                    rej(`An error occurred when updating Nyaa's guid database record: ${err}`);
                }
            })
        });
    },

    getNyaaShowById: async(id) => {
        return new Promise((res, rej) => {
            sql.all(`SELECT * FROM 'Nyaa' WHERE guid = ?`, [id], (err, rows) => {
                if(err) {
                    rej(`An error occurred when querying that nyaa guid: ${err}`);
                } else {
                    res(rows[0]);
                }
            });
        });
    },

    checkForNewNyaaLinks: async () => {
        return new Promise((res, rej) => {
            sql.all(`SELECT * FROM 'Nyaa'`, async (err, rows) => {
                if (err) {
                    rej(`Error checking database for new Nyaa links: ${err}`);
                } else {
                    // Replace this to see if current hh & mm from each row is equal to current time.
                    /*

                        TO DO:

                        Send notification and then store guid in 'other' table. Check for new episodes and store new data. If the newest item's guid is greater
                        than the last notified, then we have to determine how many items are in between that.
                        For example:

                        LastNotifiedGuid: 155055
                        NewItem: 155058

                        If we do this, then we only have to make the request every 5 minutes or so instead of every minute.

                        We need to search or datebase WHERE guid = each number inbetween and then send a notification. After that, we can store the guid of the newest item.

                    */


                    let mostRecentNotifiedGuid = await database.getMostRecentNyaaGuidFromDatabase();
                    let parsedGuid = parseInt(mostRecentNotifiedGuid);
                    let nyaaLinks = rows.filter((row) => row.guid > parsedGuid);
                    // console.log(nyaaLinks);
                    if(nyaaLinks.length >= 1) {
                        res(nyaaLinks);
                    }

                }
            });
        });

    }

}

module.exports = database;