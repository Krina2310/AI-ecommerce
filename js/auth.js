// Utility: Password strength checker
function checkStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[\W]/.test(pw)) score++;
  return score;
}

// Get/Set LocalStorage
function getUsers() { return JSON.parse(localStorage.getItem('users')) || []; }
function setUsers(arr) { localStorage.setItem('users', JSON.stringify(arr)); }
function setSession(user, remember) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  if (remember) localStorage.setItem('remember', 'true');
  else localStorage.removeItem('remember');
}
function clearSession() { localStorage.removeItem('currentUser'); localStorage.removeItem('remember'); }

// ===== NEW FUNCTIONS TO ADD =====
// Get current logged-in user
function getCurrentUser() {
  var userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('currentUser') !== null;
}

// Logout
function logout() {
  clearSession();
}

// Export to window object (for use in other files)
window.Auth = {
  getCurrentUser: getCurrentUser,
  getLoggedInUser: getCurrentUser, // Alias
  isLoggedIn: isLoggedIn,
  logout: logout,
  getUsers: getUsers,
  setUsers: setUsers,
  setSession: setSession,
  clearSession: clearSession,
  checkStrength: checkStrength
};
// ===== END NEW FUNCTIONS =====

// Register Logic
if(document.getElementById('registerForm')) {
  document.getElementById('registerForm').onsubmit = function(e) {
    e.preventDefault();
    // Get fields
    let uname = regUsername.value.trim();
    let email = regEmail.value.trim().toLowerCase();
    let pw = regPassword.value, conf = regConfirm.value, terms = terms.checked;
    let users = getUsers();

    // Username validation
    if(users.some(u=>u.username===uname)) { userError.innerText="Username taken"; return;}
    if(uname.length<3 || uname.length>20 || !/^\w+$/.test(uname)){userError.innerText="3-20 chars, letters/numbers/_ only";return;} else{userError.innerText="";}

    // Email validation
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){emailError.innerText="Invalid email";return;}
    if(users.some(u=>u.email===email)){emailError.innerText="Email in use";return;} else{emailError.innerText="";}

    // Password validation
    let strength = checkStrength(pw);
    if(strength < 4){pwError.innerText="Stronger password needed";return;} else {pwError.innerText="";}
    if(pw !== conf){confirmError.innerText="Passwords do not match";return;} else {confirmError.innerText="";}

    // Terms
    if(!terms){confirmError.innerText="Accept terms";return;}
    else {confirmError.innerText="";}

    users.push({username:uname, email, password:btoa(pw)});
    setUsers(users);
    registerSuccess.innerHTML = `<span style='color:green'>Registration successful! <a href='login.html'>Login Now</a></span>`;
    this.reset();
  };

  // Password strength meter (visual)
  regPassword.oninput = function() {
    let s = checkStrength(this.value);
    const bars = ["#e74c3c","#e67e22", "#f1c40f", "#2ecc71"];
    strengthBar.style.background = bars[Math.max(0, s-2)];
    strengthBar.style.height="5px";strengthBar.style.marginBottom="10px";
  };
}

// Login Logic
if(document.getElementById('loginForm')) {
  document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();
    let luser = loginUser.value.trim(), pw = loginPass.value;
    let users = getUsers();
    let user = users.find(u=>(u.username===luser||u.email===luser) && atob(u.password)===pw);
    if(!user) {loginError.innerText="Invalid login"; return;}
    setSession(user, rememberMe.checked);
    window.location.href='index.html';
  }
}

// ===== MESSAGE HANDLERS (Add this at the end of auth.js) =====

// Show message on login page
function showLoginMessage(message, isSuccess) {
  var messageBox = document.getElementById('message-box');
  if (messageBox) {
    messageBox.textContent = message;
    messageBox.className = 'message-box show ' + (isSuccess ? 'success' : 'error');
    
    // Auto-hide error messages after 5 seconds
    if (!isSuccess) {
      setTimeout(function() {
        messageBox.classList.remove('show');
      }, 5000);
    }
  }
}

