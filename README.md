# 📚 Esther's Bookshop & Reading Lounge

> **Online Ordering, Custom AI Photography & In-Store Pickup Web Application**

Esther's Bookshop is a modern, responsive web application for a boutique bookstore in Boston. Customers can browse curated book collections, filter by genre, view detailed book synopses, schedule an in-store pickup location and time slot, pay online or at the store, and receive an instant digital QR code pass for scan-and-go pickup.

---

## 🌟 Key Features

- **Gemini AI Photography**: Custom imagery generated for book covers, store hero banners, and interior reading lounges.
- **Interactive Catalog**: Live search, genre filtering (*Fiction, Sci-Fi, Mystery, Self-Help, Biography, Children's*), sorting by price or ratings, and stock status indicators.
- **In-Store Pickup Scheduling**: Choose store location (*Main St Flagship* vs *Downtown Annex*) and select pickup time slots.
- **Multiple Payment Options**: Simulated Credit/Debit card payment, Apple/Google Pay, or Pay at Store Counter.
- **Digital QR Pickup Pass**: Generates a dynamic QR code receipt saved in local storage under *My Passes*.
- **Mobile Responsive & Accessible**: Built with glassmorphism UI, smooth drawer navigation, and clean typography.
- **Vercel Hosting Ready**: Pre-configured with `vercel.json` for static deployment.

---

## 📁 Repository Structure

```
esthers-bookshop/
├── index.html              # Main HTML5 entry & React script loader
├── vercel.json             # Vercel deployment routing configuration
├── README.md               # Project documentation
├── .gitignore              # Git ignore file
├── src/
│   ├── app.js              # React application logic & state management
│   ├── index.css           # Styling, typography & animations
│   └── data/
│       ├── booksData.js    # Book catalog dataset
│       └── storesData.js   # Store locations & time slots
└── public/
    └── images/             # Gemini AI generated image assets
```

---

## 🚀 How to Run & Deploy

### Local Development
Open `index.html` directly in any web browser.

### Deploying to Vercel

#### Option A: Drag & Drop (Easiest)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Drag and drop the `esthers-bookshop` folder directly into Vercel.

#### Option B: GitHub Integration (Recommended)
1. Push this folder to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Esther's Bookshop"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/esthers-bookshop.git
   git push -u origin main
   ```
2. Import the repository on [Vercel](https://vercel.com) — Vercel will automatically detect `index.html` and deploy your live site!

---

## 📄 License
MIT License © 2026 Esther's Bookshop

