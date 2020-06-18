'use strict';

// libraries
require('dotenv').config();
require('ejs');
const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

// Set up PORT
const PORT = process.env.PORT || 3001;
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// MiddleWare
// Parse body of the request object -
app.use(express.urlencoded({ extended: true }));
// lets us translate (change our method using in HTML to a put or delete
app.use(methodOverride('_method'));
//  serve files from the public folder - front end files
app.use(express.static('public'));
// look in the views folder for ejs files to use as our templating
app.set('view engine', 'ejs');

// Routes
app.get('/', homePage); // rendering home page which shows all saved books
app.get('/add', searchNewBook); // new book search page
app.post('/searches', searchResults); // shows search results
app.post('/details', addToFavorites); // add book to favorites and adds to details page
app.get('/books/:id', bookDetails) // shows detail page
app.put('/update/:book_id', updateBook) // Update book details
app.delete('/update/:book_id', deleteBook) // delete book from database

// Render books from database on home page
function homePage (request, response) {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
  return client.query(sql)
    .then(sqlResults => {
      response.status(200).render('pages/index.ejs', {books: sqlResults.rows})
    }).catch(error => console.log(error))
}

// Book Search
function searchNewBook (request, res) {
  res.status(200).render('pages/searches/new.ejs');
}

// Search Google API
function searchResults (request, response) {
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
    }).catch(err => console.error('ERROR', err));
}

/// Book constructor
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.image = info.imageLinks.thumbnail ? info.imageLinks.thumbnail : placeholderImage;
  this.title = info.title ? info.title : 'no title available';
  this.author = info.authors ? info.authors[0] : 'not available';
  this.description = info.description ? info.description: 'not available';
  this.isbn = info.industryIdentifiers ? info.industryIdentifiers[0].identifier: 'not available';
}

// Add books to favorites (insert into database)
function addToFavorites(request,response) {
  let {title, author, description, image, isbn} = request.body
  let sql = 'INSERT INTO books (image, title, author, description, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING ID;';
  let safeValues = [image, title, author, description, isbn];

  client.query(sql, safeValues)
    .then(results => {
      console.log(results.rows);
      let id = results.rows[0].id;
      response.status(200).redirect(`/books/${id}`);
    }).catch('error', err => console.log(err));
}

// Render details of one book on details page 
function bookDetails(request, response) {
  let id = request.params.id;
  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [id];
  client.query(sql, safeValues)
    .then(sqlResults => {
      console.log('my sql results', sqlResults.rows);
      response.status(200).render('pages/searches/details.ejs', {oneBook: sqlResults.rows[0]});
    }) .catch(error => console.log(error))
}

// Update information in database
function updateBook (request, response) {
  console.log('this is our params', request.params);
  let bookID = request.params.book_id;
  console.log('form information to be updated', request.body);
  let {author, title, description} = request.body;
  let sql = 'UPDATE books SET author=$1, title=$2, description=$3 WHERE id=$4;';
  let safeValues = [author, title, description, bookID];

  client.query(sql, safeValues)
    .then(sqlResults => {
      console.log(sqlResults)
      response.redirect(`/books/${bookID}`);
    })
}

// Delete book from database - app.get above
function deleteBook (request, response) {
  console.log('this is our params', request.params);
  let bookID = request.params.book_id;
  console.log('form information to be updated', request.body);
  let sql = 'DELETE FROM books WHERE id=$1;';
  let safeValues = [bookID];
  client.query(sql, safeValues)
    .then(() => {
      response.redirect('/');
    })
}

// turn on server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  });

app.get('*', (request, res) => res.status(404).send('Sorry this route does not exist.'));
