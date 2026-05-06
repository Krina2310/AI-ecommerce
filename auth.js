/* ===================================================
   SHOPAI – Auth (Login / Register) Logic
   =================================================== */
(function () {
  'use strict';

  var LS_USERS_KEY = 'shopai_users';
  var LS_SESSION_KEY = 'shopai_session';

  // ---- LocalStorage helpers (mirrors utils.js) ----
  function lsGet(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  // ---- Password hashing (SHA-256 via Web Crypto API) ----
  function hashPassword(password) {
    var encoder = new TextEncoder();
    var data = encoder.encode(password);
    return crypto.subtle.digest('SHA-256', data).then(function (hashBuffer) {
      return Array.from(new Uint8Array(hashBuffer))
        .map(function (b) { return ('00' + b.toString(16)).slice(-2); })
        .join('');
    });
  }

  // ---- Password strength ----
  function calcStrength(pw) {
    var score = 0;
    var checks = {
      length:  pw.length >= 8,
      upper:   /[A-Z]/.test(pw),
      number:  /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw)
    };
    Object.keys(checks).forEach(function (k) { if (checks[k]) score++; });
    var level = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';
    return { score: score, level: level, checks: checks };
  }

  function renderStrength(pw) {
    var container = document.getElementById('strength-bar-container');
    var fill      = document.getElementById('strength-bar-fill');
    var label     = document.getElementById('strength-label');
    if (!container) return;

    if (!pw) { container.style.display = 'none'; return; }
    container.style.display = 'block';

    var res = calcStrength(pw);
    var labels = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' };

    fill.className  = 'strength-bar-fill strength-' + res.level;
    label.className = 'strength-label strength-' + res.level;
    label.textContent = labels[res.level];

    var map = { length: 'hint-length', upper: 'hint-upper', number: 'hint-number', special: 'hint-special' };
    Object.keys(map).forEach(function (k) {
      var el = document.getElementById(map[k]);
      if (el) el.classList.toggle('met', !!res.checks[k]);
    });
  }

  // ---- Validation helpers ----
  function setError(fieldId, errId, msg) {
    var field = document.getElementById(fieldId);
    var err   = document.getElementById(errId);
    if (field) field.classList.add('input-error');
    if (err)   err.textContent = msg;
    return false;
  }

  function clearError(fieldId, errId) {
    var field = document.getElementById(fieldId);
    var err   = document.getElementById(errId);
    if (field) field.classList.remove('input-error');
    if (err)   err.textContent = '';
  }

  function showAlert(alertId, msgId, msg) {
    var alert = document.getElementById(alertId);
    var span  = document.getElementById(msgId);
    if (span)  span.textContent = msg;
    if (alert) alert.classList.add('show');
  }

  function hideAlert(alertId) {
    var alert = document.getElementById(alertId);
    if (alert) alert.classList.remove('show');
  }

  // ---- Toggle password visibility ----
  function initToggle(btnId, inputId) {
    var btn   = document.getElementById(btnId);
    var input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', function () {
      var isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      var icon = btn.querySelector('i');
      if (icon) {
        icon.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
      }
    });
  }

  // ---- Login page ----
  function initLogin() {
    var form = document.getElementById('login-form');
    if (!form) return;

    initToggle('toggle-login-pw', 'login-password');

    // Pre-fill from "remember me"
    var remembered = lsGet('shopai_remember', null);
    if (remembered) {
      var emailField = document.getElementById('login-email');
      var rememberBox = document.getElementById('remember-me');
      if (emailField) emailField.value = remembered;
      if (rememberBox) rememberBox.checked = true;
    }

    // Forgot password link
    var forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        var email = (document.getElementById('login-email') || {}).value || '';
        if (!email) {
          alert('Please enter your email address first, then click "Forgot password?".');
          return;
        }
        alert('Password reset instructions would be sent to: ' + email + '\n\n(This is a demo – no email is actually sent.)');
      });
    }

    // Real-time field validation
    document.getElementById('login-email').addEventListener('blur', function () {
      validateLoginEmail();
    });
    document.getElementById('login-password').addEventListener('blur', function () {
      validateLoginPassword();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('login-alert');
      var valid = validateLoginEmail() && validateLoginPassword();
      if (!valid) return;

      var email    = document.getElementById('login-email').value.trim().toLowerCase();
      var password = document.getElementById('login-password').value;
      var remember = document.getElementById('remember-me').checked;

      var btn = document.getElementById('login-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

      hashPassword(password).then(function (hash) {
        var users = lsGet(LS_USERS_KEY, []);
        var user  = users.find(function (u) { return u.email === email; });

        if (!user || user.passwordHash !== hash) {
          showAlert('login-alert', 'login-alert-msg', 'Incorrect email or password. Please try again.');
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In'; }
          return;
        }

        // Remember me
        if (remember) {
          lsSet('shopai_remember', email);
        } else {
          try { localStorage.removeItem('shopai_remember'); } catch (err) {}
        }

        // Save session (never store password)
        lsSet(LS_SESSION_KEY, { id: user.id, name: user.name, email: user.email });

        if (window.App && window.App.authSuccess) {
          window.App.authSuccess({ name: user.name });
        } else {
          if (window.Utils && window.Utils.showToast) {
            window.Utils.showToast('Welcome back, ' + user.name + '! 🎉', 'success');
          }
          setTimeout(function () { window.location.href = 'index.html'; }, 800);
        }
      }).catch(function () {
        showAlert('login-alert', 'login-alert-msg', 'An error occurred. Please try again.');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In'; }
      });
    });
  }

  function validateLoginEmail() {
    var val = (document.getElementById('login-email') || {}).value || '';
    if (!val.trim()) return setError('login-email', 'login-email-error', 'Email is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()))
      return setError('login-email', 'login-email-error', 'Please enter a valid email address.');
    clearError('login-email', 'login-email-error');
    return true;
  }

  function validateLoginPassword() {
    var val = (document.getElementById('login-password') || {}).value || '';
    if (!val) return setError('login-password', 'login-password-error', 'Password is required.');
    clearError('login-password', 'login-password-error');
    return true;
  }

  // ---- Register page ----
  function initRegister() {
    var form = document.getElementById('register-form');
    if (!form) return;

    initToggle('toggle-reg-pw', 'reg-password');
    initToggle('toggle-reg-confirm', 'reg-confirm');

    // Live password strength
    var pwInput = document.getElementById('reg-password');
    if (pwInput) {
      pwInput.addEventListener('input', function () {
        renderStrength(this.value);
        if (this.value) clearError('reg-password', 'reg-password-error');
      });
    }

    // Live confirm match check
    var confirmInput = document.getElementById('reg-confirm');
    if (confirmInput) {
      confirmInput.addEventListener('input', function () {
        var pw = (document.getElementById('reg-password') || {}).value || '';
        if (this.value && this.value !== pw) {
          setError('reg-confirm', 'reg-confirm-error', 'Passwords do not match.');
        } else {
          clearError('reg-confirm', 'reg-confirm-error');
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert('register-alert');

      var validName    = validateRegName();
      var validEmail   = validateRegEmail();
      var validPw      = validateRegPassword();
      var validConfirm = validateRegConfirm();
      var validTerms   = validateRegTerms();

      if (!(validName && validEmail && validPw && validConfirm && validTerms)) return;

      var name     = document.getElementById('reg-name').value.trim();
      var email    = document.getElementById('reg-email').value.trim().toLowerCase();
      var password = document.getElementById('reg-password').value;

      var users = lsGet(LS_USERS_KEY, []);
      if (users.find(function (u) { return u.email === email; })) {
        showAlert('register-alert', 'register-alert-msg', 'An account with this email already exists. Try logging in.');
        return;
      }

      var btn = document.getElementById('register-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

      hashPassword(password).then(function (hash) {
        var newUser = {
          id:           Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          name:         name,
          email:        email,
          passwordHash: hash,
          createdAt:    new Date().toISOString()
        };

        var currentUsers = lsGet(LS_USERS_KEY, []);
        currentUsers.push(newUser);
        lsSet(LS_USERS_KEY, currentUsers);
        lsSet(LS_SESSION_KEY, { id: newUser.id, name: newUser.name, email: newUser.email });

        if (window.App && window.App.authSuccess) {
          window.App.authSuccess({ name: newUser.name, isNew: true });
        } else {
          if (window.Utils && window.Utils.showToast) {
            window.Utils.showToast('Account created! Welcome to ShopAI 🎉', 'success');
          }
          setTimeout(function () { window.location.href = 'index.html'; }, 900);
        }
      }).catch(function () {
        showAlert('register-alert', 'register-alert-msg', 'An error occurred. Please try again.');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account'; }
      });
    });
  }

  function validateRegName() {
    var val = (document.getElementById('reg-name') || {}).value || '';
    if (!val.trim()) return setError('reg-name', 'reg-name-error', 'Full name is required.');
    if (val.trim().length < 2) return setError('reg-name', 'reg-name-error', 'Name must be at least 2 characters.');
    clearError('reg-name', 'reg-name-error');
    return true;
  }

  function validateRegEmail() {
    var val = (document.getElementById('reg-email') || {}).value || '';
    if (!val.trim()) return setError('reg-email', 'reg-email-error', 'Email is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()))
      return setError('reg-email', 'reg-email-error', 'Please enter a valid email address.');
    clearError('reg-email', 'reg-email-error');
    return true;
  }

  function validateRegPassword() {
    var val = (document.getElementById('reg-password') || {}).value || '';
    if (!val) return setError('reg-password', 'reg-password-error', 'Password is required.');
    if (val.length < 8) return setError('reg-password', 'reg-password-error', 'Password must be at least 8 characters.');
    clearError('reg-password', 'reg-password-error');
    return true;
  }

  function validateRegConfirm() {
    var pw      = (document.getElementById('reg-password') || {}).value || '';
    var confirm = (document.getElementById('reg-confirm') || {}).value || '';
    if (!confirm) return setError('reg-confirm', 'reg-confirm-error', 'Please confirm your password.');
    if (confirm !== pw) return setError('reg-confirm', 'reg-confirm-error', 'Passwords do not match.');
    clearError('reg-confirm', 'reg-confirm-error');
    return true;
  }

  function validateRegTerms() {
    var cb = document.getElementById('reg-terms');
    if (!cb || !cb.checked) {
      var err = document.getElementById('reg-terms-error');
      if (err) err.textContent = 'You must agree to the Terms of Service.';
      return false;
    }
    var err = document.getElementById('reg-terms-error');
    if (err) err.textContent = '';
    return true;
  }

  // ---- Boot ----
  // Expose so main.js can call after injecting the modal
  window.AuthModule = {
    initLogin: initLogin,
    initRegister: initRegister
  };

  // Auto-init on standalone auth pages (login.html / register.html)
  document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname;
    if (path.includes('login.html') || path.includes('register.html')) {
      initLogin();
      initRegister();
    }
  });

}());
