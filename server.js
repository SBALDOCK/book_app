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
app.post('/add', addBooks);
app.get('/books/:book_id', getOneBook)

// establishing searches/new route for searching a title or author
app.get('/searches/new', (request, res) => {
  res.status(200).render('pages/searches/new.ejs');
})

// Render details of one book on details page when show details button is selected on index.ejs page
function getOneBook(request, response){
  let id = request.params.book_id;
  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [id];
  client.query(sql, safeValues)
    .then(sqlResults => {
      console.log(sqlResults.rows);
      response.status(200).render('pages/searches/details.ejs', {oneBook: sqlResults.rows[0]});
    })
}

// Search for books at Google API
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

// Retrieves all books from database and renders on index.ejs page
function getBooks (request, response) {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      let books = sqlResults.rows;
      response.status(200).render('pages/index.ejs', {books: books})
    })
}

// Add books from search results into database
function addBooks (request,response) {
  let {image_url, title, author, description, isbn, bookshelf} = request.body
  let sql = 'INSERT INTO books (image_url, title, author, description, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ID;';
  let safeValues = [image_url, title, author, description, isbn, bookshelf];

  client.query(sql, safeValues)
    .then(results => {
      console.log(results.rows);
      let id = results.rows[0].id;
      response.redirect(`/books/${id}`);
    })
}

app.get('*', (request, res) => res.status(404).send('Sorry this route does not exist.'));



// Things I did this morning

// 1. Replaced all of the head content with the single line of code pointing to the new "head.ejs" file
// 2. Added a new details.ejs file and pointed the "view details" button on the index.ejs file to this page
// 3. Added a function called addBooks that should, at some point in the future, add favorited books from the show.ejs file into the database
// 4. Styled the details.ejs file similarly to the rest of the pages.


// Things we need to do in order to get caught up

// 1. Figure out how to store images in our database from the example seed/schema entries
// 2. Style our index.ejs file to match the wireframe example
// 3. Style our details.ejs file to match the wireframe example
// 5. Add functionality to add selections from our show.ejs file to the database (using button add to favorites)
// 6. Add button from index.ejs to initiate a book search (this should point to our new.ejs file)
// 7.
