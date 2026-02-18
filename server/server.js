// Load environment variables FIRST, before any imports that depend on them
require('dotenv').config();

const express       = require('express');
const passport      = require('passport');
const bcrypt        = require('bcrypt');
const cookieParser  = require('cookie-parser');
const authRoutes    = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const itemRoutes    = require('./routes/items');
const messageRoutes = require('./routes/messages');
const analyticsRoutes    = require('./routes/analytics');
const cors          = require('cors');
const app           = express();
const User          = require('./models/user.model');
const session       = require('express-session');
const MongoStore    = require('connect-mongo');
const mongoose      = require('mongoose');
const connection    = require('./db-config');
const upload        = require('./routes/upload');
const { Server }    = require('socket.io')
const initializePassport = require('./passport-config');






app.use(cookieParser())

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://pennthrift.netlify.app',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development, restrict in production if needed
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



//app sessions

app.use(session({
  name: 'user_sid',
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_ACCESS,
    collectionName: 'userSessions'
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 6 * 24 * 60 * 60 * 1000
  }
}));





app.use(express.urlencoded({ extended: true }));

app.use(express.json());

//Passport

initializePassport(passport, username => {
    User.find(user => user.username === username)
});

app.use(passport.initialize());
app.use(passport.session());

//root route
app.get('/', (req, res) => res.status(200).send('PennThrift API running'));

//health check endpoint
app.get('/api/health', (req, res) => res.json({ ok: true }));







//routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/file', upload);
app.use('/api/analytics', analyticsRoutes);
//app.use('/api/messages', messageRoutes)


//initialization variables
const PORT = process.env.PORT || 4000;
const website   = process.env.WEBSITE || 'http://localhost';
const server  = require('http').Server(app);







//socket.io inititializtion for messages
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS']
  }
});
require('./routes/messages')(io);


//start server
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));