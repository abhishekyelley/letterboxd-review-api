import { matchURL, getOpenCloseBraces, getScrapedData, getJson, addImages, getWebsite, isImage } from './utils.js'
var film_year

function getData(req_url){
    return new Promise((resolve, reject) => {
        getWebsite(req_url)
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
                url: error.url || req_url
            })
        })
    })
}

function getReviewData(req_url){
    return new Promise((resolve, reject) => {
        getData(req_url)
        .then((response) => {
            var ratingValue
            if(!response.reviewRating){
                ratingValue = 0
            }
            else{
                ratingValue = response.reviewRating.ratingValue
            }
            return new Promise((iresolve, ireject) =>
                iresolve({
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
            )
        })
        .then((response) => 
            addImages(response)
        )
        .then(response => 
            resolve(response)
        )
        .catch((error) => {
            reject(error)
        })
    })
}

function getProxyImage(req_url){
    return new Promise((resolve, reject) => {
        getWebsite(req_url, {
            method: "GET",
            // responseType was arraybuffer
            // to use stream, result must be piped
            headers: {
                'Accept': 'stream'
            }
        })
        .then((res) => isImage(res))
        .then((res) => resolve(res))
        .catch((error) => reject(
            {
                error: true,
                message: error.message || "Couldn't reach image",
                status: error.response ? error.response.status || 404 : 404,
                url: error.url || req_url
            }
        ))
    })
}

export { getReviewData, getProxyImage }


// structured data markup

