// const express = require('express')
// const cors = require('cors')
// const rateLimit = require('express-rate-limit')
const http = require('http')
const url = require('url')
const axios = require('axios')
const fs = require('fs')
const { getReviewData, getProxyImage } = require('./scraper')
const missingParamsError = {
    error: true,
    message: "Missing required params (blink)",
    status: 422
}
// Access-Control-Allow-Origin: *

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

    if(url_parts.pathname === '/'){
        res.writeHead(502)
        res.end(JSON.stringify({
            error: true,
            message: "Visit /review?blink=${letterboxd_url} or /image?blink=${jpeg_image_url}"
        }))
        return
    }

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
            res.writeHead(200)
            res.end(JSON.stringify(details))
        })
        .catch((error) => {
            res.writeHead(error.status || 520)
            res.end(JSON.stringify(error))
        })
        return
    }

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
            res.writeHead(200)
            response.data.pipe(res)
        })
        .catch((error) => {
            res.setHeader('Content-Type', 'text/json')
            res.writeHead(error.status || 520)
            res.end(JSON.stringify(error))
        })
        return
    }

    else{
        res.writeHead(404)
        return res.end(JSON.stringify({
            error: true,
            message: "Route not found!",
            status: 404
        }))
    }
})
/*
app.get('/', (req, res) => {
    res.status(502).json({
        error: true,
        message: "Visit /review?blink=${letterboxd_url} or /image?blink=${jpeg_image_url}"
    })
})
app.get('/review', (req, res) => {
    var blink = req.query.blink
    if(!blink){
        return res.status(missingParamsError.status).json(missingParamsError)
    }
    if(!(blink.substr(0, 8) === 'https://' || blink.substr(0, 7) === 'http://')){
        blink = 'http://' + blink
    }
    getReviewData(blink)
    .then((details) => {
        res.json(details)
    })
    .catch((error) => {
        res.status(error.status || 404).json(error)
    })
})
app.get('/image', (req, res) => {
    const blink = req.query.blink;
    if (!blink) {
        return res.status(missingParamsError.status).json(missingParamsError)
    }
    getProxyImage(blink)
    .then((response) => {
        res.setHeader('Content-Type', 'image/jpeg')
        res.send(response.data)
    })
    .catch((error) => {
        res.status(error.status || 404).json(error)
    })
})
app.all((req, res)=>{
    res.status(404).json({
        error: true,
        message: "Route not found!"
    })
    
})
*/
const PORT = process.env.PORT || 8080
// app.listen(PORT, () => console.log(`listening on ${PORT}`))
server.listen(PORT, () => console.log(`listening on ${PORT}`))