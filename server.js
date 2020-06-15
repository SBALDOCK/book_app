'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
require('dotenv').config();
const superagent = require('superagent');
const { request, response } = require('express');

require('ejs');

const PORT = process.env.PORT || 3001;
app.use(express.urlencoded({extended: true}));
// app.use(express.static('public'));
app.set('view engine', 'ejs');





app.get('/', (request, res) => {
  res.render('index.ejs');
  res.status(200).send('hello sdfadsf!')
})


app.listen(PORT, ()=>{
  console.log(`listening on ${PORT}`);

})
