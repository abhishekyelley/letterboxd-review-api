const cheerio = require('cheerio')

const urlPattern = /^https:\/\/letterboxd\.com\/([a-zA-Z0-9_-]+)\/film\/([a-zA-Z0-9_-]+)\/?(\d*)\/?$/

function matchURL(data) {
    return new Promise((resolve, reject) => {
        const url = data.url
        const match = url.match(urlPattern);
        if(match){
            resolve(data)
        }
        else{
            reject({
                message: "Bad URL! Couln't match the url in script tag",
                response: {status: 400}
            })
        }
    })
}

function getOpenCloseBraces(scriptTagText){
    var openBrace = -1
    var closeBrace = -1
    for(var i=0; i<scriptTagText.length; i++){
        if(scriptTagText[i] == '{'){
            openBrace = i
            break
        }
    }
    for(var i=scriptTagText.length-1; i>=0; i--){
        if(scriptTagText[i] == '}'){
            closeBrace = i
            break
        }
    }
    return new Promise( (resolve, reject) => {
        if(openBrace != -1 && closeBrace != -1)
            resolve({scriptTagText, openBrace, closeBrace})
        else
            reject({
                message: "Bad URL! Couldn't JSON in script tag",
                response: {status: 400}
            })
    })
}

// scrape page and check the script tag
function getScrapedData(response){
    return new Promise((resolve, reject) => {
        const $ = cheerio.load(response.data)
        const scriptTagText = $('script[type="application/ld+json"]').text()
        const film_year_scrape = $('.film-title-wrapper > small').text()
        if(scriptTagText){
            resolve({scriptTagText, film_year_scrape})
        }
        else{
            reject({
                message: "Bad URL! Couldn't find the script tag",
                response: {status: 400}
            })
        }
    })
}

function getJson(scriptTagText, openBrace, closeBrace){
    return new Promise((resolve, reject) => {
        const data = JSON.parse(scriptTagText.slice(openBrace, closeBrace+1))
        if(data){
            // data.film_year = $('.film-title-wrapper > small').text()
            resolve(data)
        }
        else{
            reject({
                message: "Bad URL! Couldn't make JSON",
                response: {status: 400}
            })
        }
        
    })
}

module.exports = { matchURL, getOpenCloseBraces, getScrapedData, getJson }