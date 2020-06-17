'use strict';

const express = require('express');
const app = express();
require('dotenv').config();
const superagent = require('superagent');
require('ejs');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  });

// Set up PORT
const PORT = process.env.PORT || 3001;
// Parse body of the request object
app.use(express.urlencoded({ extended: true }));
//  serve files from the public folder
app.use(express.static('public'));
// look in the views folder for ejs files to use as our templating
app.set('view engine', 'ejs');

app.get('/', getBooks);
app.post('/searches', bookSearch);

// establishing searches/new route for searching a title or author
app.get('/searches/new', (request, res) => {
  res.status(200).render('pages/searches/new.ejs');
})

function bookSearch (request, response) {
  let query = request.body.search[0];
  let titleOrAuthor = request.body.search[1];
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (titleOrAuthor === 'title') {
    url += `+intitle:${query}`;

  } else if (titleOrAuthor === 'author') {
    url += `+inauthor:${query}`;
  }
  superagent.get(url)
    .then(results => {
      // console.log(results.body.items);
      let bookArray = results.body.items
      const finalBookArray = bookArray.map(book => {
        return new Book(book.volumeInfo);
      })
      response.status(200).render('pages/searches/show.ejs', { books: finalBookArray });
    }).catch(err => console.log(err));
}

/// Book constructor
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.image = info.imageLinks.thumbnail ? info.imageLinks.thumbnail : placeholderImage;
  this.title = info.title ? info.title : 'no title available';
  this.author = info.authors ? info.authors : 'not available';
  this.description = info.description ? info.description: 'not available';
}

function getBooks (request, response) {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      let books = sqlResults.rows;
      response.status(200).render('pages/index.ejs', {books: books})
    })
}


// app.post('/add', (request,response) => {
//   let {title, author, description} = request.body
//   let sql = 'INSERT INTO books (title, author, description) VALUES ($1, $2, $3) RETURNING ID;';
//   let safeValues = [title, author, description];

//   client.query(sql, safeValues)
//     .then(results => {
//       console.log(results.rows);
//       let id = results.rows[0].id;
//       response.render(`/books/${id}`);
//     })
// })

app.get('*', (request, res) => res.status(404).send('Sorry this route does not exist.'));



