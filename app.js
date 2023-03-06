const express = require("express");
const app = express();
const port = process.env.PORT || 3011;
const axios = require('axios');
const xml = require('xml');
var format = require('xml-formatter');
var onHeaders = require('on-headers')
var request = require('request');



app.post(['/proxy'], async (req, res, next) => {
    try {
        res.set('Content-Type', 'text/plain');
        url = req.query.url
        req.rawBody = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk) {
            req.rawBody += chunk;
        });
        req.on('end', async function() {
            console.log(url)
            headers = req.headers
            delete headers['host']
            // delete headers['host']
            delete headers['content-length']
            console.log(headers)
            console.log(req.rawBody)
            try {
                const response = await axios.post(url, req.rawBody, {
                    headers: headers
                })
                // console.log(response)
                res.send(response)
            } catch (error) {
                // Passes errors into the error handler
                return next(error)
            }
        });
    } catch (error) {
        // Passes errors into the error handler
        return next(error)
    }
})




app.listen(port, () => console.log(`Example app listening on port ${port}!`));

if (process.env.RENDER != 'true') {
    (async () => {
        // Make a probe request on local env
        // url = 'https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetCalendarPicker?f.sid=-3480986134142297956&bl=boq_travel-frontend-ui_20221213.00_p2&hl=en&soc-app=162&soc-platform=1&soc-device=1&_reqid=3238195&rt=c'
        // const response = await axios.post(url)
        // console.log(format(text))
    })();
} else {
    console.log("Render start...")
}
