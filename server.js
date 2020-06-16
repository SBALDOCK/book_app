'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
require('dotenv').config();
const superagent = require('superagent');

require('ejs');

const PORT = process.env.PORT || 3001;
app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'));
app.set('view engine', 'ejs');





app.get('/', (request, res) => {
  res.render('pages/index.ejs');
  //   res.status(200).send('hello!')
})

app.get('/searches/new', (request, res) => {
  res.render('pages/searches/new.ejs');
})

app.post('/searches', (request, response) => {
  console.log(request.body.search);
  let query = request.body.search[0];
  let titleOrAuthor = request.body.search[1];
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (titleOrAuthor === 'title') {
    url += `+intitle:${query}`;

  } else if (titleOrAuthor === 'author') {
    url += `+inauthor:${query}`;
  }
  console.log('test');
  superagent.get(url)
    .then(results => {
      console.log(results.body.items);
      let bookArray = results.body.items
      const finalBookArray = bookArray.map(book => {
        return new Book(book.volumeInfo);
      })
      console.log('im in book array', finalBookArray);

      response.status(200).render('pages/searches/show.ejs', { books: finalBookArray });

    }).catch(err => console.log(err));
})

/// Book constructor
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title ? info.title : 'no title available';
  this.author = info.author;


}





app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);

})
