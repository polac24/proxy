const express = require("express");
const app = express();
const port = process.env.PORT || 3011;
const axios = require('axios');
const xml = require('xml');
var format = require('xml-formatter');
var onHeaders = require('on-headers')

app.get(['/','/developer'], async (req, res, next) => {
    try {
        res.set('Content-Type', 'text/xml');
        const status = await buildResponse('Apple Developer', 'https://developer.apple.com/system-status/data/system_status_en_US.js', 'https://developer.apple.com/system-status/')
        res.send('<?xml version="1.0" encoding="UTF-8"?>' + status)
    } catch (error) {
        // Passes errors into the error handler
        return next(error)
    }
})

app.get(['/system'], async (req, res, next) => {
    try {
        res.set('Content-Type', 'text/xml');
        const status = await buildResponse('Apple System', 'https://www.apple.com/support/systemstatus/data/system_status_en_US.js', 'https://www.apple.com/support/systemstatus/')
        res.send('<?xml version="1.0" encoding="UTF-8"?>' + status)
    } catch (error) {
        // Passes errors into the error handler
        return next(error)
    }
})

app.get(['/health'], async (req, res) => {
    scrubETag(res)
    res.status(200).json({"status": "OK"})
})

function scrubETag(res) {
    onHeaders(res, function () {
      this.removeHeader('ETag')
    })
  }

function buildItem(event, name, link) {
    const guid = event.messageId
    const message = event.message
    const affected = event.usersAffected;
    const type = event.statusType;
    const status = event.eventStatus;
    const lastMessageDate = findLastMessageDate(event)
    return [
        { title: { _cdata: '"' + name + '" '+type+' issue is ' + status } },
        { pubDate: lastMessageDate.toUTCString() },
        { link: link },
        { guid: [{_attr : { isPermaLink: 'false'}}, guid ]},
        { description: { _cdata: 'Service "'+name+'" '+type+' changed status to "'+status+'". \nProblem description: ' + message+ ' ' + affected } }
    ]
}

function appendDate(value, array) {
    if (value) {
        array.push(new Date(value))
    }
}

function findLastMessageDate(event) {
    var dates = []
    // datePosted is published too often
    // const posted = appendDate(event.datePosted, dates)
    const start = appendDate(event.startDate, dates)
    const end = appendDate(event.endDate, dates)

    if (!dates.length) {
        // It should never happen as there should be at least startDate
        return new Date()
    }
    return dates.sort()[0]
}

async function buildResponse(name, url, human_link) {
    var appleResponse = await axios.get(url)
    var content = appleResponse.data
    var apple_obj = content

    // Delete the option JS wrapper in the response
    if (typeof(content) != 'object') {
        var contentJson = content.replace('jsonCallback(', '').replace(');','')
        apple_obj = JSON.parse(contentJson)
    }
    items = []
    itemsDates = []

    for (const service of apple_obj.services) {
        for (const event of service.events) {
            items.push(buildItem(event, service.serviceName, human_link))
            itemsDates.push(findLastMessageDate(event))
        }
    }

    if (!itemsDates.length) {
        // If no items, we need to fallback to something
        itemsDates.push(new Date())
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
                    { title: name + ' Status RSS' },
                    { link: human_link },
                    { description: 'Statuses of '+name },
                    { language: 'en-us' },
                    { pubDate: (itemsDates.sort()[0]).toUTCString()},
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
        const text = await buildResponse('Apple Developer', 'https://www.apple.com/support/systemstatus/data/developer/system_status_en_US.js', 'https://developer.apple.com/system-status/')
        console.log(format(text))
    })();
} else {
    console.log("Render start...")
}

