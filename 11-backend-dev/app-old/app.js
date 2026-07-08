const express = require('express');
const app = express()
const path = require('path');
const port = 3000

app.set('view engine', 'pug')
app.set('views', path.join(__dirname,'views'));

app.use('/static', express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// }) 

app.get('/', (req, res) => {
  res.render('index',{
    message: 'Hello World!',
    title: 'My Pug App'
  })
})

// app.get('/greet', (req, res) => {
//   res.send(`<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Document</title>
// </head>
// <body>
//     <h1> Vishwas</h1>
// </body> 
// </html>`)
// })



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})