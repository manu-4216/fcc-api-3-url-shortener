/**************************************************************
 * Utilities for managing the DB (connect, close, update, find)
 *    db schema: (_id, originalUrl, shortUrlPrefix)
 **************************************************************/

var DButils = function () {
    var mongo = require('mongodb').MongoClient
    var DB_URL = 'mongodb://' + process.env.IP + ':27017/urlshort' 
    var COLLECTION_NAME = 'urls'
    var myDB
    var myCollection
    
    var connect = function () {
        return new Promise((resolve, reject) => {
            /* Reuse an open db connection.
            if (myDB) {
                console.log('DB already open. Return the old one.')
                resolve(myDB)
            }
            */
            mongo.connect(DB_URL, function (err, db) {
                if (err) {
                    reject(err)
                } else {
                    // Store DB and Collection
                    myDB = db
                    myCollection = db.collection(COLLECTION_NAME)
                    resolve(db)
                }
            })
        })
    } // end connect
    
    var close = function () {
        myDB.close()
    }
    
    var update = function (item) {
        myCollection.update(
                { originalUrl: item.originalUrl }, 
                item, 
                { upsert: true },
                function (err) {
                    if (err) throw err
                
                    myDB.close()
                    // myDB = null
            })
    }
    var find = function (item) {
        return myCollection.find(item).toArray();
    }
    
    return {
        connect: connect,
        close: close,
        update: update,
        find: find
    }
}()

module.exports = DButils;