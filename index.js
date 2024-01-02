// const express = require('express')
// const cors = require('cors')
// const rateLimit = require('express-rate-limit')
import http from 'http'
import url from 'url'
import { getReviewData, getProxyImage } from './scraper.js'
const missingParamsError = {
    error: true,
    message: "Missing required params (blink)",
    status: 422
}

/*
const useRateLimit = true
const maxRequests = 15
const minSeconds = 60

const app = express()
const limiter = rateLimit({
    windowMs: minSeconds * 1000,
    max: maxRequests,
    headers: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res ) => {
        return res.status(429).json({
            error: true,
            message: 'You sent too many requests. Please wait a while then try again',
            status: 429
        })
    }
})

if(useRateLimit)
    app.use(limiter)
app.use(cors())
*/
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'text/json')
    const url_parts = url.parse(req.url, true)
    // default route
    if(url_parts.pathname === '/'){
        res.writeHead(502)
        res.end(JSON.stringify({
            error: true,
            message: "Visit /review?blink=${letterboxd_url} or /image?blink=${jpeg_image_url}"
        }))
    }
    // review route
    else if(url_parts.pathname === '/review'){
        if(!url_parts.query || Object.keys(url_parts.query).length !== 1 || !url_parts.query.blink){
            res.writeHead(missingParamsError.status)
            res.end(JSON.stringify(missingParamsError))
            return
        }
        var blink = url_parts.query.blink
        if(!(blink.substr(0, 8) === 'https://' || blink.substr(0, 7) === 'http://')){
            blink = 'http://' + blink
        }
        getReviewData(blink)
        .then((details) => {
            res.end(JSON.stringify(details))
        })
        .catch((error) => {
            res.writeHead(error.status || 520)
            res.end(JSON.stringify(error))
        })
    }
    // image-proxy route
    else if(url_parts.pathname === '/image'){
        // Object.keys(url_parts.query).length !== 1
        if(!url_parts.query || !url_parts.query.blink){
            res.writeHead(missingParamsError.status)
            res.end(JSON.stringify(missingParamsError))
            return
        }
        const blink = url_parts.query.blink
        getProxyImage(blink)
        .then((response) => {
            res.setHeader('Content-Type', 'image/jpeg')
            response.body.pipe(res)
        })
        .catch((error) => {
            // CHANGE THIS
            try{
                res.setHeader('Content-Type', 'text/json')
                res.writeHead(error.status || 520)
            }
            catch(e){
                console.error(e)
            }
            finally{
                res.end(JSON.stringify(error))
            }
        })
    }
    // bad route
    else{
        res.writeHead(404)
        res.end(JSON.stringify({
            error: true,
            message: "Route not found!",
            status: 404
        }))
    }
})
const PORT = process.env.PORT || 8080
server.listen(PORT, () => console.log(`listening on ${PORT}`))