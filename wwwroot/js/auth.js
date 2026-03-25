(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const underline = document.getElementById('tabUnderlineBar');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const loginMessage = document.getElementById('loginMessage');
    const signupMessage = document.getElementById('signupMessage');

    const loginEyeBtn = document.getElementById('loginEyeBtn');
    const signupEyeBtn = document.getElementById('signupEyeBtn');

    tabLogin.addEventListener('click', () => activateTab('login'));
    tabSignup.addEventListener('click', () => activateTab('signup'));

    loginEyeBtn.addEventListener('click', () => togglePassword('loginPassword'));
    signupEyeBtn.addEventListener('click', () => togglePassword('signupPassword'));

    loginForm.addEventListener('submit', onLoginSubmit);
    signupForm.addEventListener('submit', onSignupSubmit);

        // Rotate example conversions (supported units only)
    const meterExample = document.getElementById('meterExample');
    if (meterExample) {
      const examples = [
        '1 feet = 12 inch',
        '3 yard = 9 feet',
        '1 kg = 1000 g',
        '1 litre = 1000 millilitre',
        '1 gallon = 3.78541 litre',
        '0 celsius = 32 fahrenheit',
        '273.15 kelvin = 0 celsius'
      ];

      let idx = 0;
      setInterval(() => {
        idx = (idx + 1) % examples.length;
        meterExample.textContent = examples[idx];
      }, 2000);
    }

    function activateTab(which) {
      const isLogin = which === 'login';

      tabLogin.classList.toggle('isActive', isLogin);
      tabSignup.classList.toggle('isActive', !isLogin);

      loginForm.classList.toggle('isActive', isLogin);
      signupForm.classList.toggle('isActive', !isLogin);

      // underline movement
      underline.style.left = isLogin ? '22px' : 'calc(50% + 22px)';

      clearMessage(loginMessage);
      clearMessage(signupMessage);
    }

    function togglePassword(inputId) {
      const input = document.getElementById(inputId);
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    async function onSignupSubmit(e) {
      e.preventDefault();
      clearMessage(signupMessage);

      const formData = new FormData(signupForm);
      const username = (formData.get('username') || '').toString().trim();
      const email = (formData.get('email') || '').toString().trim();
      const password = (formData.get('password') || '').toString();

      if (!username || !email || !password) {
        setError(signupMessage, 'All fields are required.');
        return;
      }

      const res = await window.qm.api.register(username, email, password);

      if (!res.ok) {
        setError(signupMessage, extractError(res));
        return;
      }

      setOk(signupMessage, 'User Created. Please login.');
      activateTab('login');
    }

    async function onLoginSubmit(e) {
      e.preventDefault();
      clearMessage(loginMessage);

      const formData = new FormData(loginForm);
      const login = (formData.get('login') || '').toString().trim();
      const password = (formData.get('password') || '').toString();

      if (!login || !password) {
        setError(loginMessage, 'Login and password are required.');
        return;
      }

      const res = await window.qm.api.login(login, password);

      if (!res.ok) {
        setError(loginMessage, extractError(res));
        return;
      }

      // Redirect to app
      window.location.href = '/';
    }

    function extractError(res) {
      // Backend errors might be plain string or json with message fields
      if (typeof res.data === 'string') return res.data;
      if (res.data && res.data.errorMessage) return res.data.errorMessage;
      if (res.rawText) return res.rawText;
      return `Request failed (${res.status}).`;
    }

    function clearMessage(el) {
      el.textContent = '';
      el.classList.remove('isError', 'isOk');
    }

    function setError(el, msg) {
      el.textContent = msg;
      el.classList.add('isError');
      el.classList.remove('isOk');
    }

    function setOk(el, msg) {
      el.textContent = msg;
      el.classList.add('isOk');
      el.classList.remove('isError');
    }
  });
})();