const express = require('express'),
    bodyParser = require('body-parser'),
    // In order to use PUT HTTP verb to edit item
    methodOverride = require('method-override'),
    // Mitigate XSS using sanitizer
    sanitizer = require('sanitizer'),
    app = express(),
    port = 8000

app.use(bodyParser.urlencoded({
    extended: false
}));
// https: //github.com/expressjs/method-override#custom-logic
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        let method = req.body._method;
        delete req.body._method;
        return method
    }
}));


// Notes array - each note has title and content
let notes = [];

/* The notes list and the form are displayed */
app.get('/notes', function (req, res) {
    res.render('todo.ejs', {
        notes,
        clickHandler: "func1();"
    });
})

    /* Adding a note to the notes list */
    .post('/notes/add/', function (req, res) {
        // Escapes HTML special characters in attribute values as HTML entities
        let newTitle = sanitizer.escape(req.body.newTitle);
        let newContent = sanitizer.escape(req.body.newContent);
        if (newTitle != '' || newContent != '') {
            notes.push({
                title: newTitle || 'Untitled',
                content: newContent || ''
            });
        }
        res.redirect('/notes');
    })

    /* Deletes a note from the notes list */
    .get('/notes/delete/:id', function (req, res) {
        if (req.params.id != '') {
            notes.splice(req.params.id, 1);
        }
        res.redirect('/notes');
    })

    // Get a single note and render edit page
    .get('/notes/:id', function (req, res) {
        let noteIdx = req.params.id;
        let note = notes[noteIdx];

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
    .put('/notes/edit/:id', function (req, res) {
        let noteIdx = req.params.id;
        // Escapes HTML special characters in attribute values as HTML entities
        let editTitle = sanitizer.escape(req.body.editTitle);
        let editContent = sanitizer.escape(req.body.editContent);
        if (noteIdx != '') {
            notes[noteIdx] = {
                title: editTitle || 'Untitled',
                content: editContent || ''
            };
        }
        res.redirect('/notes');
    })
    /* Redirects to the notes list if the page requested is not found */
    .use(function (req, res, next) {
        res.redirect('/notes');
    })

    .listen(port, function () {
        // Logging to console
        console.log(`Notes App running on http://0.0.0.0:${port}`)
    });
// Export app
module.exports = app;
