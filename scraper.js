const axios = require('axios')
const { matchURL, getOpenCloseBraces, getScrapedData, getJson } = require('./utils')

var film_year

function getData(url){
    return new Promise((resolve, reject) => {
        axios.get(url)
        .then((response) =>
            getScrapedData(response)
        )
        .then(({ scriptTagText, film_year_scrape })=> {
            film_year = film_year_scrape
            return getOpenCloseBraces(scriptTagText)
        })
        .then(({ scriptTagText, openBrace, closeBrace }) => 
            getJson(scriptTagText, openBrace, closeBrace)
        )
        .then((data) => 
            matchURL(data)
        )
        .then((data) => 
            resolve(data)
        )
        .catch((error) => {
            console.error('Error fetching data:', error.message)
            reject({
                error: true,
                message: error.message || "Error occured",
                status: error.response ? error.response.status || 404 : 404,
                url: error.url || url
            })
        })
    })
}

function getDetailedData(uid, fid, vid){
    return new Promise((resolve, reject) => {
        getData(uid, fid, vid)
        .then((response) => {
            resolve(response)
        })
        .catch((error) => {
            reject(error)
        })
    })
}

function getSmallData(url){
    return new Promise((resolve, reject) => {
        getData(url)
        .then((response) => {
            var ratingValue
            if(!response.reviewRating){
                ratingValue = 0
            }
            else{
                ratingValue = response.reviewRating.ratingValue
            }
            resolve({
                // reviewerId: response.author[0].sameAs.split('/')[3],
                reviewerName: response.author[0].name,
                reviewDesc: response.description,
                reviewContent: response.reviewBody,
                filmName: response.itemReviewed.name,
                filmYear: film_year,
                reviewRating: ratingValue,
                filmURL: response.itemReviewed.sameAs,
                url: response.url
            })
        })
        .catch((error) => {
            reject(error)
        })
    })
}

module.exports = {getDetailedData, getSmallData}


// structured data markup

