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