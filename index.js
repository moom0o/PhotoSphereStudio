const config = require('./config.json')

const host = config.host;
const port = config.port;
const openWebBrowser = config.openWebBrowser; // Set to false if running as a server

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('published.db');
db.run("CREATE TABLE IF NOT EXISTS points (url TEXT, lat LONG, long LONG, UNIQUE(url))");
// Prevent corruption
db.run('PRAGMA synchronous=FULL')
db.run('PRAGMA count_changes=OFF')
db.run('PRAGMA journal_mode=DELETE')
db.run('PRAGMA temp_store=DEFAULT')

let full_url = "";
let protocol = "";
if (config.https) {
    protocol = "https://"
} else {
    protocol = "http://"
}

if (port && !config.https) {
    full_url = protocol + host + ":" + port
} else {
    full_url = protocol + host
}


console.log("Server running on: " + full_url);

// Doesn't matter what Google account holds these keys.
const clientId = config.clientId // Client ID from Google API page
const clientSecret = config.clientSecret // Client Secret from Google API page

// Part 1: Open web browser to login to Google account and receive access token
const open = require('open');
if (openWebBrowser) {
    (async () => {
        await open(full_url);
    })();
}

const favicon = require('serve-favicon');
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const upload = require("express-fileupload");
const request = require("request");
const app = express()
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(
    upload({
        preserveExtension: true,
        safeFileNames: true,
        limits: {fileSize: 75 * 1024 * 1024},
    })
);
// CSS and JS Files
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/assets/icons/favicon.ico'));

app.get('/', function (req, res) {
    res.render('pages/index', {
        full_url: full_url,
        clientId: clientId,
        domain: config.host
    });
})

app.get('/upload', function (req, res) {
    res.render('pages/upload');
})

app.get(`/donate`, function (req, res) {
    res.render('pages/donate');
})

app.get(`/privacy`, function (req, res) {
    res.render('pages/privacy');
})

app.post('/upload', function (req, res) {

    let latitude = req.body["lat"];
    let longitude = req.body["long"];
    let heading = req.body["head"];
    let placespot = req.body["place"];
    let publish = req.body["publish"]

    let key = req.cookies["oauth"]
    if (!key) {
        return res.redirect('/')
    } else {
        if (!req.files) {
            return res.status(400).render('pages/error', {
                errorCode: 400,
                errorStatus: "Missing File",
                errorMessage: "Missing File",
                response: "Error: Missing File"
            })

        } else {
            // Part 1: Get uploadUrl
            const options = {
                'method': 'POST',
                'url': `https://streetviewpublish.googleapis.com/v1/photo:startUpload`,
                'headers': {
                    'Authorization': `Bearer ${key}`
                }
                // For authorization token, must use oauth 2.0
            };
            request(options, function (error, response) {
                if (error) {
                    console.log(error)
                    res.status(500).render('pages/error', {
                        errorCode: 500,
                        errorStatus: "ERROR",
                        errorMessage: "Error: Error with getting upload url",
                        response: JSON.stringify(JSON.parse(response.body), null, 4)
                    })
                } else {
                    let uploadUrl = JSON.parse(response.body)["uploadUrl"]
                    // PART 2: Upload the image!
                    const options = {
                        'method': 'POST',
                        'url': uploadUrl,
                        'headers': {
                            'Authorization': `Bearer ${key}`,
                        },
                        body: req.files.file.data
                    };
                    request(options, function (error) {
                        if (error) {
                            console.log(error)

                            res.status(500).render('pages/error', {
                                errorCode: 500,
                                errorStatus: "UPLOAD ERROR",
                                errorMessage: "Error: Error with uploading file to Google's API",
                                response: error
                            })

                        } else {
                            //PART 3: Set metadata!
                            let body;
                            if (req.body["lat"] && req.body["long"]) {
                                if(placespot && placespot.length > 0){
                                    body = JSON.stringify({
                                        "uploadReference": {
                                            "uploadUrl": uploadUrl
                                        },
                                        "pose": {
                                            "latLngPair": {
                                                "latitude": latitude,
                                                "longitude": longitude
                                            },
                                            "heading": heading
                                        },
                                        "places": {
                                            "placeId": placespot
                                        }
                                    })
                                } else {
                                    body = JSON.stringify({
                                        "uploadReference": {
                                            "uploadUrl": uploadUrl
                                        },
                                        "pose": {
                                            "latLngPair": {
                                                "latitude": latitude,
                                                "longitude": longitude
                                            },
                                            "heading": heading
                                        }
                                    })
                                }

                            } else {
                                body = JSON.stringify({
                                    "uploadReference": {
                                        "uploadUrl": uploadUrl
                                    },
                                })
                            }

                            const options = {
                                'method': 'POST',
                                'url': `https://streetviewpublish.googleapis.com/v1/photo`,
                                'headers': {
                                    'Authorization': `Bearer ${key}`,
                                    'Content-Type': 'application/json'
                                },
                                body: body
                            };
                            request(options, function (error, response) {
                                if (error) {
                                    console.log(error)

                                    res.status(500).render('pages/error', {
                                        errorCode: 500,
                                        errorStatus: "ERROR",
                                        errorMessage: "Error with setting metadata of file",
                                        response: "Error: Error with setting metadata of file"
                                    })

                                } else {
                                    if (JSON.parse(response.body)["error"]) {
                                        res.status(500).render('pages/error', {
                                            errorCode: JSON.parse(response.body)["error"]["code"],
                                            errorStatus: JSON.parse(response.body)["error"]["status"],
                                            errorMessage: JSON.parse(response.body)["error"]["message"],
                                            response: JSON.stringify(JSON.parse(response.body), null, 4),
                                        });
                                    } else {
                                        let shareLink = JSON.parse(response.body)["shareLink"]
                                        if(publish){
                                            write(shareLink, latitude, longitude)
                                        }
                                        res.status(200).render('pages/success', {
                                            status: JSON.parse(response.body)["mapsPublishStatus"],
                                            shareLink: shareLink,
                                            response: JSON.stringify(JSON.parse(response.body), null, 4)
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    }
})
// We contact Google to get a temporary token that only has permission to upload PhotoSpheres.
app.get('/auth', function (req, res) {
    const request = require('request');
    const options = {
        'method': 'POST',
        'url': `https://www.googleapis.com/oauth2/v4/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${req.query["code"]}&redirect_uri=${full_url}/auth/&scope=https://www.googleapis.com/auth/streetviewpublish`,
        'headers': {}
    };
    request(options, function (error, response) {
        if (error) console.log(error) && res.send("Error: Check console");
        let body = JSON.parse(response.body)
        if (body["error"] || !body["access_token"]) {
            res.redirect('/')
        } else {
            res.cookie('oauth', JSON.parse(response.body)["access_token"], {
                maxAge: JSON.parse(response.body)["expires_in"] * 1000,
                httpOnly: true
            });
            res.render('pages/upload')
        }
    });

})

app.get('/list', function (req,res){
    read(function (data) {
        res.send(data);
    });

})
function write(url, lat, long) {
    if (url && url !== "undefined") {
        db.serialize(function () {
            let stmt = db.prepare(`INSERT OR IGNORE INTO points (url, lat, long) VALUES (?,?,?)`);
            stmt.run(url, lat, long);
            stmt.finalize();
        });
    }
}

function read(callback) {
    db.all(`SELECT * FROM points;`, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            callback(data)
        }
    })
}
app.listen(port)
