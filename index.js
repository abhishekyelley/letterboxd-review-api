const express = require('express')
const cors = require('cors')
const app = express();
const { getReviewData, getProxyImage } = require('./scraper')
app.use(cors())

const missingParamsError = {
    error: true,
    message: "Missing required params (blink)",
    status: 422
}

app.get('/', (req, res) => {
    res.status(502).json({
        error: true,
        message: "Visit /review?blink=${letterboxd_url} or /images?blink=${jpeg_image_url}"
    })
})
app.get('/review', (req, res) => {
    const blink = req.query.blink
    if(!blink){
        return res.status(missingParamsError.status).json(missingParamsError)
    }
    getReviewData(blink)
    .then((details) => {
        res.json(details)
    })
    .catch((error) => {
        res.status(error.status).json(error)
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
        res.status(error.status).json(error)
    })
})
app.use((req, res)=>{
    res.status(404).json({
        error: true,
        message: "Route not found!"
    })
})
const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`listening on ${PORT}`))