DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(255),
  image_url VARCHAR(255),
  description TEXT, 
  bookshelf VARCHAR(255)
);

INSERT INTO books(author, title, image_url, description) VALUES ('Herman Melville', 'Moby Dick','placeholder', 'That is one mean whale');

SELECT * FROM books;