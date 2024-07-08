const express = require("express");
const app = express();
const port = process.env.PORT || 3011;
const axios = require('axios');
const xml = require('xml');
var format = require('xml-formatter');
var onHeaders = require('on-headers')
var request = require('request');



// Custom CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

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
            // console.log(url)
            headers = req.headers
            delete headers['host']
            // delete headers['host']
            delete headers['content-length']
            // console.log(headers)
            // console.log(req.rawBody)
            try {
                const response = await axios.post(url, req.rawBody, {
                    headers: headers
                })
                res.send(response.data)
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

app.get(['/get'], async (req, res, next) => {
    try {
        res.set('Content-Type', 'text/plain');
        url = req.query.url
        headers = req.headers
        delete headers['host']
        delete headers['content-length']
        const response = await axios.get(url, { headers: headers, responseType: type})
        res.send(response.data)
    } catch (error) {
        // Passes errors into the error handler
        return next(error)
    }
});
app.get(['/simple_get'], async (req, res, next) => {
    try {
        url = req.query.url
        type = req.query.type || 'text/plain';
        res.set('Content-Type', type);
        const response = await axios.get(url)
        res.send(response.data)
    } catch (error) {
        // Passes errors into the error handler
        return next(error)
    }
});
/*
app.get(['*'], async (req, res, next) => {
    try {
        res.set('Content-Type', 'text/html');
        query = req.query
        // req.path
        ref = req.headers.referrer || req.headers.referer
        console.log(req.path)
        console.log("Referrer:"+ ref)
        console.log("query.url: "+query.url)
        url = query.url
        // use https on production
        const sendindScheme = process.env.RENDER != 'true' ? "https" : "https"
        const sendingHost = req.headers.host
        headers = req.headers
        const preamble = sendindScheme+"://"+sendingHost
        delete headers['host']
        delete headers['content-length']
        if (!req.path.endsWith('.ts')) {
            headers['Accept-Encoding'] = ''
        }

        if (req.path.endsWith('.ts')) {
            console.log("patching1...")
            url = 'https://kamery-szczawnica.poxi.pl/stream/promenada/'+req.path
        }else if (!url && !!ref && ref.startsWith(preamble)) {
            console.log("patching2...")
            url = ref +"/"+ req.path
        }
        console.log("Final URL: "+url)
        console.log("preamble: "+preamble)
        // req.rawBody = '';
            console.log(url)
            try {
                type = null
                if (req.path.endsWith('.ts')) {
                    type = 'arraybuffer'
                }
                const response = await axios.get(url, { headers: headers, responseType: type})
                console.log(typeof(response.data))
                response.headers['Access-Control-Allow-Origin'] = '*'
                console.log(response.headers)
                // res.set(response.headers)
                console.log(response.data.length +" vs "+ response.headers['content-length'])
                if (!req.path.endsWith('.ts')) {
                    console.log("sending:"+response.data.replace("=\"./", "=\""+preamble+'/proxy?url=https://kamery-szczawnica.poxi.pl/'+"/"))
                    res.send(response.data.replace("=\"./", "=\""+preamble+'/proxy?url=https://kamery-szczawnica.poxi.pl/'+"/"))
                } else {
                    res.send(response.data)
                }
            } catch (error) {
                // Passes errors into the error handler
                console.log(error)
                return next(error)
            }
    } catch (error) {
        // Passes errors into the error handler
        console.log(error)
        return next(error)
    }
})
*/




app.listen(port, () => console.log(`Example app listening on port ${port}!`));

if (process.env.RENDER != 'true') {
    (async () => {
        // const res = await axios.get('https://kamery-szczawnica.poxi.pl/kamera.php?kam=14', { headers: { 'Accept-Encoding': '' }});
        // console.log(res.data.replace("=\"./", "=\""+'https://localhost:3011/proxy/'+"/"))
        // const response = await axios.get('https://kamery-szczawnica.poxi.pl/kamera.php\?kam\=14' , { 'decompress': true })
        // // console.log(response.data)
        // zlib.gunzip(response.data, function (_err, output) {
        //     console.log(output)
        //     console.log(output.toString())
        //   })
        // Make a probe request on local env
        // url = 'https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetCalendarPicker?f.sid=-3480986134142297956&bl=boq_travel-frontend-ui_20221213.00_p2&hl=en&soc-app=162&soc-platform=1&soc-device=1&_reqid=3238195&rt=c'
        // const response = await axios.post(url)
        // console.log(format(text))
    })();
} else {
    console.log("Render start...")
}
