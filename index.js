const config = require('./config.json')

const domain = config.domain;
const port = config.port;
const openWebBrowser = config.openWebBrowser; // Set to false if running as a server

// Doesn't matter what Google account holds these keys.
const apiKey = config.apiKey; // Webmaster api key, must be gotten from Google photosphere api
const clientId = config.clientId // Client ID from Google API page
const clientSecret = config.clientSecret // Client Secret from Google API page

// Part 1: Open web browser to login to Google account and receive access token
const open = require('open');
if (openWebBrowser) {
    (async () => {
        await open(`http://${domain}:${port}/`);
    })();
}

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
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html')
})
app.get('/upload', function (req, res) {
    res.sendFile(__dirname + '/views/upload.html')
})
app.post('/upload', function (req, res) {
    let key = req.cookies["oauth"]
    if (!key) {
        return res.redirect('/')
    } else {
        if (!req.files) {
            return res.status(400).send("Missing file!")
        } else {
            // Part 1: Get uploadUrl
            const options = {
                'method': 'POST',
                'url': `https://streetviewpublish.googleapis.com/v1/photo:startUpload?key=${apiKey}`,
                'headers': {
                    'Authorization': `Bearer ${key}`
                }
                // For authorization token, must use oauth 2.0
            };
            request(options, function (error, response) {
                if (error) {
                    console.log(error) && res.status(500).send("Error with getting upload url");
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
                            console.log(error) && res.status(500).send("Error with uploading file to uploadUrl");
                        } else {
                            //PART 3: Set metadata!
                            let body;
                            if (req.body["lat"] && req.body["long"]) {
                                body = JSON.stringify({
                                    "uploadReference": {
                                        "uploadUrl": uploadUrl
                                    },
                                    "pose": {
                                        "latLngPair": {
                                            "latitude": req.body["lat"],
                                            "longitude": req.body["long"]
                                        },
                                        "heading": 0
                                    }
                                })
                            } else {
                                body = JSON.stringify({
                                    "uploadReference": {
                                        "uploadUrl": uploadUrl
                                    },
                                })
                            }

                            const options = {
                                'method': 'POST',
                                'url': `https://streetviewpublish.googleapis.com/v1/photo?key=${apiKey}`,
                                'headers': {
                                    'Authorization': `Bearer ${key}`,
                                    'Content-Type': 'application/json'
                                },
                                body: body
                            };
                            request(options, function (error, response) {
                                if (error) {
                                    console.log(error) && res.status(500).send("Error with setting metadata of file");
                                } else {
                                    if (JSON.parse(response.body)["error"]) {
                                        res.status(JSON.parse(response.body)["error"]["code"]).send(`Status: ${JSON.parse(response.body)["error"]["status"]}<br>Error message: ${JSON.parse(response.body)["error"]["message"]}</a><br>Try adding the latitude and longitude coordinates.<br><a href="/upload">Upload another?</a>`)
                                    } else {
                                        res.status(200).send(`Status: ${JSON.parse(response.body)["mapsPublishStatus"]}<br>Link: <a href="${JSON.parse(response.body)["shareLink"]}">${JSON.parse(response.body)["shareLink"]}</a><br>You may have to wait awhile after uploading for Google to process the image.<br><a href="/upload">Upload another?</a>`)
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
        'url': `https://www.googleapis.com/oauth2/v4/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${req.query["code"]}&redirect_uri=http://${domain}:${port}/auth/&scope=https://www.googleapis.com/auth/streetviewpublish`,
        'headers': {}
    };
    request(options, function (error, response) {
        if (error) console.log(error) && res.send("Error: Check console");
        res.cookie('oauth', JSON.parse(response.body)["access_token"], {
            maxAge: JSON.parse(response.body)["expires_in"] * 1000,
            httpOnly: true
        });
        res.sendFile(__dirname + '/views/upload.html')
    });

})

app.listen(port)
