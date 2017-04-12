var utils = function () {
    var DB = require('../db/DB')
    
    
    /**
     * Gets the short URL prefix: 
     *   if new URL, generate it: count + 1. If existing in the DB, return it
     */
   function getShortUrlSuffix (originalUrl) {
    return new Promise((resolve, reject) => {
        DB.connect()
        .then(db => {
            // Get the stored originalUrl, if it exists
            return getUrl({ originalUrl })
        })
        .then(results => {
            if (results.length > 0) {
                resolve(results[0].shortUrlSuffix)
            } else {
                // If no result, the item will be added at the end, so get db.count()
                DB.count()
                    .then(count => {
                        resolve(parseInt(count) + 1)
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
        })
        .catch(err => {
            reject(err)
        })
    })
}

/**
 * Take an item, and put it in the DB
 */
function saveUrl (item) {
    return DB.connect()
        .then(db => {
            DB.update(item)
        })
}

/**
 * Use the short url, and extract the original url
 */
function getUrl (query) {
    return new Promise((resolve, reject) => {
        DB.connect()
        .then(db => {
            resolve(DB.find(query))
        })
        .catch(err => {
            reject(err)
        })
    })
}


return {
    getShortUrlSuffix: getShortUrlSuffix,
    saveUrl: saveUrl,
    getUrl: getUrl
}
}()

module.exports = utils