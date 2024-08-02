const express = require('express');
const router = express.Router();
const { checkAuth } = require('./auth');

// Home Page - Fetch and Display Events
router.get('/', (req, res) => {
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

// Profile Page - Display User Info
router.get('/profile', checkAuth, (req, res) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [req.session.userId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      const user = results[0];
      res.render('user_profile', {
        user: user,
        userId: req.session.userId,
        username: req.session.username
      });
    } else {
      res.redirect('/login');
    }
  });
});

// Route to render create event form
router.get('/create_event', checkAuth, (req, res) => {
  res.render('create_event', {
    userId: req.session.userId,
    username: req.session.username
  });
});

// Route to handle event creation
router.post('/create_event', checkAuth, (req, res) => {
  const { name, description, date, time, location, ticket_price } = req.body;
  const query = 'INSERT INTO events (name, description, date, time, location, ticket_price, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, description, date, time, location, ticket_price, req.session.userId], (err, result) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Route to list events
router.get('/list_events', (req, res) => {
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

// Route to view a single event
router.get('/event/:id', (req, res) => {
  const eventId = req.params.id;
  const query = 'SELECT * FROM events WHERE id = ?';
  db.query(query, [eventId], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.render('event_details', {
        event: results[0],
        userId: req.session.userId,
        username: req.session.username
      });
    } else {
      res.status(404).send('Event not found');
    }
  });
});

// Route to render edit event form
router.get('/edit_event/:id', checkAuth, (req, res) => {
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

// Route to handle event edit
router.post('/edit_event/:id', checkAuth, (req, res) => {
  const eventId = req.params.id;
  const { name, description, date, time, location, ticket_price } = req.body;
  const query = 'UPDATE events SET name = ?, description = ?, date = ?, time = ?, location = ?, ticket_price = ? WHERE id = ?';
  db.query(query, [name, description, date, time, location, ticket_price, eventId], (err, result) => {
    if (err) throw err;
    res.redirect('/list_events');
  });
});

// Route to delete an event
router.post('/delete_event/:id', checkAuth, (req, res) => {
  const eventId = req.params.id;
  const query = 'DELETE FROM events WHERE id = ?';
  db.query(query, [eventId], (err, result) => {
    if (err) throw err;
    res.redirect('/list_events');
  });
});

module.exports = router;
