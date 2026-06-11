# Movie Quiz — Frontend

This is the React app people actually see and click around in. You browse movies,
take a quiz on the ones you've seen, save a watchlist, add friends, and try to
climb the leaderboard. Admins get their own dashboard for managing users and
writing quiz questions.

**Live version:** https://moviequiz-liart.vercel.app

It's a Create React App project that leans on a few well-worn tools rather than
anything fancy — React Router for pages, Axios for talking to the API, and React's
Context API for the bits of state that need to be shared (who's logged in, what's
in the watchlist, the current search). Everything the app needs — including movie
data — comes from the backend, so there are no API keys hiding in here.

> Heads up: this app doesn't do much on its own. It needs the **Movie Quiz
> backend** running somewhere it can reach, otherwise logins and movies won't load.

---

## What it can do

- **Accounts** — register, log in with a username *or* email, and reset a forgotten
  password.
- **Browse** — a homepage of movie carousels (Top Rated, Now Playing, Popular,
  Upcoming), category pages that load more as you scroll, and detail pages with
  trailers and cast.
- **Search** — type and it searches (debounced so it's not firing on every keystroke).
- **Quizzes** — answer questions about a movie with instant feedback, on a timer.
  Each quiz is one attempt, and the scoring happens on the server so it can't be
  gamed.
- **Watchlist** — save movies and they stick around for next time.
- **Friends** — find people, send requests, accept or decline, and peek at friends'
  profiles.
- **Leaderboards** — global standings and per-movie standings.
- **Admin** — a separate dashboard to manage users (roles, removals) and create or
  edit quiz questions, with a movie picker wired up to search.

There's also a route guard for logged-in vs. admin pages, an error boundary so one
broken component doesn't nuke the whole app, and a proper 404 page.

---

## How it's organized

```
src/
├── App.jsx              → all the routes and which ones need a login
├── api/apiService.jsx   → the Axios setup (adds your token, handles 401s/timeouts)
├── contexts/            → Auth, Watchlist, and Search state
├── components/          → Header, movie cards/lists/carousels, guards, error boundary
└── pages/               → Home, Category, MovieDetails, Quiz, Leaderboard,
                           Profile, Watchlist, Admin, Login, Register, etc.
```

A couple of things worth knowing:

- **`api/apiService.jsx`** is the single Axios instance everything uses. It quietly
  attaches your login token to each request, and if the server ever says "401
  unauthorized," it clears your session and bounces you to the login page.
- **The three contexts** wrap the whole app in `App.jsx` — `AuthContext` remembers
  who you are (and survives a refresh via `localStorage`), `WatchlistContext` keeps
  your saved movies in sync with the server, and `SearchContext` shares the search
  box value across pages.

### The pages, and who can see them

| Path                     | Who          |
| ------------------------ | ------------ |
| `/`, `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/category/:type` | anyone |
| `/profile`, `/profile/:userId`, `/watchlist`, `/quiz/:imdbID`, `/movie/:imdbID`, `/leaderboard` | logged in |
| `/admin`                 | admins only  |
| anything else            | 404 page     |

---

## Running it

You'll need **Node 16+** and the backend running somewhere (locally that's
`http://localhost:3001` by default).

```bash
npm install
cp .env.example .env     # then point it at your backend
npm start
```

That opens the app on **http://localhost:3000**.

One gotcha that trips everyone up at least once: Create React App only reads `.env`
**when it starts**. If you change a variable, stop and restart `npm start` — it
won't pick it up otherwise.

### The .env file

Just one variable, and it's git-ignored:

| Variable            | What it's for                                   |
| ------------------- | ----------------------------------------------- |
| `REACT_APP_API_URL` | Where the backend lives (e.g. `http://localhost:3001`, or your deployed URL) |

No TMDB key lives here — the movies come through the backend, so the key stays on
the server where it belongs.

---

## Scripts

| Command         | Does what                          |
| --------------- | ---------------------------------- |
| `npm start`     | Dev server on port 3000            |
| `npm run build` | Production build into `build/`     |
| `npm test`      | Run the tests                      |

---

## When movies won't load

If you deploy this and the homepage is empty, it's almost always one of two things,
and they're easy to check:

1. The backend isn't actually deployed or reachable, or
2. `REACT_APP_API_URL` is still pointing at `localhost` instead of your live backend.

Also make sure the backend's `FRONTEND_URL` is set to this app's address, or CORS
will quietly block every request.

---

## Deploying

This one's on **Vercel**. To put up your own copy: import the repo (Vercel detects
Create React App automatically), set `REACT_APP_API_URL` to your backend's URL in
the project's environment variables, and deploy. Just remember that changing an env
var means you need to redeploy for it to take effect.
