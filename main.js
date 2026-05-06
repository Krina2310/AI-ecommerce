(function() {
  'use strict';

  function init() {
    renderHeader();
    initLogout();
    updateCartCount();
    initSearch();
    initMobileMenu();

    // Page-specific initialization
    var page = _detectPage();
    if (page === 'index') initIndexPage();
    else if (page === 'products') initProductsPage();
    else if (page === 'product-detail') initProductDetailPage();
    else if (page === 'cart') initCartPage();
    else if (page === 'checkout') initCheckoutPage();
    else if (page === 'profile') initProfilePage();
    else if (page === 'search-results') initSearchResultsPage();
  }

  function _detectPage() {
    var path = window.location.pathname;
    if (path.includes('products.html')) return 'products';
    if (path.includes('product-detail.html')) return 'product-detail';
    if (path.includes('cart.html')) return 'cart';
    if (path.includes('checkout.html')) return 'checkout';
    if (path.includes('profile.html')) return 'profile';
    if (path.includes('search-results.html')) return 'search-results';
    if (path.includes('login.html') || path.includes('register.html')) return 'auth';
    return 'index';
  }

  function renderHeader() {
    var header = document.getElementById('main-header');
    if (!header) return;
    var cartCount = window.CartManager ? window.CartManager.getCartCount() : 0;
    var session = (function() {
      try { var s = localStorage.getItem('shopai_session'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
    }());
    var authLinks = session
      ? '<a href="profile.html"><i class="fas fa-user-circle"></i> ' + ((session.name || 'Account').split(' ')[0]) + '</a>' +
        '<a href="#" id="logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a>'
      : '<a href="login.html"><i class="fas fa-sign-in-alt"></i> Login</a>' +
        '<a href="register.html"><i class="fas fa-user-plus"></i> Register</a>';
    header.innerHTML =
      '<div class="header-inner container">' +
        '<a href="index.html" class="logo">' +
          '<i class="fas fa-robot"></i> ShopAI' +
        '</a>' +
        '<nav class="nav-links" id="nav-links">' +
          '<a href="index.html"><i class="fas fa-home"></i> Home</a>' +
          '<a href="products.html"><i class="fas fa-th-large"></i> Products</a>' +
          '<a href="profile.html"><i class="fas fa-user"></i> Profile</a>' +
          '<a href="cart.html" class="cart-link">' +
            '<i class="fas fa-shopping-cart"></i> Cart' +
            '<span class="cart-badge" id="cart-count">' + (cartCount > 0 ? cartCount : '') + '</span>' +
          '</a>' +
          authLinks +
        '</nav>' +
        '<div class="header-actions">' +
          '<button class="btn-icon search-toggle" id="search-toggle" aria-label="Search">' +
            '<i class="fas fa-search"></i>' +
          '</button>' +
          '<button class="btn-icon mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Menu">' +
            '<i class="fas fa-bars"></i>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="search-bar-dropdown" id="search-bar-dropdown">' +
        '<div class="container">' +
          '<form class="header-search-form" id="header-search-form" action="search-results.html" method="get">' +
            '<input type="text" name="q" id="header-search-input" placeholder="Search products, brands, categories..." autocomplete="off">' +
            '<button type="submit" class="btn btn-primary"><i class="fas fa-search"></i></button>' +
          '</form>' +
          '<div class="search-suggestions" id="search-suggestions"></div>' +
        '</div>' +
      '</div>';
  }

  function initLogout() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('#logout-link');
      if (!link) return;
      e.preventDefault();
      try { localStorage.removeItem('shopai_session'); } catch(err) {}
      window.location.href = 'login.html';
    });
  }

  function updateCartCount() {
    var badge = document.getElementById('cart-count');
    if (!badge) return;
    var count = window.CartManager ? window.CartManager.getCartCount() : 0;
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  function initSearch() {
    document.addEventListener('click', function(e) {
      var toggle = document.getElementById('search-toggle');
      var dropdown = document.getElementById('search-bar-dropdown');
      if (!toggle || !dropdown) return;

      if (toggle.contains(e.target)) {
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) {
          var input = document.getElementById('header-search-input');
          if (input) input.focus();
        }
      } else if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    // Live suggestions
    var input = document.getElementById('header-search-input');
    var suggestionsBox = document.getElementById('search-suggestions');
    if (input && suggestionsBox && window.Utils) {
      var debouncedSearch = window.Utils.debounce(function() {
        var q = input.value.trim();
        if (q.length < 2) { suggestionsBox.innerHTML = ''; return; }
        var results = window.searchProducts ? window.searchProducts(q) : [];
        suggestionsBox.innerHTML = '';
        results.slice(0, 5).forEach(function(p) {
          var item = document.createElement('a');
          item.href = 'product-detail.html?id=' + p.id;
          item.className = 'suggestion-item';
          item.innerHTML = '<img src="' + p.image + '" alt="' + p.name + '"><span>' + p.name + '</span><span class="suggestion-price">' + window.Utils.formatPrice(p.price) + '</span>';
          suggestionsBox.appendChild(item);
        });
        if (results.length > 5) {
          var more = document.createElement('a');
          more.href = 'search-results.html?q=' + encodeURIComponent(q);
          more.className = 'suggestion-more';
          more.textContent = 'See all ' + results.length + ' results';
          suggestionsBox.appendChild(more);
        }
      }, 300);
      input.addEventListener('input', debouncedSearch);
    }
  }

  function initMobileMenu() {
    document.addEventListener('click', function(e) {
      var toggle = document.getElementById('mobile-menu-toggle');
      var nav = document.getElementById('nav-links');
      if (!toggle || !nav) return;
      if (toggle.contains(e.target)) {
        nav.classList.toggle('mobile-open');
        var icon = toggle.querySelector('i');
        if (icon) {
          icon.className = nav.classList.contains('mobile-open') ? 'fas fa-times' : 'fas fa-bars';
        }
      } else if (!nav.contains(e.target)) {
        nav.classList.remove('mobile-open');
        var icon2 = toggle ? toggle.querySelector('i') : null;
        if (icon2) icon2.className = 'fas fa-bars';
      }
    });
  }

  // ---- PAGE INITS ----

  function initIndexPage() {
    var recs = window.RecommendationEngine.getAllRecommendations({});

    window.Utils.renderProductCards('personalized-grid', recs.personalized, true);
    window.Utils.renderProductCards('trending-grid', recs.trending, false);
    window.Utils.renderProductCards('new-arrivals-grid', recs.newArrivals, false);
  }

  function initProductsPage() {
    var allProducts = window.productsData.slice();
    var filtered = allProducts.slice();
    var displayCount = 12;

    var params = new URLSearchParams(window.location.search);
    var catParam = params.get('category');

    // Populate brand filter
    var brandFilterContainer = document.getElementById('brand-filter-list');
    if (brandFilterContainer) {
      var brands = window.getBrands();
      brandFilterContainer.innerHTML = brands.map(function(b) {
        return '<label class="filter-checkbox"><input type="checkbox" name="brand" value="' + b + '">' + b + '</label>';
      }).join('');
    }

    // Set category checkbox if param
    if (catParam) {
      var catCheckbox = document.querySelector('input[name="category"][value="' + catParam + '"]');
      if (catCheckbox) catCheckbox.checked = true;
    }

    function applyFilters() {
      var checkedCats = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(function(i) { return i.value; });
      var checkedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(function(i) { return i.value; });
      var minPrice = parseFloat(document.getElementById('min-price') ? document.getElementById('min-price').value : 0) || 0;
      var maxPrice = parseFloat(document.getElementById('max-price') ? document.getElementById('max-price').value : 9999) || 9999;
      var minRating = parseFloat(document.querySelector('input[name="rating"]:checked') ? document.querySelector('input[name="rating"]:checked').value : 0) || 0;
      var sortVal = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'popular';
      var searchVal = document.getElementById('products-search') ? document.getElementById('products-search').value.toLowerCase().trim() : '';

      filtered = allProducts.filter(function(p) {
        if (checkedCats.length && checkedCats.indexOf(p.category) === -1) return false;
        if (checkedBrands.length && checkedBrands.indexOf(p.brand) === -1) return false;
        if (p.price < minPrice || p.price > maxPrice) return false;
        if (p.rating < minRating) return false;
        if (searchVal && !p.name.toLowerCase().includes(searchVal) && !p.category.toLowerCase().includes(searchVal) && !p.brand.toLowerCase().includes(searchVal)) return false;
        return true;
      });

      if (sortVal === 'price-asc') filtered.sort(function(a, b) { return a.price - b.price; });
      else if (sortVal === 'price-desc') filtered.sort(function(a, b) { return b.price - a.price; });
      else if (sortVal === 'rating') filtered.sort(function(a, b) { return b.rating - a.rating; });
      else if (sortVal === 'newest') filtered.sort(function(a, b) { return b.id - a.id; });
      else filtered.sort(function(a, b) { return (b.viewCount + b.purchaseCount * 2) - (a.viewCount + a.purchaseCount * 2); });

      displayCount = 12;
      renderProducts();
    }

    function renderProducts() {
      var grid = document.getElementById('products-grid');
      if (!grid) return;
      var toShow = filtered.slice(0, displayCount);
      grid.innerHTML = '';
      if (toShow.length === 0) {
        grid.innerHTML = '<div class="no-results-full"><i class="fas fa-search"></i><p>No products match your filters.</p></div>';
      } else {
        toShow.forEach(function(p) {
          grid.appendChild(window.Utils.createProductCard(p, false));
        });
      }
      var resultCount = document.getElementById('result-count');
      if (resultCount) resultCount.textContent = filtered.length + ' products';
      var loadMoreBtn = document.getElementById('load-more-btn');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = displayCount < filtered.length ? 'block' : 'none';
      }
    }

    // Attach filter events
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(function(el) {
      el.addEventListener('change', applyFilters);
    });
    ['min-price', 'max-price'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', window.Utils.debounce(applyFilters, 400));
    });
    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
    var searchInput = document.getElementById('products-search');
    if (searchInput) searchInput.addEventListener('input', window.Utils.debounce(applyFilters, 300));

    var loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        displayCount += 12;
        renderProducts();
      });
    }

    applyFilters();
  }

  function initProductDetailPage() {
    var params = new URLSearchParams(window.location.search);
    var productId = parseInt(params.get('id'));
    var product = window.getProductById(productId);

    if (!product) {
      document.getElementById('product-detail-container').innerHTML = '<div class="no-results-full"><i class="fas fa-exclamation-circle"></i><p>Product not found.</p><a href="products.html" class="btn btn-primary">Browse Products</a></div>';
      return;
    }

    // Track view
    if (window.UserTracking) window.UserTracking.trackProductView(productId);

    // Update breadcrumb
    var breadcrumb = document.getElementById('product-breadcrumb');
    if (breadcrumb) {
      breadcrumb.innerHTML = '<a href="index.html">Home</a> <i class="fas fa-chevron-right"></i> <a href="products.html?category=' + encodeURIComponent(product.category) + '">' + product.category + '</a> <i class="fas fa-chevron-right"></i> <span>' + product.name + '</span>';
    }

    // Populate product detail
    var container = document.getElementById('product-detail-container');
    if (container) {
      container.innerHTML =
        '<div class="product-detail-image">' +
          '<img src="' + product.image + '" alt="' + product.name + '" id="main-product-image">' +
        '</div>' +
        '<div class="product-detail-info">' +
          '<span class="product-category-badge">' + product.category + '</span>' +
          '<h1 class="product-detail-name">' + product.name + '</h1>' +
          '<p class="product-brand"><i class="fas fa-tag"></i> ' + product.brand + '</p>' +
          '<div class="product-detail-rating">' +
            '<div class="stars">' + window.Utils.renderStars(product.rating) + '</div>' +
            '<span>' + product.rating + ' (' + product.reviews.toLocaleString() + ' reviews)</span>' +
          '</div>' +
          '<div class="product-detail-price">' + window.Utils.formatPrice(product.price) + '</div>' +
          '<div class="product-stock ' + (product.inStock ? 'in-stock' : 'out-of-stock') + '">' +
            '<i class="fas ' + (product.inStock ? 'fa-check-circle' : 'fa-times-circle') + '"></i> ' +
            (product.inStock ? 'In Stock (' + product.stock + ' available)' : 'Out of Stock') +
          '</div>' +
          '<p class="product-description">' + product.description + '</p>' +
          '<div class="product-tags">' +
            product.tags.map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('') +
          '</div>' +
          '<div class="product-actions">' +
            '<div class="quantity-selector">' +
              '<button class="qty-btn" id="qty-minus"><i class="fas fa-minus"></i></button>' +
              '<input type="number" id="qty-input" value="1" min="1" max="' + product.stock + '">' +
              '<button class="qty-btn" id="qty-plus"><i class="fas fa-plus"></i></button>' +
            '</div>' +
            '<button class="btn btn-primary btn-lg" id="add-to-cart-main"' + (!product.inStock ? ' disabled' : '') + '>' +
              '<i class="fas fa-cart-plus"></i> Add to Cart' +
            '</button>' +
          '</div>' +
        '</div>';

      // Quantity controls
      var qtyInput = document.getElementById('qty-input');
      document.getElementById('qty-minus').addEventListener('click', function() {
        var v = parseInt(qtyInput.value);
        if (v > 1) qtyInput.value = v - 1;
      });
      document.getElementById('qty-plus').addEventListener('click', function() {
        var v = parseInt(qtyInput.value);
        if (v < product.stock) qtyInput.value = v + 1;
      });

      document.getElementById('add-to-cart-main').addEventListener('click', function() {
        var qty = parseInt(qtyInput.value) || 1;
        var result = window.CartManager.addToCart(productId, qty);
        window.Utils.showToast(result.message, result.success ? 'success' : 'error');
        updateCartCount();
      });
    }

    // Load AI recommendations
    var boughtTogether = window.RecommendationEngine.getFrequentlyBoughtTogether(productId, 3);
    window.Utils.renderProductCards('bought-together-grid', boughtTogether, true);

    var similar = window.RecommendationEngine.getContentBasedRecommendations(productId, 4);
    window.Utils.renderProductCards('similar-products-grid', similar, true);

    // Sample reviews
    _renderSampleReviews(product);
  }

  function _renderSampleReviews(product) {
    var container = document.getElementById('reviews-container');
    if (!container) return;
    var reviewsData = [
      { author: 'Alex M.', rating: 5, date: '2024-11-15', text: 'Absolutely love this product! Exceeded my expectations in every way. Would highly recommend to anyone looking for quality.' },
      { author: 'Sarah K.', rating: 4, date: '2024-10-28', text: 'Great product overall. Delivery was fast and packaging was secure. Minor issues with the setup but nothing deal-breaking.' },
      { author: 'David R.', rating: 5, date: '2024-10-10', text: 'Outstanding quality and value for money. I\'ve been using it daily for weeks and it still performs perfectly.' },
      { author: 'Emma L.', rating: 4, date: '2024-09-22', text: 'Really happy with my purchase. The quality is excellent and it looks exactly like the photos. Fast shipping too!' }
    ];
    container.innerHTML = reviewsData.map(function(r) {
      return '<div class="review-card">' +
        '<div class="review-header">' +
          '<span class="review-author">' + r.author + '</span>' +
          '<div class="stars">' + window.Utils.renderStars(r.rating) + '</div>' +
          '<span class="review-date">' + window.Utils.formatDate(r.date) + '</span>' +
        '</div>' +
        '<p class="review-text">' + r.text + '</p>' +
      '</div>';
    }).join('');
  }

  function initCartPage() {
    renderCartPage();
  }

  function renderCartPage() {
    var items = window.CartManager.getCartItems();
    var cartContent = document.getElementById('cart-items-container');
    var emptyCart = document.getElementById('empty-cart');
    var cartWithItems = document.getElementById('cart-with-items');

    if (!cartContent) return;

    if (items.length === 0) {
      if (emptyCart) emptyCart.style.display = 'flex';
      if (cartWithItems) cartWithItems.style.display = 'none';
      return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    if (cartWithItems) cartWithItems.style.display = 'grid';

    cartContent.innerHTML = items.map(function(item) {
      return '<div class="cart-item" data-id="' + item.productId + '">' +
        '<img src="' + item.product.image + '" alt="' + item.product.name + '" class="cart-item-image">' +
        '<div class="cart-item-details">' +
          '<h3><a href="product-detail.html?id=' + item.productId + '">' + item.product.name + '</a></h3>' +
          '<p class="cart-item-brand">' + item.product.brand + '</p>' +
          '<p class="cart-item-price">' + window.Utils.formatPrice(item.product.price) + '</p>' +
        '</div>' +
        '<div class="cart-item-controls">' +
          '<div class="quantity-selector">' +
            '<button class="qty-btn cart-qty-minus" data-id="' + item.productId + '"><i class="fas fa-minus"></i></button>' +
            '<input type="number" class="cart-qty-input" value="' + item.quantity + '" min="1" max="' + item.product.stock + '" data-id="' + item.productId + '">' +
            '<button class="qty-btn cart-qty-plus" data-id="' + item.productId + '"><i class="fas fa-plus"></i></button>' +
          '</div>' +
          '<span class="cart-item-subtotal">' + window.Utils.formatPrice(item.product.price * item.quantity) + '</span>' +
          '<button class="btn-icon remove-cart-item" data-id="' + item.productId + '"><i class="fas fa-trash"></i></button>' +
        '</div>' +
      '</div>';
    }).join('');

    updateOrderSummary();
    attachCartEvents();

    // AI recommendations based on cart
    var cartProductIds = items.map(function(i) { return i.productId; });
    var alsoViewed = [];
    cartProductIds.forEach(function(id) {
      window.RecommendationEngine.getFrequentlyBoughtTogether(id, 3).forEach(function(p) {
        if (cartProductIds.indexOf(p.id) === -1 && alsoViewed.findIndex(function(x) { return x.id === p.id; }) === -1) {
          alsoViewed.push(p);
        }
      });
    });
    window.Utils.renderProductCards('also-bought-grid', alsoViewed.slice(0, 4), true);
  }

  function updateOrderSummary() {
    var totals = window.CartManager.getCartTotal();
    var els = {
      'summary-subtotal': window.Utils.formatPrice(totals.subtotal),
      'summary-discount': totals.discountAmount > 0 ? '-' + window.Utils.formatPrice(totals.discountAmount) : '--',
      'summary-tax': window.Utils.formatPrice(totals.tax),
      'summary-shipping': totals.shipping === 0 ? 'FREE' : window.Utils.formatPrice(totals.shipping),
      'summary-total': window.Utils.formatPrice(totals.total)
    };
    Object.keys(els).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = els[id];
    });
    var discountRow = document.getElementById('discount-row');
    if (discountRow) discountRow.style.display = totals.discountAmount > 0 ? 'flex' : 'none';
    var discountLabel = document.getElementById('discount-label');
    if (discountLabel && totals.discountLabel) discountLabel.textContent = totals.discountLabel;
  }

  function attachCartEvents() {
    document.querySelectorAll('.cart-qty-minus').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(btn.getAttribute('data-id'));
        var input = document.querySelector('.cart-qty-input[data-id="' + id + '"]');
        var newVal = Math.max(1, parseInt(input.value) - 1);
        window.CartManager.updateQuantity(id, newVal);
        renderCartPage();
        updateCartCount();
      });
    });

    document.querySelectorAll('.cart-qty-plus').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(btn.getAttribute('data-id'));
        var input = document.querySelector('.cart-qty-input[data-id="' + id + '"]');
        var product = window.getProductById(id);
        var newVal = Math.min(product ? product.stock : 99, parseInt(input.value) + 1);
        window.CartManager.updateQuantity(id, newVal);
        renderCartPage();
        updateCartCount();
      });
    });

    document.querySelectorAll('.cart-qty-input').forEach(function(input) {
      input.addEventListener('change', function() {
        var id = parseInt(input.getAttribute('data-id'));
        window.CartManager.updateQuantity(id, parseInt(input.value) || 1);
        renderCartPage();
        updateCartCount();
      });
    });

    document.querySelectorAll('.remove-cart-item').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(btn.getAttribute('data-id'));
        window.CartManager.removeFromCart(id);
        window.Utils.showToast('Item removed from cart.', 'info');
        renderCartPage();
        updateCartCount();
      });
    });

    var applyBtn = document.getElementById('apply-discount-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', function() {
        var code = document.getElementById('discount-input').value;
        var result = window.CartManager.applyDiscount(code);
        window.Utils.showToast(result.message, result.success ? 'success' : 'error');
        if (result.success) updateOrderSummary();
      });
    }
  }

  function initCheckoutPage() {
    // Populate order summary
    var items = window.CartManager.getCartItems();
    var totals = window.CartManager.getCartTotal();
    var summaryList = document.getElementById('checkout-items-list');
    if (summaryList) {
      summaryList.innerHTML = items.map(function(item) {
        return '<div class="checkout-item">' +
          '<img src="' + item.product.image + '" alt="' + item.product.name + '">' +
          '<div><span>' + item.product.name + '</span><span>x' + item.quantity + '</span></div>' +
          '<span>' + window.Utils.formatPrice(item.product.price * item.quantity) + '</span>' +
        '</div>';
      }).join('') || '<p class="empty-cart-msg">Your cart is empty.</p>';
    }
    ['co-subtotal', 'co-tax', 'co-total'].forEach(function(id, i) {
      var el = document.getElementById(id);
      if (el) el.textContent = window.Utils.formatPrice([totals.subtotal, totals.tax, totals.total][i]);
    });

    // Payment method toggle
    var paymentMethods = document.querySelectorAll('input[name="payment"]');
    var cardFields = document.getElementById('card-fields');
    paymentMethods.forEach(function(radio) {
      radio.addEventListener('change', function() {
        if (cardFields) cardFields.style.display = radio.value === 'card' ? 'block' : 'none';
      });
    });

    // Form submission
    var checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (_validateCheckoutForm()) {
          _placeOrder();
        }
      });
    }
  }

  function _validateCheckoutForm() {
    var valid = true;
    var requiredFields = ['co-name', 'co-email', 'co-phone', 'co-address', 'co-city', 'co-state', 'co-zip'];
    requiredFields.forEach(function(id) {
      var el = document.getElementById(id);
      var err = document.getElementById(id + '-error');
      if (el && !el.value.trim()) {
        if (err) err.textContent = 'This field is required.';
        el.classList.add('input-error');
        valid = false;
      } else if (el) {
        if (err) err.textContent = '';
        el.classList.remove('input-error');
      }
    });

    var email = document.getElementById('co-email');
    var emailErr = document.getElementById('co-email-error');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      if (emailErr) emailErr.textContent = 'Enter a valid email address.';
      email.classList.add('input-error');
      valid = false;
    }

    var paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (paymentMethod && paymentMethod.value === 'card') {
      var cardFields = ['co-card-number', 'co-card-expiry', 'co-card-cvv'];
      cardFields.forEach(function(id) {
        var el = document.getElementById(id);
        var err = document.getElementById(id + '-error');
        if (el && !el.value.trim()) {
          if (err) err.textContent = 'Required for card payment.';
          el.classList.add('input-error');
          valid = false;
        } else if (el) {
          if (err) err.textContent = '';
          el.classList.remove('input-error');
        }
      });
    }

    return valid;
  }

  function _placeOrder() {
    var orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();
    window.CartManager.clearCart();
    updateCartCount();

    var modal = document.getElementById('order-success-modal');
    var orderNumEl = document.getElementById('order-number');
    if (orderNumEl) orderNumEl.textContent = orderNumber;
    if (modal) modal.classList.add('active');
  }

  function initProfilePage() {
    // Browsing history
    var history = window.UserTracking.getBrowsingHistory();
    var historyProducts = history.slice(0, 8).map(window.getProductById).filter(Boolean);
    window.Utils.renderProductCards('browsing-history-grid', historyProducts, false);

    // Personalized recommendations
    var personalized = window.RecommendationEngine.getPersonalizedRecommendations(4);
    window.Utils.renderProductCards('profile-recs-grid', personalized, true);

    // User preferences display
    var prefs = window.UserTracking.getUserPreferences();
    var prefsContainer = document.getElementById('user-prefs-container');
    if (prefsContainer) {
      var topCats = prefs.topCategories ? prefs.topCategories.slice(0, 3) : [];
      var topTags = prefs.topTags ? prefs.topTags.slice(0, 5) : [];
      prefsContainer.innerHTML =
        '<div class="pref-section">' +
          '<h4>Favourite Categories</h4>' +
          (topCats.length ? topCats.map(function(c) { return '<span class="tag">' + c + '</span>'; }).join('') : '<p class="muted">Browse more products to see your preferences.</p>') +
        '</div>' +
        '<div class="pref-section">' +
          '<h4>Interests</h4>' +
          (topTags.length ? topTags.map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('') : '<p class="muted">Browse more products to see your preferences.</p>') +
        '</div>';
    }

    // Sample order history
    _renderSampleOrders();

    // Clear history button
    var clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your browsing history and preferences?')) {
          window.UserTracking.clearHistory();
          window.Utils.showToast('History cleared.', 'info');
          setTimeout(function() { location.reload(); }, 800);
        }
      });
    }

    // Stats
    var viewedProducts = window.UserTracking.getViewedProducts();
    var totalViews = Object.values(viewedProducts).reduce(function(s, v) { return s + v.views; }, 0);
    var statsViewed = document.getElementById('stat-viewed');
    var statsTotal = document.getElementById('stat-history');
    if (statsViewed) statsViewed.textContent = Object.keys(viewedProducts).length;
    if (statsTotal) statsTotal.textContent = totalViews;
  }

  function _renderSampleOrders() {
    var container = document.getElementById('order-history-container');
    if (!container) return;
    var sampleOrders = [
      { id: 'ORD-ABC123', date: '2024-11-20', status: 'Delivered', total: 189.99, items: 3 },
      { id: 'ORD-DEF456', date: '2024-10-15', status: 'Shipped', total: 59.99, items: 1 },
      { id: 'ORD-GHI789', date: '2024-09-05', status: 'Delivered', total: 349.97, items: 4 }
    ];
    container.innerHTML = sampleOrders.map(function(order) {
      var statusClass = order.status === 'Delivered' ? 'status-delivered' : 'status-shipped';
      return '<div class="order-card">' +
        '<div class="order-header">' +
          '<span class="order-id">' + order.id + '</span>' +
          '<span class="order-status ' + statusClass + '">' + order.status + '</span>' +
        '</div>' +
        '<div class="order-details">' +
          '<span><i class="fas fa-calendar"></i> ' + window.Utils.formatDate(order.date) + '</span>' +
          '<span><i class="fas fa-box"></i> ' + order.items + ' item(s)</span>' +
          '<span class="order-total"><strong>' + window.Utils.formatPrice(order.total) + '</strong></span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function initSearchResultsPage() {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    var queryDisplay = document.getElementById('search-query-display');
    if (queryDisplay) queryDisplay.textContent = '"' + query + '"';

    if (!query.trim()) {
      document.getElementById('search-results-grid').innerHTML = '<div class="no-results-full"><i class="fas fa-search"></i><p>Please enter a search term.</p></div>';
      return;
    }

    var results = window.searchProducts(query);
    var countEl = document.getElementById('results-count');
    if (countEl) countEl.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '') + ' found';

    if (results.length === 0) {
      var noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'no-results-full';
      noResultsDiv.innerHTML = '<i class="fas fa-search-minus"></i><p>Try different keywords or browse our categories.</p><a href="products.html" class="btn btn-primary">Browse All Products</a>';
      var heading = document.createElement('h3');
      heading.textContent = 'No results for "' + query + '"';
      noResultsDiv.insertBefore(heading, noResultsDiv.querySelector('p'));
      var grid = document.getElementById('search-results-grid');
      if (grid) { grid.innerHTML = ''; grid.appendChild(noResultsDiv); }
      // Show AI suggestions
      var aiSuggestions = window.RecommendationEngine.getTrendingProducts(4);
      window.Utils.renderProductCards('ai-suggestions-grid', aiSuggestions, true);
    } else {
      window.Utils.renderProductCards('search-results-grid', results, false);
    }

    // Pre-fill search input
    var searchInput = document.getElementById('search-page-input');
    if (searchInput) searchInput.value = query;

    searchInput && searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        window.location.href = 'search-results.html?q=' + encodeURIComponent(searchInput.value.trim());
      }
    });
  }

  window.App = {
    init: init,
    updateCartCount: updateCartCount,
    renderCartPage: renderCartPage
  };

  document.addEventListener('DOMContentLoaded', init);
})();