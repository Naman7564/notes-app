const request = require('supertest');
const { expect } = require('chai');

const app = require('./app');

function extractNotesCount(html) {
    const match = html.match(/class="notes-count">\s*(\d+)\s+note/);
    return match ? Number(match[1]) : 0;
}

describe('Authentication + per-user notes', function () {
    it('redirects unauthenticated users to /login', async function () {
        const res = await request(app).get('/notes');
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/login');
    });

    it('allows register/login and isolates notes by user', async function () {
        const alice = request.agent(app);
        const bob = request.agent(app);

        // Register Alice
        let res = await alice
            .post('/register')
            .type('form')
            .send({ username: 'alice', password: 'password1' });
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/notes');

        // Register Bob
        res = await bob
            .post('/register')
            .type('form')
            .send({ username: 'bob', password: 'password2' });
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/notes');

        // Alice adds a note
        res = await alice
            .post('/notes/add/')
            .type('form')
            .send({ newTitle: 'Alice Note', newContent: 'Secret' });
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/notes');

        // Bob adds a note
        res = await bob
            .post('/notes/add/')
            .type('form')
            .send({ newTitle: 'Bob Note', newContent: 'Private' });
        expect(res.status).to.equal(302);

        // Alice sees only Alice's note
        res = await alice.get('/notes');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Alice Note');
        expect(res.text).to.not.include('Bob Note');
        expect(extractNotesCount(res.text)).to.equal(1);

        // Bob sees only Bob's note
        res = await bob.get('/notes');
        expect(res.status).to.equal(200);
        expect(res.text).to.include('Bob Note');
        expect(res.text).to.not.include('Alice Note');
        expect(extractNotesCount(res.text)).to.equal(1);

        // Logout works
        res = await alice.get('/logout');
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/login');

        res = await alice.get('/notes');
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/login');
    });
});
