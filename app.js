const express = require('express');
const bodyParser = require('body-parser');
// In order to use PUT HTTP verb to edit item
const methodOverride = require('method-override');
// Mitigate XSS using sanitizer
const sanitizer = require('sanitizer');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const port = Number(process.env.PORT) || 8000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(bodyParser.urlencoded({ extended: false }));

// https://github.com/expressjs/method-override#custom-logic
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        const method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

app.use(
    session({
        name: 'notes.sid',
        secret: process.env.SESSION_SECRET || 'dev-notes-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax'
        }
    })
);

// In-memory users and notes (per-user). NOTE: this is not durable storage.
const usersByUsername = new Map(); // username -> { id, username, passwordHash }
const notesByUserId = new Map(); // userId -> Array<{title, content}>
let nextUserId = 1;

function getCurrentUser(req) {
    if (!req.session || !req.session.userId) return null;
    // reverse-lookup is cheap for small in-memory store
    for (const user of usersByUsername.values()) {
        if (user.id === req.session.userId) return user;
    }
    return null;
}

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) return next();
    return res.redirect('/login');
}

app.use(function attachUserToViews(req, res, next) {
    res.locals.user = getCurrentUser(req);
    next();
});

app.get('/', function (req, res) {
    if (req.session && req.session.userId) return res.redirect('/notes');
    return res.redirect('/login');
});

app
    // --- Auth ---
    .get('/register', function (req, res) {
        res.render('register.ejs', { error: req.query.error || null });
    })
    .post('/register', async function (req, res) {
        const username = (req.body.username || '').trim();
        const password = req.body.password || '';

        if (!username || !password) return res.redirect('/register?error=Missing%20username%20or%20password');
        if (usersByUsername.has(username)) return res.redirect('/register?error=Username%20already%20exists');

        const passwordHash = await bcrypt.hash(password, 10);
        const user = { id: nextUserId++, username, passwordHash };
        usersByUsername.set(username, user);
        notesByUserId.set(user.id, []);

        req.session.userId = user.id;
        return res.redirect('/notes');
    })

    .get('/login', function (req, res) {
        res.render('login.ejs', { error: req.query.error || null });
    })
    .post('/login', async function (req, res) {
        const username = (req.body.username || '').trim();
        const password = req.body.password || '';
        const user = usersByUsername.get(username);

        if (!user) return res.redirect('/login?error=Invalid%20username%20or%20password');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.redirect('/login?error=Invalid%20username%20or%20password');

        req.session.userId = user.id;
        return res.redirect('/notes');
    })

    .get('/logout', function (req, res) {
        if (!req.session) return res.redirect('/login');
        req.session.destroy(function () {
            res.redirect('/login');
        });
    })

    // --- Notes ---
    /* The notes list and the form are displayed */
    .get('/notes', requireAuth, function (req, res) {
        const userNotes = notesByUserId.get(req.session.userId) || [];
        res.render('todo.ejs', {
            notes: userNotes,
            clickHandler: "func1();"
        });
    })

    /* Adding a note to the notes list */
    .post('/notes/add/', requireAuth, function (req, res) {
        // Escapes HTML special characters in attribute values as HTML entities
        const newTitle = sanitizer.escape(req.body.newTitle);
        const newContent = sanitizer.escape(req.body.newContent);
        const userNotes = notesByUserId.get(req.session.userId) || [];

        if (newTitle !== '' || newContent !== '') {
            userNotes.push({
                title: newTitle || 'Untitled',
                content: newContent || ''
            });
            notesByUserId.set(req.session.userId, userNotes);
        }
        res.redirect('/notes');
    })

    /* Deletes a note from the notes list */
    .get('/notes/delete/:id', requireAuth, function (req, res) {
        const idx = Number(req.params.id);
        const userNotes = notesByUserId.get(req.session.userId) || [];
        if (Number.isInteger(idx) && idx >= 0 && idx < userNotes.length) {
            userNotes.splice(idx, 1);
        }
        res.redirect('/notes');
    })

    // Get a single note and render edit page
    .get('/notes/:id', requireAuth, function (req, res) {
        const noteIdx = Number(req.params.id);
        const userNotes = notesByUserId.get(req.session.userId) || [];
        const note = userNotes[noteIdx];

        if (note) {
            res.render('edititem.ejs', {
                noteIdx,
                note,
                clickHandler: "func1();"
            });
        } else {
            res.redirect('/notes');
        }
    })

    // Edit note in the notes list
    .put('/notes/edit/:id', requireAuth, function (req, res) {
        const noteIdx = Number(req.params.id);
        // Escapes HTML special characters in attribute values as HTML entities
        const editTitle = sanitizer.escape(req.body.editTitle);
        const editContent = sanitizer.escape(req.body.editContent);
        const userNotes = notesByUserId.get(req.session.userId) || [];

        if (Number.isInteger(noteIdx) && noteIdx >= 0 && noteIdx < userNotes.length) {
            userNotes[noteIdx] = {
                title: editTitle || 'Untitled',
                content: editContent || ''
            };
        }
        res.redirect('/notes');
    })

    /* Redirects to the notes list if the page requested is not found */
    .use(function (req, res) {
        if (req.session && req.session.userId) return res.redirect('/notes');
        return res.redirect('/login');
    });

if (require.main === module) {
    app.listen(port, function () {
        // Logging to console
        console.log(`Notes App running on http://0.0.0.0:${port}`);
    });
}

// Export app
module.exports = app;
