// =============================================================================
// ALGOLAB — Student Login Controller (Phase 15)
// =============================================================================

import { resolveApiConfig } from './api-config.js';

export function initLogin() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');
  const alertBox = document.getElementById('auth-alert');

  if (!form && !submitBtn) return;

  const apiConfig = resolveApiConfig();

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.textContent = msg;
    if (isError) {
      alertBox.style.background = '#fef2f2';
      alertBox.style.border = '1px solid #fecaca';
      alertBox.style.color = '#991b1b';
    } else {
      alertBox.style.background = '#f0fdf4';
      alertBox.style.border = '1px solid #bbf7d0';
      alertBox.style.color = '#166534';
    }
  }

  function hideAlert() {
    if (alertBox) alertBox.style.display = 'none';
  }

  // Check URL parameters for status notices
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('registered') === 'true') {
    showAlert('Account created successfully! Please log in with your credentials.', false);
  } else if (urlParams.get('loggedOut') === 'true') {
    showAlert('You have been logged out successfully.', false);
  }

  let isSubmitting = false;

  async function handleLogin(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isSubmitting) return;

    hideAlert();

    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';

    if (!email) {
      showAlert('Please enter your email address.');
      emailInput?.focus();
      return;
    }
    if (!password) {
      showAlert('Please enter your password.');
      passwordInput?.focus();
      return;
    }

    if (!apiConfig.authUrl) {
      showAlert('Authentication service is offline in Demo Mode. Start the local backend server (npm start in backend/runner) to log in.');
      return;
    }

    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
    }

    try {
      const res = await fetch(`${apiConfig.authUrl}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await res.json();
      } catch (_) {
        data = {};
      }

      if (res.status === 200) {
        showAlert('Login successful! Loading your dashboard...', false);

        // Check if returnUrl was passed
        const returnUrl = urlParams.get('returnUrl') || 'dashboard.html';

        setTimeout(() => {
          window.location.href = returnUrl;
        }, 500);
      } else {
        showAlert(data.error || 'Invalid email or password.');
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Log In';
        }
      }
    } catch (err) {
      showAlert(`Unable to reach authentication service: ${err.message}`);
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
    }
  }

  if (form) {
    form.addEventListener('submit', handleLogin);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      // If button is inside form, the form submit handler handles it.
      // But if outside or not submitted, trigger handleLogin directly.
      if (!form) {
        handleLogin(e);
      }
    });
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogin);
  } else {
    initLogin();
  }
}
