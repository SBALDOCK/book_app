'use strict';

const express = require('express');
const app = express();
require('dotenv').config();
const superagent = require('superagent');
require('ejs');

// Set up PORT
const PORT = process.env.PORT || 3001;
// Parse body of the request object
app.use(express.urlencoded({ extended: true }));
//  serve files from the public folder
app.use(express.static('public'));
// look in the views folder for ejs files to use as our templating
app.set('view engine', 'ejs');

// establishing home route and rendering index.ejs file
app.get('/', (request, res) => {
  res.status(200).render('pages/index.ejs');
})

// establishing searches/new route for searching a title or author
app.get('/searches/new', (request, res) => {
  res.status(200).render('pages/searches/new.ejs');
})

app.post('/searches', (request, response) => {
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
})

/// Book constructor
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.image = info.imageLinks.thumbnail ? info.imageLinks.thumbnail : placeholderImage;
  this.title = info.title ? info.title : 'no title available';
  this.authors = info.authors ? info.authors : 'not available';
  this.description = info.description ? info.description: 'not available';
}

app.get('*', (request, res) => res.status(404).send('Sorry this route does not exist.'));

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})
