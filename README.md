# Notes App (Node.js + Express)

A lightweight note-taking web application built with **Node.js**, **Express**, and **EJS**.
It includes basic **user registration/login** and keeps notes **isolated per user**.

> ⚠️ Storage is **in-memory** only (no database). Restarting the app clears users and notes.

## Features

- User registration & login (session-based)
- Per-user notes list
- Create, edit, and delete notes
- Simple server-rendered UI (EJS templates)

## Tech Stack

- Runtime: Node.js
- Web: Express, EJS
- Auth: `express-session` + `bcryptjs`
- Input handling: `body-parser`, `method-override`
- Basic XSS mitigation: `sanitizer`

## Getting Started

### Prerequisites

- Node.js and npm installed

### Install & run (local)

```bash
npm install
npm start
```

Then open:

- http://localhost:8000

The app listens on port `8000` by default.

## Configuration

Environment variables:

- `PORT` – HTTP port to listen on (default: `8000`)
- `SESSION_SECRET` – session signing secret (default: `dev-notes-secret-change-me`)

Example:

```bash
# macOS/Linux
export PORT=8000
export SESSION_SECRET="replace-me"
npm start
```

## Running with Docker

### Build & run

```bash
docker build -t notes-app .
docker run --rm -p 8000:8000 -e SESSION_SECRET="replace-me" notes-app
```

### Docker Compose

```bash
docker compose up --build
```

Then open http://localhost:8000


## Useful npm scripts

- `npm start` – start the server (`node app.js`)
- `npm test` – run tests (Mocha)
- `npm run sonar` – run Sonar scanner (if configured)

## Testing

```bash
npm test
```

## Notes on production readiness

This repository is intended for learning/demo:

- No persistent storage (use a database for real deployments)
- Default session secret is insecure (always set `SESSION_SECRET`)

## License

If you need licensing info, add a `LICENSE` file and reference it here.


