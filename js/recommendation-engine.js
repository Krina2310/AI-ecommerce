(function() {
  'use strict';

  /**
   * Calculate similarity between two products (0–1 score).
   * Factors: same category, price proximity within 20%, rating similarity, shared tags.
   */
  function calculateSimilarity(p1, p2) {
    if (!p1 || !p2 || p1.id === p2.id) return 0;
    var score = 0;

    // Same category (weight 0.4)
    if (p1.category === p2.category) score += 0.4;

    // Price proximity within 20% (weight 0.2)
    var priceDiff = Math.abs(p1.price - p2.price);
    var avgPrice = (p1.price + p2.price) / 2;
    if (avgPrice > 0 && priceDiff / avgPrice <= 0.2) score += 0.2;
    else if (avgPrice > 0 && priceDiff / avgPrice <= 0.5) score += 0.1;

    // Rating similarity within 0.5 (weight 0.15)
    if (Math.abs(p1.rating - p2.rating) <= 0.5) score += 0.15;

    // Shared tags (weight up to 0.25)
    var sharedTags = p1.tags.filter(function(t) { return p2.tags.indexOf(t) !== -1; });
    var tagScore = Math.min(sharedTags.length / Math.max(p1.tags.length, p2.tags.length, 1), 1) * 0.25;
    score += tagScore;

    return Math.min(score, 1);
  }

  /**
   * Content-based: find products similar to a given product.
   */
  function getContentBasedRecommendations(productId, limit) {
    limit = limit || 4;
    productId = parseInt(productId);
    var product = window.getProductById(productId);
    if (!product) return [];

    var scored = window.productsData
      .filter(function(p) { return p.id !== productId; })
      .map(function(p) {
        return { product: p, score: calculateSimilarity(product, p) };
      })
      .sort(function(a, b) { return b.score - a.score; });

    return scored.slice(0, limit).map(function(s) { return s.product; });
  }

  /**
   * Collaborative: based on browsing history of the user.
   */
  function getCollaborativeRecommendations(userId, limit) {
    limit = limit || 4;
    var history = window.UserTracking ? window.UserTracking.getBrowsingHistory() : [];
    if (history.length === 0) return getTrendingProducts(limit);

    var historySet = {};
    history.forEach(function(id) { historySet[id] = true; });

    // Collect related products from viewed products
    var relatedScores = {};
    history.forEach(function(viewedId) {
      var product = window.getProductById(viewedId);
      if (!product) return;
      product.relatedProducts.forEach(function(relId) {
        if (!historySet[relId]) {
          relatedScores[relId] = (relatedScores[relId] || 0) + 1;
        }
      });
      // Also score similar products
      getContentBasedRecommendations(viewedId, 6).forEach(function(p) {
        if (!historySet[p.id]) {
          relatedScores[p.id] = (relatedScores[p.id] || 0) + 0.5;
        }
      });
    });

    var sorted = Object.entries(relatedScores)
      .sort(function(a, b) { return b[1] - a[1]; })
      .slice(0, limit)
      .map(function(e) { return window.getProductById(parseInt(e[0])); })
      .filter(Boolean);

    if (sorted.length < limit) {
      var trending = getTrendingProducts(limit * 2);
      trending.forEach(function(p) {
        if (!historySet[p.id] && sorted.findIndex(function(s) { return s.id === p.id; }) === -1) {
          sorted.push(p);
        }
      });
    }

    return sorted.slice(0, limit);
  }

  /**
   * Trending: products sorted by viewCount + purchaseCount*2.
   */
  function getTrendingProducts(limit) {
    limit = limit || 8;
    return window.productsData
      .slice()
      .sort(function(a, b) {
        return (b.viewCount + b.purchaseCount * 2) - (a.viewCount + a.purchaseCount * 2);
      })
      .slice(0, limit);
  }

  /**
   * Personalized: blend of user preferences + browsing history.
   */
  function getPersonalizedRecommendations(limit) {
    limit = limit || 8;
    var prefs = window.UserTracking ? window.UserTracking.getUserPreferences() : null;
    var history = window.UserTracking ? window.UserTracking.getBrowsingHistory() : [];
    var historySet = {};
    history.forEach(function(id) { historySet[id] = true; });

    if (!prefs || Object.keys(prefs.categories).length === 0) {
      return getTrendingProducts(limit);
    }

    var scored = window.productsData
      .filter(function(p) { return !historySet[p.id]; })
      .map(function(p) {
        var score = 0;

        // Category preference score
        score += (prefs.categories[p.category] || 0) * 0.4;

        // Brand preference score
        score += (prefs.brands[p.brand] || 0) * 0.2;

        // Tag preference score
        var tagScore = p.tags.reduce(function(acc, tag) {
          return acc + (prefs.tags[tag] || 0);
        }, 0);
        score += tagScore * 0.1;

        // Price affinity
        if (prefs.priceRange.avg !== null) {
          var priceDiff = Math.abs(p.price - prefs.priceRange.avg);
          var relDiff = priceDiff / prefs.priceRange.avg;
          score += Math.max(0, (1 - relDiff)) * 0.15;
        }

        // Popularity boost
        score += (p.viewCount / 50000) * 0.1;
        score += p.rating * 0.05;

        return { product: p, score: score };
      })
      .sort(function(a, b) { return b.score - a.score; });

    return scored.slice(0, limit).map(function(s) { return s.product; });
  }

  /**
   * Frequently bought together: products from relatedProducts list + same-category items.
   */
  function getFrequentlyBoughtTogether(productId, limit) {
    limit = limit || 3;
    productId = parseInt(productId);
    var product = window.getProductById(productId);
    if (!product) return [];

    var result = [];
    var seen = { [productId]: true };

    // First add explicitly related products
    product.relatedProducts.forEach(function(relId) {
      if (!seen[relId]) {
        var p = window.getProductById(relId);
        if (p && p.inStock) {
          result.push(p);
          seen[relId] = true;
        }
      }
    });

    // Fill up with content-based recommendations if needed
    if (result.length < limit) {
      getContentBasedRecommendations(productId, limit * 2).forEach(function(p) {
        if (!seen[p.id] && p.inStock) {
          result.push(p);
          seen[p.id] = true;
        }
      });
    }

    return result.slice(0, limit);
  }

  /**
   * New arrivals: last 8 products by ID (highest IDs = newest).
   */
  function getNewArrivals(limit) {
    limit = limit || 8;
    return window.productsData
      .slice()
      .sort(function(a, b) { return b.id - a.id; })
      .slice(0, limit);
  }

  /**
   * Get all recommendation types for a given context.
   * context = { productId, page }
   */
  function getAllRecommendations(context) {
    context = context || {};
    var result = {};

    if (context.productId) {
      result.similar = getContentBasedRecommendations(context.productId, 4);
      result.boughtTogether = getFrequentlyBoughtTogether(context.productId, 3);
    }

    result.trending = getTrendingProducts(8);
    result.personalized = getPersonalizedRecommendations(8);
    result.newArrivals = getNewArrivals(8);
    result.collaborative = getCollaborativeRecommendations(null, 6);

    return result;
  }

  window.RecommendationEngine = {
    calculateSimilarity: calculateSimilarity,
    getContentBasedRecommendations: getContentBasedRecommendations,
    getCollaborativeRecommendations: getCollaborativeRecommendations,
    getTrendingProducts: getTrendingProducts,
    getPersonalizedRecommendations: getPersonalizedRecommendations,
    getFrequentlyBoughtTogether: getFrequentlyBoughtTogether,
    getNewArrivals: getNewArrivals,
    getAllRecommendations: getAllRecommendations
  };
})();
