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






// Trust proxy for production (Render uses proxies)
app.set('trust proxy', 1);

// Cookie parser MUST be before session middleware
app.use(cookieParser())

// CORS configuration - tightened for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://pennthrift.netlify.app',
  'http://localhost:3000'
].filter(Boolean);

// CORS middleware with strict origin checking
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) only in development
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('No origin header in production'));
      }
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Session middleware - MUST be after cookieParser and CORS
const sessionStore = MongoStore.create({
  mongoUrl: process.env.DATABASE_ACCESS,
  collectionName: 'userSessions'
});

// Log session store errors
sessionStore.on('error', (error) => {
  console.error('=== SESSION STORE ERROR ===');
  console.error('Error:', error);
  console.error('===========================');
});

sessionStore.on('connected', () => {
  console.log('Session store connected to MongoDB');
});

app.use(session({
  name: 'user_sid',
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: true,  // Always true - Render uses HTTPS
    sameSite: 'none',  // Always 'none' for cross-domain cookies (Netlify ↔ Render)
    maxAge: 6 * 24 * 60 * 60 * 1000,
    path: '/',
    // Don't set domain explicitly - let browser handle it for cross-domain
    // domain: undefined means cookie is set for the request domain (Render)
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