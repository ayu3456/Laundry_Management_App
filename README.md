# 🧺 University Laundry Management System

![Status](https://img.shields.io/badge/Status-Completed-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)

A responsive, full-stack web application designed to streamline student laundry services in university hostels. Includes role-based access control for Students and Admins, real-time status tracking, and secure data management.

## 🚀 Live Demo
**[Launch Application](https://laundry-app.onrender.com)** (Hosted on Render)

---

## ✨ Features

### 🎓 For Students
- **Secure Registration**: Sign up with University Roll Number and Hostel details.
- **Easy Drop-off**: Submit laundry requests with a simple form (Auto-calculated Return Date).
- **Validation**: Smart system prevents duplicate requests if one is already pending.
- **History Tracking**: View personal laundry history and status (Pending/Received).
- **Digital Mark-Off**: Confirm receipt of clothes securely.

### 🛡️ For Admins
- **Global Dashboard**: View laundry records for all students in one place.
- **Real-time Filters**: Quickly filter records by 'Pending' or 'Received' status.
- **Search**: Find specific student records by Roll Number.
- **Read-Only**: Secure oversight without altering student submissions.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (JSON Web Tokens), BCrypt (Password Hashing)
- **Deployment**: Render (Web Service)

---

## 💻 Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas Connection String)

### 1. Clone the Repository
```bash
git clone https://github.com/ayu3456/Laundry_Management_App.git
cd Laundry_Management_App
```

### 2. Setup Backend
```bash
cd server
npm install

# Create environment variables
echo "PORT=3000" > .env
echo "MONGODB_URI=mongodb://localhost:27017/laundry-app" >> .env
echo "JWT_SECRET=your_secret_key" >> .env

# Run Server
node src/index.js
```

### 3. Setup Frontend
Open a new terminal:
```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app!

---

## 🔑 Login Credentials

The application uses Role-Based Access Control.

**👨‍💼 Admin Access**
- **Email**: `admin@university.edu`
- **Password**: `adminpassword123`
*(Note: If running fresh info cloud, run `node server/seedAdmin.js` to create this user)*

**🧑‍🎓 Student Access**
- Register a new account via the "Register" link on the login page.

---

## 📂 Project Structure

```bash
Laundry_Management_App/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # ProtectedRoute, Layouts
│   │   ├── context/        # Auth Context Provider
│   │   ├── pages/          # Dashboard, Login, Register
│   │   └── ...
├── server/                 # Express Backend
│   ├── src/
│   │   ├── models/         # Mongoose User & Laundry Schemas
│   │   ├── routes/         # Auth & Laundry API endpoints
│   │   └── index.js        # Entry point
└── render-build.sh         # Deployment Build Script
```

---

## 🚀 Deployment

This project is configured for **Render**.
1. Connect your GitHub Repo to Render.
2. Use Build Command: `./render-build.sh`
3. Use Start Command: `cd server && node src/index.js`
4. Set Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`).

---

Made with ❤️ for efficiency.
