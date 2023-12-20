const express = require('express')
const cors = require('cors')
const app = express();
const { getDetailedData, getSmallData } = require('./scraper')
app.use(cors())

const missingParamsError = {
    error: true,
    message: "Missing required params (uid and/or fid)",
    status: 422
}

app.get('/', (req, res) => {
    res.status(200).send(`
    <body style="background-color: black">
        <p style="color:white">
            visit
            <br>
            "/review?uid=USER_ID&fid=FILM_ID&vid=REVIEW_VERSION" for short review
            <br>
            and
            <br>
            "/review-detailed" for the long one
        </p>
    </body>
    
    `)
})
app.get('/review', (req, res) => {
    const uid = req.query.uid
    const fid = req.query.fid
    const vid = req.query.vid
    if(!uid || !fid){
        return res.status(missingParamsError.status).json(missingParamsError)
    }
    getSmallData(uid, fid, vid)
    .then((details) => {
        res.json(details)
    })
    .catch((error) => {
        res.status(error.status).json(error)
    })
})
app.get('/review-detailed', (req, res) => {
    const uid = req.query.uid
    const fid = req.query.fid
    const vid = req.query.vid
    if(!uid || !fid){
        return res.status(missingParamsError.status).json(missingParamsError)
        
    }
    getDetailedData(uid, fid, vid)
    .then((details) => {
        res.json(details)
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