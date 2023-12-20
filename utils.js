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
            resolve({openBrace, closeBrace})
        else
            reject({
                message: "Bad URL! Couldn't JSON in script tag",
                response: {status: 400}
            })
    })
}

function getScriptTagText($){
    return new Promise((resolve, reject) => {
        const scriptTagText = $('script[type="application/ld+json"]').text()
        if(scriptTagText){
            resolve(scriptTagText)
        }
        else{
            reject({
                message: "Bad URL! Couldn't find the script tag",
                response: {status: 400}
            })
        }
    })
}

module.exports = { matchURL, getOpenCloseBraces, getScriptTagText }