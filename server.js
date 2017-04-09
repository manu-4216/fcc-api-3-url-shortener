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
    var originalUrl = req.url.slice(5) // remove the first 5 caracters ('/new/') from the url
    var shortUrlSuffix = getShortUrlSuffix(originalUrl)
    var shortUrlBase = req.protocol + '://' + req.get('host')
    
    if (isValidUrl(originalUrl)) {
        res.json({
            originalUrl,
            shortUrl: shortUrlBase + '/' + shortUrlSuffix
        })
        // Save to db:
        saveUrl({ 
            originalUrl, 
            shortUrlSuffix 
        })
    } else {
        res.json({ error: originalUrl + ' is not valid. Use http(s)/www.abc.xyz format' })
    }
})

app.get('/:id', function (req, res) {
    var id =  req.params.id
    var originalUrl
    
    getOriginalUrl(id)
        .then(result => {
            if (result.length > 0) {
                originalUrl = result[0].originalUrl
                //res.send(originalUrl)
                res.redirect(originalUrl)
            } else {
                res.json({ error: id + ' does not correspond to any stored originalUrl'})
            }
            DButils.close()
        })
        .catch(err => {
            throw err
        })
})

app.get('/all', function (req, res) {
    //DButils.connect
    
})


//*********************************************************/
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

function getShortUrlSuffix (url) {
    return '124'
}


/**
 * Take a item, and put it in the DB
 */
function saveUrl (item) {
    DButils.connect()
        .then(db => {
            DButils.update(item)
        })
        .then(result => {
            DButils.close()
        })
        .catch(err => {
            throw err
        })
}

/**
 * Use the short url, and extract the original url
 */
function getOriginalUrl (shortUrlSuffix) {
    
    return new Promise((resolve, reject) => {
        DButils.connect()
        .then(db => {
            resolve(DButils.find({ shortUrlSuffix }))
        })
        .catch(err => {
            reject(err)
        })
    })
}
