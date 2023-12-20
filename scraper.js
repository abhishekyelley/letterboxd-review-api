const axios = require('axios')
const cheerio = require('cheerio')
const { matchURL, getOpenCloseBraces, getScriptTagText } = require('./utils')

var film_year
function getData(url){
    return new Promise((resolve, reject) => {
        axios.get(url)
        .then((response) => {
            const $ = cheerio.load(response.data)
            const scriptTagText = $('script[type="application/ld+json"]').text()
            if(scriptTagText){
                getOpenCloseBraces(scriptTagText)
                .then(({ openBrace, closeBrace }) => {
                    return JSON.parse(scriptTagText.slice(openBrace, closeBrace+1))
                })
                .then((data) => {
                    return matchURL(data)
                })
                .then((data) => {
                    film_year = $('.film-title-wrapper > small').text()
                    return resolve(data)
                })
                .catch( (error) => {
                    return reject(error)
                })
            }
            else{
                reject({
                    message: "Bad URL! Couldn't find script tag",
                    response: {status: 400}
                })
            }
        })
        .catch((error) => {
            console.error('Error fetching data:', error.message)
            reject({
                error: true,
                message: error.message || "Error occured",
                status: error.response ? error.response.status || 500 : 500,
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

function getSmallData(uid, fid, vid){
    return new Promise((resolve, reject) => {
        getData(uid, fid, vid)
        .then((response) => {
            var ratingValue
            if(!response.reviewRating){
                ratingValue = null
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
                reviewRating: ratingValue
            })
        })
        .catch((error) => {
            reject(error)
        })
    })
}


// =============TESTING============
const uid = "kenough_"
const fid = "petta"
const vid = "1"
// getSmallData(uid, fid, vid)
// .then((res)=>{
//     console.log(res)
// })

// "https://letterboxd.com/kenough_/film/petta/1/"
// "https://letterboxd.com/film/petta/"

getData("https://letterboxd.com/kenough_/film/petta/1/")
.then(res=>console.log(res))
.catch(err=>console.error(err))
// =============TESTING============


module.exports = {getDetailedData, getSmallData}


// structured data markup

/*
const reviewStars = $('.rating.rating-large.rated-large-9').text()
const reviewerName = $('.title-4 > a > span').eq(0).text()
const filmName = $('.film-title-wrapper > a').text()
const filmYear = $('.film-title-wrapper > small').text()
const reviewContent = $('.review.body-text.-prose.-hero.-loose > div > div').text()
resolve({
    userId: uid,
    filmId: fid,
    reviewStars,
    reviewerName,
    filmName,
    filmYear,
    reviewContent
})
*/