import dotenv from 'dotenv'
import axios from 'axios'
import fetch from 'node-fetch'
import { load } from 'cheerio'
const urlPattern = /^https:\/\/letterboxd\.com\/([a-zA-Z0-9_-]+)\/film\/([a-zA-Z0-9_-]+)\/?(\d*)\/?$/

dotenv.config()
function handleError(msg, st){
    return {
        message: msg,
        response: {status: st}
    }
}

function matchURL(data) {
    return new Promise((resolve, reject) => {
        const url = data.url
        const match = url.match(urlPattern);
        if(match){
            resolve(data)
        }
        else{
            reject(handleError("Bad URL! Couln't match the url in script tag", 400))
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
            reject(handleError("Bad URL! Couldn't JSON in script tag", 400))
    })
}

// scrape page and check the script tag
function getScrapedData(response){
    return new Promise((resolve, reject) => {
        const status = response.status
        response.text()
        .then(response => {
            const $ = load(response)
            const scriptTagText = $('script[type="application/ld+json"]').text()
            const film_year_scrape = $('.film-title-wrapper > small').text()
            if(scriptTagText){
                resolve({scriptTagText, film_year_scrape})
            }
            else{
                if(status === 200)
                    reject(handleError("Bad URL! Couldn't find the script tag", 400))
                else
                    reject(handleError("File not found", 404))
            }
        })
        .catch((error) => {
            reject(handleError(error.message || "Couldn't convert resource to html", 520))
        })
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
            reject(handleError("Bad URL! Couldn't make JSON", 400))
        }
        
    })
}

function addImages(response){
    const API_KEY = process.env.TMDB_API_KEY
    return new Promise((resolve, reject) => {
        getWebsite(response.filmURL, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        })
        .then((res) => res.text())
        .then((res) => {
            const $ = load(res)
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
            return getWebsite(`https://api.themoviedb.org/3/${content_type}/${content_id}/images?api_key=${API_KEY}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                })
        })
        .then((res) => res.json())
        .then((res) => {
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

function getWebsite(req_url, obj){
    if(obj)
        return fetch(req_url, obj)
    return fetch(req_url)
}

function isImage(res){
    return new Promise((resolve, reject) => {
        if(res.headers.get('content-type') === 'image/jpeg'){
            resolve(res)
        }
        else if(res.headers.get('content-type').startsWith('image/')){
            reject({
                error: true,
                message: "Not a jpeg image",
                status: 415,
                url: res.url
            })
        }
        else if(res.status === 200){
            reject({
                error: true,
                message: "Not an image",
                status: 404,
                url: res.url
            })
        }
        else{
            reject({
                error: true,
                message: "File not found",
                status: 404,
                url: res.url
            })
        }
    })
}

export { matchURL, getOpenCloseBraces, getScrapedData, getJson, addImages, getWebsite, isImage }