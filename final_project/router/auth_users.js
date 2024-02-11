const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
  let userswithsamename = users.filter((user)=>{
    return user.username === username
  });
  if(userswithsamename.length > 0){
    return true;
  } else {
    return false;
  }
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
  let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  });
  if(validusers.length > 0){
    return true;
  } else {
    return false;
  }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60*60});

    req.session.authorization = {
      accessToken,username
  }
  return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
});


// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  const isbn = req.params.isbn;
  const review = req.body.review;

  const username = req.session.authorization ? req.session.authorization.username : null;

  if (!username) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (books[isbn]) {
    const book = books[isbn];

    // Check if reviews is an object, convert it to an array
    if (!Array.isArray(book.reviews)) {
      book.reviews = [];
    }

    book.reviews.push({ username, review });
    return res.status(200).send(`Review "${review}" successfully posted by user "${username}"`);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
});

regd_users.get("/auth/review/:isbn", (req,res) =>{
  const isbn = req.params.isbn;
  const username = req.session.authorization ? req.session.authorization.username : null;
  if (!username){
    res.status(401).json({message: "Unauthorized"});
  }
  if (books[isbn]) {
    const book = books[isbn];
    const userReview = book.reviews.filter((review) => review.username === username);
    if (userReview) {
      return res.status(200).send(userReview)
    }
    else{
      return res.status(404).json({ message: `User ${username} has no review for the book with ISBN ${isbn}` });
    }
  }
  else{
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
})

regd_users.delete("/auth/review/:isbn", (req,res) =>{
  const isbn = req.params.isbn;
  const username = req.session.authorization ? req.session.authorization.username : null;
  if (!username){
    res.status(401).json({message: "Unauthorized"});
  }
  if (books[isbn]) {
    const book = books[isbn];
    const userReviewIndex = book.reviews.findIndex((review) => review.username === username);
    if (userReviewIndex !== null) {
      book.reviews.splice(userReviewIndex, 1);
      return res.status(200).send(`Review successfully deleted by ${username}`)
    }
    else{
      return res.status(404).json({ message: `User ${username} has no review for the book with ISBN ${isbn}` });
    }
  }
  else{
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
})

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
