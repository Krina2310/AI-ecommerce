# ShopAI – AI-Powered E-Commerce Website

A complete, production-quality e-commerce website with an AI-based recommendation engine built entirely with vanilla HTML, CSS, and JavaScript — no frameworks or build tools required.

## 🚀 Features

- **AI Recommendation Engine** with four recommendation strategies:
  - **Content-Based Filtering** – recommends products similar to what you're viewing (based on category, price, rating, shared tags)
  - **Collaborative Filtering** – recommends products based on your browsing history
  - **Trending Products** – surfaces the most viewed/purchased items
  - **Personalized Recommendations** – blends your preferences with popularity scores
- **User Behavior Tracking** – tracks product views, clicks, and cart additions to refine recommendations (stored in localStorage)
- **Smart Shopping Cart** – full cart management with quantity controls, discount codes, tax, and shipping calculations
- **Product Catalog** – 32 products across 5 categories with filtering, sorting, and search
- **Fully Responsive** – works on mobile, tablet, and desktop
- **Toast Notifications** – auto-dismissing feedback for user actions
- **No Backend Required** – runs entirely in the browser using localStorage

## 🛠 Technologies Used

- **HTML5** – Semantic markup
- **CSS3** – Custom properties, Flexbox, CSS Grid, animations
- **Vanilla JavaScript (ES5/ES6)** – All logic, no framework dependencies
- **Font Awesome 6** – Icons
- **Google Fonts (Inter)** – Typography
- **localStorage** – Persistent cart, history, and preferences

## ▶ How to Run

1. Clone or download this repository
2. Open `index.html` in any modern web browser — no build step needed

```bash
git clone https://github.com/Krina2310/AI-ecommerce.git
cd AI-ecommerce
open index.html   # macOS
# or: xdg-open index.html  (Linux)
# or double-click index.html in your file explorer
```

## 📁 Project Structure

```
AI-ecommerce/
├── index.html              # Home page with AI-personalized sections
├── products.html           # Full catalog with filters & sorting
├── product-detail.html     # Detail view with AI recommendations
├── cart.html               # Cart management with AI suggestions
├── checkout.html           # Multi-step checkout with form validation
├── profile.html            # User preferences and browsing history
├── search-results.html     # Search with AI-powered fallback suggestions
├── css/
│   ├── style.css           # Core styles, variables, components
│   ├── components.css      # Reusable UI components
│   └── responsive.css      # Media queries for all breakpoints
└── js/
    ├── products-data.js        # Product database (32 products, 5 categories)
    ├── utils.js                # Helper functions (formatting, toast, localStorage)
    ├── user-tracking.js        # Behavior tracking (views, clicks, cart events)
    ├── recommendation-engine.js # AI recommendation algorithms
    ├── cart-manager.js         # Cart CRUD, totals, discount codes
    └── main.js                 # App init, page routing, DOM rendering
```

## 🤖 AI Recommendation Details

### Content-Based Filtering
Computes a **similarity score (0–1)** between products using:
- Same category → +0.40
- Price within 20% → +0.20 (within 50% → +0.10)
- Rating within 0.5 stars → +0.15
- Shared tags (Jaccard-like) → up to +0.25

### Collaborative Filtering
Looks at the user's browsing history and aggregates related products and content-based matches from all previously viewed items, weighted by recency.

### Personalized Recommendations
Builds a preference profile from browsing history (categories, brands, tags, price range) and scores all unviewed products accordingly.

### Trending
Ranks products by a composite score: `viewCount + purchaseCount × 2`.

### localStorage Keys
| Key | Contents |
|-----|----------|
| `cartItems` | Array of `{ productId, quantity, addedAt }` |
| `browsingHistory` | Array of viewed product IDs (most recent first) |
| `viewedProducts` | Object keyed by productId with `{ views, lastViewed }` |
| `userPreferences` | Object with category/brand/tag scores and price range |
| `appliedDiscount` | Currently applied discount code |

## 🎨 Design System

| Variable | Value |
|----------|-------|
| `--primary` | `#6C63FF` (purple) |
| `--secondary` | `#FF6584` (pink) |
| `--accent` | `#43C6AC` (teal) |
| `--dark` | `#1a1a2e` |
| `--bg` | `#f8f9fa` |

## 🧪 Discount Codes (for testing)

| Code | Discount |
|------|----------|
| `SAVE10` | 10% off |
| `SAVE20` | 20% off |
| `FLAT15` | $15 off |
| `WELCOME` | 5% off |
