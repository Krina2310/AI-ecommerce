(function() {
  'use strict';

  var CART_KEY = 'cartItems';

  var DISCOUNT_CODES = {
    'SAVE10': { type: 'percent', value: 10, label: '10% off' },
    'SAVE20': { type: 'percent', value: 20, label: '20% off' },
    'FLAT15': { type: 'flat', value: 15, label: '$15 off' },
    'WELCOME': { type: 'percent', value: 5, label: '5% off for new users' }
  };

  function getCart() {
    return window.Utils.lsGet(CART_KEY, []);
  }

  function saveCart(items) {
    window.Utils.lsSet(CART_KEY, items);
  }

  function addToCart(productId, quantity) {
    productId = parseInt(productId);
    quantity = parseInt(quantity) || 1;
    if (quantity < 1) quantity = 1;

    var product = window.getProductById(productId);
    if (!product) return { success: false, message: 'Product not found.' };
    if (!product.inStock) return { success: false, message: 'Product is out of stock.' };

    var cart = getCart();
    var existing = cart.find(function(item) { return item.productId === productId; });

    if (existing) {
      var newQty = existing.quantity + quantity;
      if (newQty > product.stock) newQty = product.stock;
      existing.quantity = newQty;
    } else {
      cart.push({
        productId: productId,
        quantity: Math.min(quantity, product.stock),
        addedAt: Date.now()
      });
    }

    saveCart(cart);

    if (window.UserTracking) {
      window.UserTracking.trackAddToCart(productId);
    }

    return { success: true, message: 'Added to cart.' };
  }

  function removeFromCart(productId) {
    productId = parseInt(productId);
    var cart = getCart().filter(function(item) { return item.productId !== productId; });
    saveCart(cart);
    return { success: true };
  }

  function updateQuantity(productId, quantity) {
    productId = parseInt(productId);
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity < 0) return { success: false, message: 'Invalid quantity.' };

    if (quantity === 0) return removeFromCart(productId);

    var product = window.getProductById(productId);
    if (!product) return { success: false, message: 'Product not found.' };

    var cart = getCart();
    var item = cart.find(function(i) { return i.productId === productId; });

    if (!item) return { success: false, message: 'Item not in cart.' };

    item.quantity = Math.min(quantity, product.stock);
    saveCart(cart);
    return { success: true };
  }

  function getCartItems() {
    var cart = getCart();
    return cart.map(function(item) {
      var product = window.getProductById(item.productId);
      if (!product) return null;
      return Object.assign({}, item, { product: product });
    }).filter(Boolean);
  }

  function getCartTotal() {
    var items = getCartItems();
    var subtotal = items.reduce(function(sum, item) {
      return sum + item.product.price * item.quantity;
    }, 0);

    var discount = _getAppliedDiscount(subtotal);
    var discountedSubtotal = subtotal - discount.amount;
    var tax = discountedSubtotal * 0.1;
    var shipping = discountedSubtotal > 0 ? (discountedSubtotal >= 100 ? 0 : 9.99) : 0;
    var total = discountedSubtotal + tax + shipping;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discount.amount * 100) / 100,
      discountLabel: discount.label,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  function getCartCount() {
    return getCart().reduce(function(sum, item) { return sum + item.quantity; }, 0);
  }

  function clearCart() {
    saveCart([]);
    window.Utils.lsRemove('appliedDiscount');
  }

  function applyDiscount(code) {
    code = (code || '').toUpperCase().trim();
    if (!code) return { success: false, message: 'Please enter a discount code.' };

    var discount = DISCOUNT_CODES[code];
    if (!discount) return { success: false, message: 'Invalid discount code.' };

    window.Utils.lsSet('appliedDiscount', { code: code, discount: discount });
    return { success: true, message: 'Discount applied: ' + discount.label };
  }

  function removeDiscount() {
    window.Utils.lsRemove('appliedDiscount');
  }

  function _getAppliedDiscount(subtotal) {
    var applied = window.Utils.lsGet('appliedDiscount', null);
    if (!applied) return { amount: 0, label: null };

    var d = applied.discount;
    var amount = 0;
    if (d.type === 'percent') {
      amount = subtotal * (d.value / 100);
    } else if (d.type === 'flat') {
      amount = Math.min(d.value, subtotal);
    }
    return { amount: amount, label: applied.code + ' (' + d.label + ')' };
  }

  window.CartManager = {
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQuantity: updateQuantity,
    getCart: getCart,
    getCartItems: getCartItems,
    getCartTotal: getCartTotal,
    getCartCount: getCartCount,
    clearCart: clearCart,
    applyDiscount: applyDiscount,
    removeDiscount: removeDiscount
  };
})();
