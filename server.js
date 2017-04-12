var express = require('express')
var path = require('path')
var DB = require('./db/DB')
var utils = require('./db/utils')

var app = express()
app.set('port', process.env.PORT || 3000)
app.use(express.static(__dirname + '/public'))

DB.connect()
    // Only connect once the db connection has been established 
    .then(db => {
        app.listen(app.get('port'), function () {
            console.log('The app is listening on port ' + app.get('port'))
    })
    .catch(err => {
        throw err
    })
})


/**********************************************************
 * ROUTES
 **********************************************************/
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'))
})

app.get('/new/*', function (req, res) {
    var originalUrl = req.url.slice(5) // remove the first 5 caracters ('/new/') from the url
    var shortUrlBase = req.protocol + '://' + req.get('host')
    var newShortUrlSuffix
    
    if (isValidUrl(originalUrl)) {
        // Get the shortUrlSuffix: 1) if already in the db, from the db; 2) if new, db.count() + 1
        utils.getShortUrlSuffix(originalUrl)
            .then(shortUrlSuffix => {
                newShortUrlSuffix = shortUrlSuffix.toString()
                // Save to db:
                utils.saveUrl({
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
                res.json({ error: 'Error while trying to create/read record \'' + originalUrl + '\'. Error: ' + err })
                throw err
            })
    } else {
        res.json({ error: originalUrl + ' is not valid. Use http(s)://www.abc.xyz format' })
    }
})

app.get('/all', function (req, res) {
    utils.getUrl({})
        .then(list => {
            res.json(list)
        })
        .catch(err => {
            res.send(err)
            throw err
        })
})

app.get('/count', function (req, res) {
        DB.count()
        .then(result => {
            res.json({ count: result })
        })
        .catch(err => {
            res.send(err)
            throw err
        })
})


app.get('/:id', function (req, res) {
    var id =  req.params.id
    var originalUrl
    
    utils.getUrl({ shortUrlSuffix : id })
        .then(result => {
            if (result.length > 0) {
                originalUrl = result[0].originalUrl
                res.redirect(originalUrl)
            } else {
                res.json({ error: id + ' does not correspond to any stored originalUrl'})
            }
        })
        .catch(err => {
            res.send(err)
            throw err
        })
})


//*********************************************************

/**
 * Simplified version of the check of the url pattern
 *   --> for a more precise solution, check this: 
 *       http://stackoverflow.com/questions/7109143/what-characters-are-valid-in-a-url)
 */
function isValidUrl (url) {
    var validWebsiteRegexp = new RegExp(/^http(s)?:\/\/www\..+\..+/)
    
    return url.match(validWebsiteRegexp)
}


