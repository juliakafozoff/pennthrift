# PennThrift Project Setup Information

## Project Overview
**PennThrift** is a full-stack marketplace application for University of Pennsylvania students to buy, sell, trade, and gift items. It's a complete MERN stack application with:
- **Web Client**: React 17.0.2 (Create React App)
- **Mobile App**: React Native/Expo (separate directory)
- **Backend Server**: Node.js/Express with MongoDB

## Tech Stack
- **Frontend**: React 17.0.2, React Router v6, TailwindCSS, Socket.io-client
- **Backend**: Node.js, Express 4.17.3, MongoDB/Mongoose 6.2.9
- **Authentication**: Passport.js with local strategy, bcrypt
- **Real-time**: Socket.io 4.5.0 for messaging
- **File Storage**: GridFS (MongoDB) via multer-gridfs-storage
- **Session Management**: express-session with MongoDB store

## Project Structure
```
PennThrift/
├── client/          # React web application
│   ├── src/
│   │   ├── pages/   # Login, Register, Store, Profile, Messages, etc.
│   │   ├── components/
│   │   └── api/     # ProfileAPI.js
│   └── package.json
├── server/          # Express backend
│   ├── models/      # User, Item, Message, Chat, Review, Request, Notification
│   ├── routes/      # auth, profile, items, messages, analytics, upload
│   ├── controllers/
│   ├── middleware/
│   └── server.js
├── mobile/          # React Native/Expo app (separate)
└── package.json     # Root (mainly for testing)
```

## Current Setup Status

### ✅ Completed
1. **Server dependencies**: Installed successfully (`server/node_modules` exists)
2. **Client dependencies**: Installed with `--legacy-peer-deps` flag due to React version conflicts
3. **Environment file**: `.env` file created in `server/` directory (needs MongoDB connection string)

### ⚠️ Known Issues
1. **Dependency Conflicts**: 
   - Root `package.json` has `enzyme-adapter-react-16` requiring React 16, but React 18 is installed
   - Client has `react-file-viewer@1.2.1` requiring React 16, but client uses React 17
   - **Solution**: Use `--legacy-peer-deps` flag for npm installs
   
2. **Security Vulnerabilities**: 
   - Server: 36 vulnerabilities (7 low, 8 moderate, 17 high, 4 critical)
   - Client: 84 vulnerabilities (older packages)
   - These are in dev dependencies and older packages - app should still run

## Required Environment Variables

The `.env` file is located at: `PennThrift/server/.env`

Required variables:
```env
DATABASE_ACCESS=mongodb://localhost:27017/pennthrift
# OR for MongoDB Atlas:
# DATABASE_ACCESS=mongodb+srv://username:password@cluster.mongodb.net/pennthrift

SECRET_KEY=your-secret-key-change-this-in-production
PORT=4000
WEBSITE=http://localhost
NODE_ENV=development
```

**Status**: `.env` file exists but needs `DATABASE_ACCESS` and `SECRET_KEY` to be updated with actual values.

## Ports & URLs
- **Client (React)**: `http://localhost:3000`
- **Server (Express)**: `http://localhost:4000`
- **Socket.io**: Connects to `http://localhost:4000/api/messages`
- **Client API Proxy**: Configured in `client/package.json` to proxy to `http://localhost:4000`

## How to Run

### Option 1: Run Both Together (Recommended)
```bash
cd /Users/juliakafozoff/Desktop/penn-thrift/PennThrift
npm run dev
```
This runs both server and client concurrently using the `dev` script.

### Option 2: Run Separately
**Terminal 1 - Server:**
```bash
cd /Users/juliakafozoff/Desktop/penn-thrift/PennThrift/server
npm start
```

**Terminal 2 - Client:**
```bash
cd /Users/juliakafozoff/Desktop/penn-thrift/PennThrift/client
npm start
```

## Prerequisites Needed
1. **MongoDB**: 
   - Local MongoDB instance running, OR
   - MongoDB Atlas account with connection string
   - Database name: `pennthrift` (or any name, update in `.env`)

2. **Node.js**: Already installed (v24.11.0 via nvm detected)

## Key Files to Know
- **Server entry**: `server/server.js`
- **Client entry**: `client/src/index.js` → `client/src/App.js`
- **Database config**: `server/db-config.js`
- **Passport config**: `server/passport-config.js`
- **API base URL**: Defined in `client/src/api/ProfileAPI.js` (uses proxy in dev)

## Features Implemented
- User authentication (register/login with Passport.js)
- Item listings (buy/sell/trade)
- Categories: Apparel, Books, Electronics, Furniture, Tickets, Vehicles, etc.
- Search and filtering
- User profiles
- Real-time messaging (Socket.io)
- Favorites system
- Analytics dashboard
- Image uploads (GridFS)

## Next Steps Needed
1. **Update `.env` file** with:
   - Valid MongoDB connection string
   - Strong secret key for sessions
   
2. **Ensure MongoDB is running** (local or Atlas accessible)

3. **Start the application** using one of the methods above

4. **Access the app** at `http://localhost:3000`

## Installation Commands Used
```bash
# Server (successful)
cd server && npm install

# Client (required --legacy-peer-deps)
cd client && npm install --legacy-peer-deps

# Root (optional, for tests only - has conflicts)
cd .. && npm install --legacy-peer-deps
```

## Current Working Directory
`/Users/juliakafozoff/Desktop/penn-thrift`

## Notes
- The project appears functionally complete
- Messages route is commented out in `server.js` but messaging works via Socket.io
- Test coverage exists but shows "Unknown%" (tests may not have been run)
- Mobile app exists but is separate (React Native/Expo)
- Project was previously deployed to Heroku (references in code)

