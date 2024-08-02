const express = require('express');
const router = express.Router();

// Middleware to check if the user is authenticated
function checkAuth(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// GET register route
router.get('/register', (req, res) => {
  res.render('register');
});

// POST register route
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';

  db.query(sql, [username, password], (error, results) => {
    if (error) {
      console.error("Error registering user:", error);
      res.status(500).send('Error registering user');
    } else {
      req.session.userId = results.insertId;
      req.session.username = username;
      res.redirect('/');
    }
  });
});

// GET login route
router.get('/login', (req, res) => {
  res.render('login');
});

// POST login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  db.query(sql, [username], (error, results) => {
    if (error) {
      console.error("Error during login:", error);
      return res.status(500).send('Login failed');
    }

    if (results.length > 0) {
      const user = results[0];
      if (password === user.password) {
        req.session.userId = user.id;
        req.session.username = user.username;
        return res.redirect('/');
      }
    }

    return res.status(401).send('Invalid login credentials');
  });
});

// GET logout route
router.get('/logout', (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error("Error destroying session:", error);
      return res.status(500).send('Logout failed');
    }
    res.redirect('/login');
  });
});

module.exports = { router, checkAuth };
