(function () {
  'use strict';

  var CART_KEY = 'shopai_cart';
  var DISCOUNTS_KEY = 'shopai_discounts';

  var TAX_RATE = 0.10;
  var FREE_SHIPPING_THRESHOLD = 100;
  var SHIPPING_COST = 9.99;

  var DISCOUNT_CODES = {
    'SAVE10': { type: 'percent', value: 10, label: 'SAVE10 (10% off)' },
    'SAVE20': { type: 'percent', value: 20, label: 'SAVE20 (20% off)' },
    'FLAT15': { type: 'fixed', value: 15, label: 'FLAT15 ($15 off)' },
    'WELCOME': { type: 'percent', value: 15, label: 'WELCOME (15% off)' }
  };

  function _loadCart() {
    try {
      var data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function _saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('CartManager: localStorage write failed', e);
    }
  }

  function _loadAppliedDiscounts() {
    try {
      var data = localStorage.getItem(DISCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function _saveAppliedDiscounts(discounts) {
    try {
      localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
    } catch (e) {
      console.warn('CartManager: localStorage write failed', e);
    }
  }

  function addToCart(productId, quantity) {
    productId = parseInt(productId);
    quantity = parseInt(quantity) || 1;

    var product = window.getProductById(productId);
    if (!product) {
      return { success: false, message: 'Product not found.' };
    }
    if (!product.inStock || product.stock < 1) {
      return { success: false, message: 'Sorry, this product is out of stock.' };
    }

    var cart = _loadCart();
    var existing = cart.find(function (item) { return item.productId === productId; });

    if (existing) {
      var newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        newQty = product.stock;
      }
      existing.quantity = newQty;
    } else {
      if (quantity > product.stock) {
        quantity = product.stock;
      }
      cart.push({ productId: productId, quantity: quantity });
    }

    _saveCart(cart);
    return { success: true, message: '"' + product.name + '" added to cart!' };
  }

  function getCartItems() {
    var cart = _loadCart();
    var items = [];
    cart.forEach(function (entry) {
      var product = window.getProductById(entry.productId);
      if (product) {
        items.push({
          productId: entry.productId,
          quantity: entry.quantity,
          product: product
        });
      }
    });
    return items;
  }

  function getCartCount() {
    var cart = _loadCart();
    return cart.reduce(function (sum, item) { return sum + (item.quantity || 0); }, 0);
  }

  function getCartTotal() {
    var items = getCartItems();
    var subtotal = items.reduce(function (sum, item) {
      return sum + item.product.price * item.quantity;
    }, 0);

    var appliedDiscounts = _loadAppliedDiscounts();
    var discountAmount = 0;
    var discountLabel = '';

    if (appliedDiscounts.length > 0) {
      var code = appliedDiscounts[appliedDiscounts.length - 1];
      var discount = DISCOUNT_CODES[code];
      if (discount) {
        if (discount.type === 'percent') {
          discountAmount = subtotal * (discount.value / 100);
        } else {
          discountAmount = Math.min(discount.value, subtotal);
        }
        discountLabel = discount.label;
      }
    }

    var discountedSubtotal = subtotal - discountAmount;
    var tax = discountedSubtotal * TAX_RATE;
    var shipping = (subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD) ? SHIPPING_COST : 0;
    var total = discountedSubtotal + tax + shipping;

    return {
      subtotal: subtotal,
      discountAmount: discountAmount,
      discountLabel: discountLabel,
      tax: tax,
      shipping: shipping,
      total: total
    };
  }

  function removeFromCart(productId) {
    productId = parseInt(productId);
    var cart = _loadCart();
    var index = cart.findIndex(function (item) { return item.productId === productId; });
    if (index === -1) {
      return { success: false, message: 'Item not found in cart.' };
    }
    cart.splice(index, 1);
    _saveCart(cart);
    return { success: true, message: 'Item removed from cart.' };
  }

  function updateQuantity(productId, quantity) {
    productId = parseInt(productId);
    quantity = parseInt(quantity) || 1;

    var cart = _loadCart();
    var item = cart.find(function (i) { return i.productId === productId; });
    if (!item) {
      return { success: false, message: 'Item not found in cart.' };
    }

    var product = window.getProductById(productId);
    if (product && quantity > product.stock) {
      quantity = product.stock;
    }
    if (quantity < 1) {
      return { success: false, message: 'Quantity must be at least 1.' };
    }

    item.quantity = quantity;
    _saveCart(cart);
    return { success: true, message: 'Quantity updated.' };
  }

  function applyDiscount(code) {
    if (!code || typeof code !== 'string') {
      return { success: false, message: 'Please enter a discount code.' };
    }
    code = code.trim().toUpperCase();

    var discount = DISCOUNT_CODES[code];
    if (!discount) {
      return { success: false, message: 'Invalid discount code "' + code + '".' };
    }

    var applied = _loadAppliedDiscounts();
    if (applied.indexOf(code) !== -1) {
      return { success: false, message: 'Discount code "' + code + '" has already been applied.' };
    }

    applied = [code];
    _saveAppliedDiscounts(applied);
    return { success: true, message: 'Discount code "' + code + '" applied! ' + discount.label };
  }

  function clearCart() {
    _saveCart([]);
    _saveAppliedDiscounts([]);
    return { success: true, message: 'Cart cleared.' };
  }

  window.CartManager = {
    addToCart: addToCart,
    getCartItems: getCartItems,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    removeFromCart: removeFromCart,
    updateQuantity: updateQuantity,
    applyDiscount: applyDiscount,
    clearCart: clearCart
  };

}());
