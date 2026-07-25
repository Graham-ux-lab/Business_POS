# Business POS System

A modern, enterprise-grade Point of Sale and Inventory Management System.

## Tech Stack
- Frontend: React 18, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MySQL
- Desktop: Electron.js

## Setup Instructions

1. Install server dependencies:
   cd server && npm install

2. Set up database:
   mysql -u root -p < ../database/schema.sql

3. Install client:
   cd ../client && npx create-react-app . && npm install react-router-dom axios recharts react-icons react-hot-toast

4. Start servers:
   Terminal 1: cd server && npm run dev
   Terminal 2: cd client && npm start
