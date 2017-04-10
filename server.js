var express = require('express')
var path = require('path')
var DButils = require('./db/DButils')

var app = express()
app.set('port', process.env.PORT || 5000)
app.use(express.static(__dirname + '/public'))


/**********************************************************
 * ROUTES
 **********************************************************/
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'))
})

app.get('/new/*', function (req, res) {
    console.log('ROUTE: new/...')
    var originalUrl = req.url.slice(5) // remove the first 5 caracters ('/new/') from the url
    var shortUrlBase = req.protocol + '://' + req.get('host')
    var newShortUrlSuffix
    
    if (isValidUrl(originalUrl)) {
        // Get the shortUrlSuffix: 1) if already in the db, from the db; 2) if new, db.count() + 1
        getShortUrlSuffix(originalUrl)
            .then(shortUrlSuffix => {
                console.log('shortUrlSuffix', shortUrlSuffix)
                newShortUrlSuffix = shortUrlSuffix.toString()
                // Save to db:
                saveUrl({
                    originalUrl, 
                    shortUrlSuffix: newShortUrlSuffix
                })
            })
            .then(() => {
                res.json({
                    originalUrl,
                    shortUrl: shortUrlBase + '/' + newShortUrlSuffix
                })
            })
            .catch(err => {
                // throw err
                res.json({ error: 'Error while trying to create/read record \'' + originalUrl + '\'. Error: ' + err })
            })
    } else {
        res.json({ error: originalUrl + ' is not valid. Use http(s)/www.abc.xyz format' })
    }
})

app.get('/all', function (req, res) {
    console.log('ROUTE: /all')
    getUrl({})
        .then(list => {
            res.json(list)
        })
        .catch(err => {
            throw err
        })
})

app.get('/count', function (req, res) {
    console.log('ROUTE: COUNT')
    DButils.connect()
        .then(db => {
            return DButils.count()
        })
        .then(result => {
            res.json({ count: result })
        })
        .catch(err => {
            throw err
        })
})


app.get('/:id', function (req, res) {
    console.log('ROUTE: :ID')
    var id =  req.params.id
    var originalUrl
    
    getUrl({ shortUrlSuffix : id })
        .then(result => {
            if (result.length > 0) {
                originalUrl = result[0].originalUrl
                //res.send(originalUrl)
                res.redirect(originalUrl)
            } else {
                res.json({ error: id + ' does not correspond to any stored originalUrl'})
            }
        })
        .catch(err => {
            throw err
        })
})


//*********************************************************
app.listen(app.get('port'), function () {
  console.log('The app is listening on port ' + app.get('port'))
})


/**
 * Simplified version of the check of the url pattern
 *   --> for a more precise solution, check this: 
 *       http://stackoverflow.com/questions/7109143/what-characters-are-valid-in-a-url)
 */
function isValidUrl (url) {
    var validWebsiteRegexp = new RegExp(/^http(s)?:\/\/www\..+\..+/)
    
    return url.match(validWebsiteRegexp)
}

// returns Promise
function getShortUrlSuffix (originalUrl) {
    console.log('GET URL SUFFIX')
    return new Promise((resolve, reject) => {
        DButils.connect()
        .then(db => {
            // Get the stored originalUrl, if it exists
            return getUrl({ originalUrl })
        })
        .then(results => {
            if (results.length > 0) {
                console.log("found, length = ", results.length)
                resolve(results[0].shortUrlSuffix)
            } else {
                console.log('no result')
                // If no result, the item will be added at the end, so get db.count()
                DButils.count()
                    .then(count => {
                        console.log('count', count)
                        resolve(parseInt(count) + 1)
                    })
            }
        })
        .catch(err => {
            console.log('rejected getShortUrlSuffix', err)
            reject(err)
        })
    })
}


/**
 * Take an item, and put it in the DB
 */
function saveUrl (item) {
    console.log('SAVE URL')
    return DButils.connect()
        .then(db => {
            DButils.update(item)
        })
}

/**
 * Use the short url, and extract the original url
 */
function getUrl (query) {
    console.log('GET URL')
    return new Promise((resolve, reject) => {
        DButils.connect()
        .then(db => {
            resolve(DButils.find(query))
        })
        .catch(err => {
            reject(err)
        })
    })
}
