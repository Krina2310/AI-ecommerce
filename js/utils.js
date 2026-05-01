(function() {
  'use strict';

  // LocalStorage helpers
  function lsGet(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('localStorage write failed:', e);
      return false;
    }
  }

  function lsRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function formatPrice(price) {
    if (typeof price !== 'number') price = parseFloat(price) || 0;
    return '$' + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }

  function showToast(message, type) {
    type = type || 'info';
    const existing = document.querySelector('.toast-container');
    let container = existing;
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span><button class="toast-close"><i class="fas fa-times"></i></button>';

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', function() {
      dismissToast(toast);
    });

    // Trigger animation
    requestAnimationFrame(function() {
      toast.classList.add('toast-show');
    });

    const timer = setTimeout(function() {
      dismissToast(toast);
    }, 3000);

    toast._timer = timer;
  }

  function dismissToast(toast) {
    clearTimeout(toast._timer);
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  function formatDate(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  function truncateText(text, length) {
    if (!text) return '';
    length = length || 100;
    if (text.length <= length) return text;
    return text.substring(0, length).trimEnd() + '...';
  }

  function makeImgFallbackSrc(text) {
    var label = (text || 'Product').substring(0, 24);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
      '<rect width="400" height="300" fill="#f0f0f0"/>' +
      '<rect x="155" y="85" width="90" height="75" rx="6" fill="#d0d0d0"/>' +
      '<circle cx="183" cy="110" r="12" fill="#b8b8b8"/>' +
      '<polygon points="155,160 210,110 245,160" fill="#c4c4c4"/>' +
      '<text x="200" y="205" font-family="Arial,sans-serif" font-size="13" fill="#888" text-anchor="middle">' +
        label +
      '</text>' +
    '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let html = '';
    for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
    if (half) html += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="far fa-star"></i>';
    return html;
  }

  function createProductCard(product, showRecommendationBadge) {
    const card = document.createElement('div');
    card.className = 'product-card' + (showRecommendationBadge ? ' ai-recommended' : '');
    card.innerHTML =
      '<div class="product-card-image">' +
        '<a href="product-detail.html?id=' + product.id + '">' +
          '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.onerror=null;this.src=window.Utils.makeImgFallbackSrc(this.alt);">' +
        '</a>' +
        (showRecommendationBadge ? '<span class="ai-badge"><i class="fas fa-robot"></i> AI Pick</span>' : '') +
        (!product.inStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : '') +
      '</div>' +
      '<div class="product-card-body">' +
        '<span class="product-category">' + product.category + '</span>' +
        '<h3 class="product-name"><a href="product-detail.html?id=' + product.id + '">' + product.name + '</a></h3>' +
        '<div class="product-rating">' +
          '<div class="stars">' + renderStars(product.rating) + '</div>' +
          '<span class="rating-count">(' + product.reviews.toLocaleString() + ')</span>' +
        '</div>' +
        '<div class="product-price-row">' +
          '<span class="product-price">' + formatPrice(product.price) + '</span>' +
          '<button class="btn btn-primary btn-sm add-to-cart-btn" data-product-id="' + product.id + '"' + (!product.inStock ? ' disabled' : '') + '>' +
            '<i class="fas fa-cart-plus"></i> Add to Cart' +
          '</button>' +
        '</div>' +
      '</div>';
    return card;
  }

  function renderProductCards(containerId, products, showBadge) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (!products || products.length === 0) {
      container.innerHTML = '<p class="no-results">No products found.</p>';
      return;
    }
    products.forEach(function(product) {
      container.appendChild(createProductCard(product, showBadge));
    });
    // Attach add-to-cart handlers
    container.querySelectorAll('.add-to-cart-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const productId = parseInt(btn.getAttribute('data-product-id'));
        if (window.CartManager) {
          window.CartManager.addToCart(productId, 1);
          window.Utils.showToast('Added to cart!', 'success');
          if (window.App) window.App.updateCartCount();
        }
      });
    });
  }

  window.Utils = {
    lsGet: lsGet,
    lsSet: lsSet,
    lsRemove: lsRemove,
    formatPrice: formatPrice,
    generateId: generateId,
    debounce: debounce,
    throttle: throttle,
    showToast: showToast,
    formatDate: formatDate,
    truncateText: truncateText,
    renderStars: renderStars,
    makeImgFallbackSrc: makeImgFallbackSrc,
    createProductCard: createProductCard,
    renderProductCards: renderProductCards
  };
})();