// Show message on register page
function showRegisterMessage(message, isSuccess) {
  var messageBox = document.getElementById('message-box');
  if (messageBox) {
    messageBox.textContent = message;
    messageBox.className = 'message-box show ' + (isSuccess ? 'success' : 'error');
    
    // Auto-hide after 3 seconds
    setTimeout(function() {
      messageBox.classList.remove('show');
    }, isSuccess ? 3000 : 5000);
  }
}

// Update Login Form Handler
if(document.getElementById('loginForm')) {
  document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();
    
    // Clear previous messages
    document.getElementById('message-box').classList.remove('show');
    document.getElementById('user-error').innerHTML = '';
    document.getElementById('pass-error').innerHTML = '';
    
    let luser = loginUser.value.trim();
    let pw = loginPass.value;
    let users = getUsers();
    
    // Validation
    if (!luser) {
      document.getElementById('user-error').innerHTML = 'Username or email is required.';
      return;
    }
    if (!pw) {
      document.getElementById('pass-error').innerHTML = 'Password is required.';
      return;
    }
    
    // Find user
    let user = users.find(u=>(u.username===luser||u.email===luser) && atob(u.password)===pw);
    
    if(!user) {
      showLoginMessage('❌ User not registered or invalid credentials!', false);
      return;
    }
    
    // Success
    showLoginMessage('✅ Login successful! Redirecting...', true);
    setSession(user, rememberMe.checked);
    
    setTimeout(function() {
      window.location.href='index.html';
    }, 1500);
  };
}

// Update Register Form Handler
if(document.getElementById('registerForm')) {
  document.getElementById('registerForm').onsubmit = function(e) {
    e.preventDefault();
    
    // Clear previous messages
    document.getElementById('message-box').classList.remove('show');
    document.getElementById('userError').innerHTML = '';
    document.getElementById('emailError').innerHTML = '';
    document.getElementById('pwError').innerHTML = '';
    document.getElementById('confirmError').innerHTML = '';
    document.getElementById('termsError').innerHTML = '';
    
    let uname = regUsername.value.trim();
    let email = regEmail.value.trim().toLowerCase();
    let pw = regPassword.value;
    let conf = regConfirm.value;
    let terms = document.getElementById('terms').checked;
    let users = getUsers();

    // Username validation
    if(!uname) {
      document.getElementById('userError').innerHTML = "Username is required.";
      return;
    }
    if(users.some(u=>u.username===uname)) { 
      document.getElementById('userError').innerHTML = "Username already taken";
      return;
    }
    if(uname.length<3 || uname.length>20 || !/^\w+$/.test(uname)){
      document.getElementById('userError').innerHTML = "3-20 chars, letters/numbers/_ only";
      return;
    }

    // Email validation
    if(!email) {
      document.getElementById('emailError').innerHTML = "Email is required.";
      return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      document.getElementById('emailError').innerHTML = "Invalid email";
      return;
    }
    if(users.some(u=>u.email===email)){
      document.getElementById('emailError').innerHTML = "Email already in use";
      return;
    }

    // Password validation
    let strength = checkStrength(pw);
    if(strength < 4){
      document.getElementById('pwError').innerHTML = "Stronger password needed (use uppercase, numbers, symbols)";
      return;
    }
    if(pw !== conf){
      document.getElementById('confirmError').innerHTML = "Passwords do not match";
      return;
    }

    // Terms validation
    if(!terms){
      document.getElementById('termsError').innerHTML = "You must accept the terms";
      return;
    }

    // Register user
    users.push({username:uname, email, password:btoa(pw)});
    setUsers(users);
    
    showRegisterMessage('✅ Registration successful! Redirecting to login...', true);
    document.getElementById('registerForm').reset();
    document.getElementById('strengthBar').style.width = '0%';
    
    setTimeout(function() {
      window.location.href = 'login.html';
    }, 2000);
  };

  // Password strength meter
  regPassword.oninput = function() {
    let s = checkStrength(this.value);
    const bars = ["#e74c3c","#e67e22", "#f1c40f", "#2ecc71"];
    const texts = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
    
    let strengthBar = document.getElementById('strengthBar');
    let strengthText = document.getElementById('strengthText');
    
    strengthBar.style.background = bars[Math.max(0, s-2)];
    strengthBar.style.width = (s * 20) + '%';
    strengthText.textContent = 'Password strength: ' + texts[Math.max(0, s-1)];
  };
}