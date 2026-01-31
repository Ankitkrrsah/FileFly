# FileFly

Just a simple way to share files securely. Upload a file, get a code, share the code. That's it.


## How it works
1. **Upload**: Pick a file and we'll give you a 6-digit code.
2. **Share**: Send that code to someone.
3. **Receive**: They pop the code in and download the file.

Files expire in 10 minutes, so be quick!

## Stuff under the hood
I built this with a few solid tools to keep it fast and simple:
- **Node.js & Express** for the backend.
- **PostgreSQL** to keep track of the files.
- **Redis** to handle rate limiting (super important so the server doesn't crash).

Speaking of rate limiting, I've set it up so you can't go crazy with downloads. It's capped at **30 downloads per hour** per IP address. Just enough for normal use, but keeps the bots away.

## Running it locally

If you want to spin this up yourself, here's the drill:

**1. Prereqs**
Make sure you have Node, Postgres, and Redis installed.

**2. Setup the DB**
```bash
psql -d <your_database> -f backend/schema.sql
```

**3. Configure**
Add a `.env` file in `backend/`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
PORT=3001
```

**4. Go!**
Start Redis first (`redis-server`), then run the app:
```bash
cd backend
npm install
npm start
```

Head over to `http://localhost:3001` and try sending something.
