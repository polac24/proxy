const express = require("express");
const app = express();
const port = process.env.PORT || 3011;
const axios = require('axios');
const xml = require('xml');
var format = require('xml-formatter');

app.get(['/','/developer'], async (req, res) => {
    res.set('Content-Type', 'text/xml');
    const status = await buildResponse()
    res.send('<?xml version="1.0" encoding="UTF-8"?>' + status)
})

function buildItem(event, name) {
    const posted = new Date(event.datePosted)
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)

    const guid = event.messageId
    const message = event.message
    const affected = event.usersAffected;
    const type = event.statusType;
    const status = event.eventStatus;

    var lastMessageDate = [end, posted, start].sort()[0]
    // test: make the message always "triggerable"
    lastMessageDate = new Date()
    return [
        { title: { _cdata: '"' + name + '" '+type+' issue is ' + status } },
        { pubDate: lastMessageDate.toUTCString() },
        { link: 'https://developer.apple.com/system-status/' },
        { guid: guid },
        { description: { _cdata: 'Service "'+name+'" '+type+' changed status to "'+status+'". \nProblem description: ' + message+ ' ' + affected } }
    ]
}

async function buildResponse() {
    var appleResponse = await axios.get('https://www.apple.com/support/systemstatus/data/developer/system_status_en_US.js')
    content = appleResponse.data
    contentJson = content.replace('jsonCallback(', '').replace(');','')
    apple_obj = JSON.parse(contentJson)
    items = []

    for (const service of apple_obj.services) {
        for (const event of service.events) {
            items.push(buildItem(event, service.serviceName))
        }
    }

    rssObj = {
        rss: [
            {
                _attr: {
                    version: '2.0',
                    'xmlns:dc': 'http://purl.org/dc/elements/1.1/'
                }
            },
            {
                channel: [
                    { title: 'Apple Developer Status RSS' },
                    { link: 'https://developer.apple.com/system-status/' },
                    { description: 'Statuses of Apple Developer' },
                    { language: 'en-us' },
                    { pubDate: (new Date).toUTCString()},
                    ...items.map((item_array) => {
                        return {
                            item: item_array
                        }
                    })
                ]
            }
        ]
    };
    return xml(rssObj)
}


app.listen(port, () => console.log(`Example app listening on port ${port}!`));


if (process.env.RENDER != 'true') {
    (async () => {
        // Make a probe request on local env
        const text = await buildResponse();
        console.log(format(text))
    })();
}

