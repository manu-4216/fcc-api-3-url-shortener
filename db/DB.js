/**************************************************************************
 * Low level utilities for managing the DB (connect, close, update, find)
 *    db schema: (_id, originalUrl, shortUrlSuffix)
 **************************************************************************/

var DB = function () {
    var mongo = require('mongodb').MongoClient
    var DB_NAME = 'urlshort'
    var COLLECTION_NAME = 'urls'
    var DB_URL_LOCAL = 'mongodb://' + process.env.IP + ':27017/' + DB_NAME
    var DB_URL = process.env.DB_URL || DB_URL_LOCAL  // process.env.DB_URL is used to store the private url to mLab db
    var myDB
    var myCollection
    
    console.log('dburl', DB_URL)
    
    var connect = function () {
        return new Promise((resolve, reject) => {
            //Reuse an open db connection.
            if (myDB) {
                console.log('DB already open. Return the old one.')
                resolve(myDB)
            }
            
            var options = {
                keepAlive: 1,
                connectTimeoutMS: 30000
            }
            

            mongo.connect(DB_URL, options,  function (err, db) {
                if (err) {
                    console.log('- rejected connect')
                    reject(err)
                } else {
                    // Store DB and Collection
                    console.log('- resolved connect')
                    myDB = db
                    myCollection = db.collection(COLLECTION_NAME)
                    resolve(db)
                }
            })
        })
    }
    
    var close = function () {
        console.log('DB: closing')
        if (myDB) {
            myDB.close()
        }
    }
    
    var update = function (item) {
        return myCollection.update(
                { originalUrl: item.originalUrl }, // query by originalUrl, to make sure it's unique
                item, 
                { upsert: true }, // creates a new entry if does not exist
                function (err) {
                    if (err) throw err
            })
    }
    
    var find = function (item) {
        return myCollection.find(item).toArray()
    }
    
    var count = function () {
        return myCollection.find().count()
    }
    
    
    return {
        connect: connect,
        close: close,
        update: update,
        find: find,
        count: count
    }
}()

module.exports = DB