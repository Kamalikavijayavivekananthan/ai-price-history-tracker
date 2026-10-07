# SmartDeal AI — Project Documentation

## Abstract

**SmartDeal AI** is a full-stack MERN (MongoDB, Express, React, Node.js) web application that enables users to monitor product prices across major Indian e-commerce platforms (Amazon, Flipkart). It provides real-time price history tracking, AI-powered buy/wait predictions using linear regression, automated price drop alerts via email and in-app notifications, and a comprehensive admin panel for product management.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT (JSON Web Tokens) + bcryptjs |
| Email | Nodemailer (SMTP) |
| Scheduling | node-cron |
| AI/ML | Python scikit-learn (Linear Regression) with JS fallback |
| State Management | React Context API |
| HTTP Client | Axios |

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Dashboard │ │Product   │ │Wishlist/ │ │Admin     │ │
│  │+ Filters │ │Details   │ │Alerts    │ │Panel     │ │
│  └─────┬────┘ └─────┬────┘ └────┬─────┘ └────┬─────┘ │
│        └────────────┴───────────┴─────────────┘       │
│                   Axios (api.js)                       │
│            Authorization: Bearer <JWT>                 │
└────────────────────┬───────────────────────────────────┘
                     │ HTTP (localhost:5000)
┌────────────────────▼───────────────────────────────────┐
│               SERVER (Express.js)                      │
│                                                        │
│  /api/auth     ──► authController.js                   │
│  /api/products ──► productController.js                │
│  /api/wishlist ──► wishlistController.js               │
│  /api/alerts   ──► alertController.js                  │
│  /api/notifications ──► notificationController.js      │
│                                                        │
│  middleware/auth.js  (JWT verify + role guard)         │
│                                                        │
│  services/                                             │
│    aiService.js     ──► Python predict.py (or JS)      │
│    notificationService.js ──► Nodemailer SMTP          │
│    scraper.js       ──► Mock data generator            │
│                                                        │
│  cronjobs/priceCron.js  (every 12h via node-cron)      │
└────────────────────┬───────────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────▼───────────────────────────────────┐
│              DATABASE (MongoDB)                        │
│                                                        │
│  Collections:                                          │
│    users         products      pricehistories          │
│    wishlists     alerts        notifications           │
└────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────┐
│              AI MODULE (Python)                        │
│  ai/predict.py   ──► scikit-learn LinearRegression     │
│  ai/.venv/       ──► Virtual environment               │
│  (Node spawns Python process via child_process.spawn)  │
└────────────────────────────────────────────────────────┘
```

---

## ER Diagram

```
┌──────────────┐          ┌────────────────┐
│    USERS     │          │    PRODUCTS    │
│──────────────│          │────────────────│
│ _id (PK)     │          │ _id (PK)       │
│ name         │          │ title          │
│ email        │          │ description    │
│ password     │          │ url (unique)   │
│ role         │          │ imageUrl       │
│ createdAt    │          │ brand          │
└──────┬───────┘          │ category       │
       │                  │ currentPrice   │
       │                  │ originalPrice  │
       │ 1:N              │ lowestPriceEver│
       ▼                  │ highestPriceEver│
┌──────────────┐          │ dealScore      │
│   WISHLISTS  │          │ scrapeSource   │
│──────────────│          │ createdAt      │
│ _id (PK)     │    ┌────►└───────┬────────┘
│ userId (FK)  │    │             │ 1:N
│ productId(FK)├────┘             ▼
└──────────────┘          ┌────────────────┐
                          │  PRICEHISTORY  │
