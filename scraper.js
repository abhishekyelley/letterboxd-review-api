const axios = require('axios')
const cheerio = require('cheerio')
var film_year
function getData(uid, fid, vid){
    const lbxURL = `https://letterboxd.com/${uid}/film/${fid}/${vid?vid:""}`
    return new Promise((resolve, reject) => {
        axios.get(lbxURL)
        .then((response) => {
            const $ = cheerio.load(response.data)
            film_year = $('.film-title-wrapper > small').text()
            const scriptTagText = $('script[type="application/ld+json"]').text()

            const data = JSON.parse(scriptTagText.slice(16, scriptTagText.length-11))
            resolve(data)
        })
        .catch((error) => {
            console.error('Error fetching data:', error.message)
            reject({
                error: true,
                message: error.message || "Error occured",
                status: error.response.status || 500,
                url: error.url || lbxURL
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