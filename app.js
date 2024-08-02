const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'eventhub'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

global.db = db;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Middleware to check if the user is authenticated
function checkAuth(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// GET routes
app.get('/', (req, res) => {
  const query = 'SELECT * FROM events';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render('home', {
      events: results,
      userId: req.session.userId,
      username: req.session.username
    });
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error("Error destroying session:", error);
      return res.status(500).send('Logout failed');
    }
    res.redirect('/login');
  });
});

app.get('/create_event', checkAuth, (req, res) => {
  res.render('create_event', {
    userId: req.session.userId,
    username: req.session.username
  });
});

app.get('/list_events', (req, res) => {
  const query = 'SELECT * FROM events';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.render('list_events', {
      events: results,
      userId: req.session.userId,
      username: req.session.username
    });
  });
});

app.get('/profile', checkAuth, (req, res) => {
  const userId = req.session.userId;

  const userQuery = 'SELECT * FROM users WHERE id = ?';
  const eventsQuery = 'SELECT * FROM events WHERE organizer_id = ?';

  db.query(userQuery, [userId], (err, userResults) => {
    if (err) throw err;

    db.query(eventsQuery, [userId], (err, eventResults) => {
      if (err) throw err;

      if (userResults.length > 0) {
        res.render('user_profile', {
          user: userResults[0],
          events: eventResults,
          userId: req.session.userId,
          username: req.session.username
        });
      } else {
        res.status(404).send('User not found');
      }
    });
  });
});

app.get('/edit_event/:id', checkAuth, (req, res) => {
  const eventId = req.params.id;
  const query = 'SELECT * FROM events WHERE id = ?';

  db.query(query, [eventId], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      res.render('edit_event', {
        event: results[0],
        userId: req.session.userId,
        username: req.session.username
      });
    } else {
      res.status(404).send('Event not found');
    }
  });
});

// POST routes
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

  db.query(sql, [username, email, password], (error, results) => {
    if (error) {
      console.error("Error registering user:", error);
      res.status(500).send('Error registering user');
    } else {
      req.session.userId = results.insertId;
      req.session.username = username;
      res.send('<script>alert("Account Successfully Created."); window.location.href = "/";</script>');
    }
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], (error, results) => {
    if (error) {
      console.error("Error during login:", error);
      return res.status(500).send('Login failed');
    }

    if (results.length > 0) {
      const user = results[0];
      if (password === user.password) {
        req.session.userId = user.id;
        req.session.username = user.username;
        return res.send('<script>alert("Successfully Logged In"); window.location.href = "/profile";</script>');
      }
    }

    return res.send('<script>alert("Unsuccessful Log In. Wrong Username/Password."); window.location.href = "/login";</script>');
  });
});

app.post('/create_event', checkAuth, (req, res) => {
  const { name, description, date, time, location, ticket_price, image_url } = req.body;
  const query = 'INSERT INTO events (name, description, date, time, location, ticket_price, organizer_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, description, date, time, location, ticket_price, req.session.userId, image_url], (err, result) => {
    if (err) throw err;
    res.redirect('/list_events');
  });
});

app.post('/edit_event/:id', checkAuth, (req, res) => {
  const eventId = req.params.id;
  const { name, description, date, time, location, ticket_price, image_url } = req.body;
  const query = 'UPDATE events SET name = ?, description = ?, date = ?, time = ?, location = ?, ticket_price = ?, image_url = ? WHERE id = ?';

  db.query(query, [name, description, date, time, location, ticket_price, image_url, eventId], (err, result) => {
    if (err) throw err;
    res.redirect('/profile');
  });
});

app.post('/delete_event/:id', checkAuth, (req, res) => {
  const eventId = req.params.id;
  const query = 'DELETE FROM events WHERE id = ?';

  db.query(query, [eventId], (err, result) => {
    if (err) throw err;
    res.redirect('/profile');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