┌──────────────┐          │────────────────│
│    ALERTS    │          │ _id (PK)       │
│──────────────│          │ productId (FK) │
│ _id (PK)     │          │ price          │
│ userId (FK)  │          │ date           │
│ productId(FK)│          └────────────────┘
│ targetPrice  │
│ isTriggered  │
│ createdAt    │          ┌────────────────┐
└──────────────┘          │ NOTIFICATIONS  │
                          │────────────────│
                          │ _id (PK)       │
                          │ userId (FK)    │
                          │ title          │
                          │ message        │
                          │ isRead         │
                          │ createdAt      │
                          └────────────────┘
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login + get JWT |
| GET | `/api/auth/me` | Private | Get current user profile |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Public | Get all products (search/filter/sort) |
| GET | `/api/products/:id` | Public | Get product + price history |
| POST | `/api/products` | Private | Add new product to track |
| DELETE | `/api/products/:id` | Private | Delete product + history |
| GET | `/api/products/:id/predict` | Public | Get AI price prediction |
| POST | `/api/products/:id/price-update` | Public | Simulate price update |

### Wishlist
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist` | Private | Get user's wishlist |
| POST | `/api/wishlist` | Private | Add product to wishlist |
| DELETE | `/api/wishlist/:productId` | Private | Remove from wishlist |

### Alerts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/alerts` | Private | Get user's alerts |
| POST | `/api/alerts` | Private | Create price drop alert |
| DELETE | `/api/alerts/:id` | Private | Delete alert rule |
| POST | `/api/alerts/check` | Public | Trigger alert scan |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Private | Get user's notifications |
| PUT | `/api/notifications/:id/read` | Private | Mark notification read |
| PUT | `/api/notifications/read-all` | Private | Mark all notifications read |
| DELETE | `/api/notifications/:id` | Private | Delete notification |

### System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/trigger-cron` | Public | Manually run price update cycle |

---

## Deployment Guide

### Local Development

```bash
# 1. Start MongoDB locally
# Ensure MongoDB is running on port 27017

# 2. Start Backend
cd server
npm install
npm run dev        # runs on port 5000

# 3. Start Frontend
cd client
npm install
npm run dev        # runs on port 5173

# 4. Seed demo data (optional)
cd server
node seeder.js
```

### Environment Variables (server/.env)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/price_tracker
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development

# Optional: Email alerts (leave empty to use console simulation)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Production Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel — `npm run build` → deploy `/dist` |
| Backend | Render — connect to GitHub, set env vars |
| Database | MongoDB Atlas — update MONGO_URI in Render env |

---

## Key Features

1. **Real-time Price Tracking** — Monitor prices across Amazon & Flipkart
2. **Price History Chart** — Interactive Recharts AreaChart with lowest/highest reference lines
3. **AI Price Prediction** — Linear Regression model predicts 7-day price trend (Python + JS fallback)
4. **Target Price Alerts** — Email + in-app notifications when price hits your target
5. **Smart Deal Score** — 0–10 composite score based on discount % and proximity to historical low
6. **Wishlist** — Save and manage tracked products
7. **Admin Panel** — Add/delete products, monitor alerts
8. **Cron Job** — Automatic price simulation every 12 hours
9. **Dark Mode** — Full dark/light theme toggle
10. **Responsive Design** — Mobile-first with hamburger menu

---

## Project Structure

```
MERN PROJECT PRICE/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Navbar, ProductCard, PriceChart
│   │   ├── context/         # AuthContext (JWT + notifications)
│   │   ├── pages/           # Dashboard, ProductDetails, Login, Register, Wishlist, AdminPanel
│   │   └── services/        # api.js (Axios instance)
│   └── index.html
│
├── server/                  # Express backend
│   ├── config/              # MongoDB connection
│   ├── controllers/         # Auth, Product, Wishlist, Alert, Notification
│   ├── cronjobs/            # priceCron.js (node-cron)
│   ├── middleware/          # auth.js (JWT protect + authorize)
│   ├── models/              # User, Product, PriceHistory, Alert, Notification, Wishlist
│   ├── routes/              # All Express route definitions
│   ├── services/            # aiService.js, notificationService.js, scraper.js
│   └── server.js            # Entry point
│
└── ai/                      # Python ML module
    ├── predict.py            # scikit-learn LinearRegression
    └── requirements.txt      # numpy, scikit-learn, pandas
```
