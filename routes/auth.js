require('dotenv').config();

const ENV = process.env.NODE_ENV || 'development';
const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig[ENV]);

const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbUsers = require('../db/users')(knex);


const router = express.Router();

module.exports = (function() {
  router.use(cookieSession({
    name: 'session',
    keys: ['Lighthouse'],
    maxAge: 24 * 60 * 60 * 1000
  }));

  // for reg and login forms
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  // checks for sessions on page refresh
  router.get('/checkifloggedin', (req, res) => {
    console.log('check if loggedin');
    const sessionUsername = req.session.username;
    res.json({
      isLoggedIn: (sessionUsername !== undefined),
      username: sessionUsername,
      user_id: req.session.user_id
    });
  });

  // register route
  router.post('/register', (req, res) => {
    dbUsers.getUserByEmail(req.body.email).then(result => {
      if (!req.body.email || !req.body.password || !req.body.username){
        res.status(400);
        res.json({ response: 'Please input all fields.'});
      } else if (result[0]) {
        res.status(400);
        res.json({ response: 'Email entered already in use. Please register with another email' });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          const username = req.body.username.toLowerCase();
          const email = req.body.email.toLowerCase();
          const user_id = dbUsers.insertUser(username, email, hash)
          .then(() => {
            req.session.username = username;
            req.session.user_id = user_id;
            res.json({ username: req.session.username, user_id: req.session.user_id });
          });
        });
      }
    });
  });

  // LOGIN routes
  router.post('/login', (req, res) => {
    const inputPw = req.body.password;
    const inputUsername = req.body.username.toLowerCase();

    dbUsers.getUserByUserName(inputUsername).then((result) => {
      if (!result[0]) {
        res.status(403)
        return Promise.reject({
          type: 403,
          message: `Account with email entered not found.`
        });
      } else {
        const registeredPw = result[0].password;
        const user_id = result[0].id;
        bcrypt.compare(inputPw, registeredPw, (err, result) => {
          if (!result) {
            res.status(401);
            res.json({ response: 'Incorrect username or password' });
          } else {
            req.session.username = inputUsername;
            req.session.user_id = user_id;
            res.json({ username: req.session.username, user_id: req.session.user_id });
          }
        });
      }
    }).catch(err => {
      res.redirect('/');
    });
  });

  // Logout route
  router.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
  });

  return router;
})();
