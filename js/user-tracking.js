(function() {
  'use strict';

  var HISTORY_KEY = 'browsingHistory';
  var VIEWED_KEY = 'viewedProducts';
  var PREFS_KEY = 'userPreferences';
  var CLICKS_KEY = 'productClicks';
  var CART_EVENTS_KEY = 'cartEvents';

  var MAX_HISTORY = 50;

  function trackProductView(productId) {
    productId = parseInt(productId);
    if (!productId) return;

    // Update browsing history (array of IDs, most recent first)
    var history = window.Utils.lsGet(HISTORY_KEY, []);
    history = history.filter(function(id) { return id !== productId; });
    history.unshift(productId);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    window.Utils.lsSet(HISTORY_KEY, history);

    // Update viewed products detail
    var viewed = window.Utils.lsGet(VIEWED_KEY, {});
    var key = String(productId);
    if (!viewed[key]) {
      viewed[key] = { views: 0, timeSpent: 0, lastViewed: null, firstViewed: Date.now() };
    }
    viewed[key].views = (viewed[key].views || 0) + 1;
    viewed[key].lastViewed = Date.now();
    window.Utils.lsSet(VIEWED_KEY, viewed);

    // Update preferences
    _updatePreferencesFromProduct(productId);
  }

  function trackProductClick(productId) {
    productId = parseInt(productId);
    if (!productId) return;
    var clicks = window.Utils.lsGet(CLICKS_KEY, {});
    var key = String(productId);
    clicks[key] = (clicks[key] || 0) + 1;
    window.Utils.lsSet(CLICKS_KEY, clicks);
  }

  function trackAddToCart(productId) {
    productId = parseInt(productId);
    if (!productId) return;
    var events = window.Utils.lsGet(CART_EVENTS_KEY, []);
    events.push({ productId: productId, timestamp: Date.now() });
    if (events.length > 100) events = events.slice(-100);
    window.Utils.lsSet(CART_EVENTS_KEY, events);
    _updatePreferencesFromProduct(productId, 3); // cart adds weigh more
  }

  function _updatePreferencesFromProduct(productId, weight) {
    weight = weight || 1;
    if (!window.productsData) return;
    var product = window.getProductById(productId);
    if (!product) return;

    var prefs = window.Utils.lsGet(PREFS_KEY, {
      categories: {},
      brands: {},
      tags: {},
      priceRange: { min: null, max: null, sum: 0, count: 0 }
    });

    // Update category score
    prefs.categories = prefs.categories || {};
    prefs.categories[product.category] = (prefs.categories[product.category] || 0) + weight;

    // Update brand score
    prefs.brands = prefs.brands || {};
    prefs.brands[product.brand] = (prefs.brands[product.brand] || 0) + weight;

    // Update tag scores
    prefs.tags = prefs.tags || {};
    product.tags.forEach(function(tag) {
      prefs.tags[tag] = (prefs.tags[tag] || 0) + weight;
    });

    // Update price range
    prefs.priceRange = prefs.priceRange || { min: null, max: null, sum: 0, count: 0 };
    if (prefs.priceRange.min === null || product.price < prefs.priceRange.min) {
      prefs.priceRange.min = product.price;
    }
    if (prefs.priceRange.max === null || product.price > prefs.priceRange.max) {
      prefs.priceRange.max = product.price;
    }
    prefs.priceRange.sum = (prefs.priceRange.sum || 0) + product.price;
    prefs.priceRange.count = (prefs.priceRange.count || 0) + 1;

    window.Utils.lsSet(PREFS_KEY, prefs);
  }

  function getBrowsingHistory() {
    return window.Utils.lsGet(HISTORY_KEY, []);
  }

  function getViewedProducts() {
    return window.Utils.lsGet(VIEWED_KEY, {});
  }

  function getUserPreferences() {
    var prefs = window.Utils.lsGet(PREFS_KEY, null);
    if (!prefs) {
      return {
        categories: {},
        brands: {},
        tags: {},
        priceRange: { min: null, max: null, avg: null }
      };
    }

    // Compute avg price
    var pr = prefs.priceRange || {};
    var avg = pr.count > 0 ? pr.sum / pr.count : null;

    // Sort categories/brands/tags by score
    var topCategories = Object.entries(prefs.categories || {})
      .sort(function(a, b) { return b[1] - a[1]; })
      .map(function(e) { return e[0]; });

    var topBrands = Object.entries(prefs.brands || {})
      .sort(function(a, b) { return b[1] - a[1]; })
      .map(function(e) { return e[0]; });

    var topTags = Object.entries(prefs.tags || {})
      .sort(function(a, b) { return b[1] - a[1]; })
      .slice(0, 10)
      .map(function(e) { return e[0]; });

    return {
      categories: prefs.categories || {},
      topCategories: topCategories,
      brands: prefs.brands || {},
      topBrands: topBrands,
      tags: prefs.tags || {},
      topTags: topTags,
      priceRange: {
        min: pr.min || null,
        max: pr.max || null,
        avg: avg
      }
    };
  }

  function clearHistory() {
    window.Utils.lsRemove(HISTORY_KEY);
    window.Utils.lsRemove(VIEWED_KEY);
    window.Utils.lsRemove(PREFS_KEY);
    window.Utils.lsRemove(CLICKS_KEY);
    window.Utils.lsRemove(CART_EVENTS_KEY);
  }

  window.UserTracking = {
    trackProductView: trackProductView,
    trackProductClick: trackProductClick,
    trackAddToCart: trackAddToCart,
    getBrowsingHistory: getBrowsingHistory,
    getViewedProducts: getViewedProducts,
    getUserPreferences: getUserPreferences,
    clearHistory: clearHistory
  };
})();
