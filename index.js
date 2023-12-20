const express = require('express')
const cors = require('cors')
const app = express();
const { getDetailedData, getSmallData } = require('./scraper')
app.use(cors())

const missingParamsError = {
    error: true,
    message: "Missing required params (blink)",
    status: 422
}

app.get('/', (req, res) => {
    res.status(200).send(`
    <body style="background-color: black">
        <p style="color:white">
            visit
            <br>
            "/review?blink=LBX_URL" for short review
            <br>
            and
            <br>
            "/review-detailed" for the long one
        </p>
    </body>
    
    `)
})
app.get('/review', (req, res) => {
    const blink = req.query.blink
    if(!blink){
        return res.status(missingParamsError.status).json(missingParamsError)
    }
    getSmallData(blink)
    .then((details) => {
        res.json(details)
    })
    .catch((error) => {
        res.status(error.status).json(error)
    })
})
app.get('/review-detailed', (req, res) => {
    const blink = req.query.blink
    if(!blink){
        return res.status(missingParamsError.status).json(missingParamsError)
    }
    getDetailedData(blink)
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