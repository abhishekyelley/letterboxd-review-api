const express = require('express')
const cors = require('cors')
const app = express();
const { getDetailedData, getSmallData } = require('./scraper')
app.use(cors())


app.get('/', (req, res) => {
    res.status(200).send('<h3>visit "/review?uid=USER_ID&fid=FILM_ID&vid=REVIEW_VERSION" for short review and "/review-detailed" for the long one</h3>')
})
app.get('/review', (req, res) => {
    const uid = req.query.uid
    const fid = req.query.fid
    const vid = req.query.vid
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