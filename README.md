# FakeBook

A full-stack social media application built from scratch. It features user authentication, image uploads for posts and profiles, post likes, comments, and friend requests.

## What it does

- **Authentication:** Users can register and log in securely via a server-side authentication pipeline built with Passport.js (Local Strategy) and password hashing.
- **Core Social Features:** Full CRUD operations allowing users to customize profiles, publish text posts with photo attachments, leave comments, and like content. Images are securely processed via Multer and stored in the cloud using Cloudinary.
- **Friend Pipeline:** A relational system that handles sending, tracking, and accepting or declining friend requests between users.
- **Database & Relations:** Uses a PostgreSQL relational database managed through Prisma ORM to track users, posts, comments, likes, and friendship statuses type-safely.

## Tech Stack

- **Backend:** Node.js, Express.js, Passport.js, Multer (for handling image uploads)
- **Database:** PostgreSQL, Prisma ORM
- **Frontend:** EJS (Embedded JavaScript templates), Tailwind CSS

## Local Setup

### 1. Database & Environment Setup

Make sure you have a PostgreSQL instance running locally. Create a `.env` file in the root directory of the project and add your connection string along with a session secret:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fakebook_db?schema=public"
SESSION_SECRET="your_custom_random_session_secret"
```

### 2. Install Dependencies

Run the installation command in your terminal to get all backend, template, and asset packages:

```bash
npm install
```

### 3. Start the Server

Launch the application locally. This script will automatically sync your Prisma database structures and boot up the Express server:

```bash
npm start
```

The application will now be running locally at `http://localhost:3000`.
