require('dotenv').config()
const axios = require('axios')
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

function addImages(response){
    const API_KEY = process.env.TMDB_API_KEY
    return new Promise((resolve, reject) => {
        axios({
            method: 'GET',
            headers: {
                accept: 'application/json'
            },
            url: response.filmURL
        })
        .then((res) => {
            const $ = cheerio.load(res.data)
            const retBody = $('body')
            const content_type = retBody.attr('data-tmdb-type')
            const content_id = retBody.attr('data-tmdb-id')
            return new Promise((iresolve, ireject) => {
                if(content_type && content_id){
                    iresolve({content_id, content_type})
                }
                else{
                    var lbx_image = $('#backdrop').attr('data-backdrop2x')
                    if(!lbx_image)
                        lbx_image = $('#backdrop').attr('data-backdrop')
                    const images = []
                    if(lbx_image)
                        images.push(lbx_image)
                    response.images = images
                    resolve(response)
                    // ireject({
                    //     message: "Couldn't find content id and/or type for TMDB",
                    //     response: {status: 400},
                    // })
                }
            })
        })
        .then(({content_id, content_type}) => {
            return axios({
                method: 'GET',
                headers: {
                    accept: 'application/json'
                },
                url: `https://api.themoviedb.org/3/${content_type}/${content_id}/images?api_key=${API_KEY}`
            })
        })
        .then((res) => {
            res = res.data
            const IMAGES_BASE_URL = 'https://image.tmdb.org/t/p/original'
            const images = []
            if(res.backdrops.length > 0){
                res.backdrops.forEach((item) => {
                    images.push(IMAGES_BASE_URL+item.file_path)
                })
            }
            else if(res.posters.length > 0){
                res.posters.forEach((item) => {
                    images.push(IMAGES_BASE_URL+item.file_path)
                })
            }
            response.images = images
            resolve(response)
        })
        .catch((error) => {
            reject({
                error: true,
                message: error.message || "Error occured",
                status: error.response ? error.response.status || 404 : 404
            })
        })
    })
}

module.exports = { matchURL, getOpenCloseBraces, getScrapedData, getJson, addImages }