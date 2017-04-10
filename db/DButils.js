/**************************************************************************
 * Low level utilities for managing the DB (connect, close, update, find)
 *    db schema: (_id, originalUrl, shortUrlSuffix)
 **************************************************************************/

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
                    console.log('- rejected connect')
                    reject(err)
                } else {
                    // Store DB and Collection
                    myDB = db
                    myCollection = db.collection(COLLECTION_NAME)
                    resolve(db)
                }
            })
        })
    }
    
    var close = function () {
        myDB.close()
    }
    
    var update = function (item) {
        return myCollection.update(
                { originalUrl: item.originalUrl }, // query by originalUrl, to make sure it's unique
                item, 
                { upsert: true }, // creates a new entry if does not exist
                function (err) {
                    if (err) throw err
                
                    myDB.close()
                    // myDB = null
            })
    }
    
    var find = function (item) {
        return new Promise((resolve, reject) => {
            myCollection.find(item).toArray()
                .then(result => {
                    myDB.close()
                    resolve(result)
                })
                .catch(err => reject(err))
        })
    }
    
    var count = function () {
        // Use custom promise, to be able to close the DB here, before resolving the native count() promise
        return new Promise((resolve, reject) => {
            myCollection.find().count()
                .then(count => {
                    myDB.close()
                    resolve(count)
                })
                .catch(err => reject(err))
        })
    }
    
    
    return {
        connect: connect,
        close: close,
        update: update,
        find: find,
        count: count
    }
}()

module.exports = DButils;