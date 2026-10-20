// =============================================================================
// ALGOLAB — Student Registration Controller (Phase 15)
// =============================================================================

import { resolveApiConfig } from './api-config.js';

export function initRegister() {
  const form = document.getElementById('register-form');
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const confirmPasswordInput = document.getElementById('reg-confirm-password');
  const submitBtn = document.getElementById('reg-submit-btn');
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

  let isSubmitting = false;

  async function handleRegister(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isSubmitting) return;

    hideAlert();

    const name = nameInput?.value?.trim() || '';
    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';

    // Client pre-validation
    if (name.length < 2) {
      showAlert('Please enter your full name (at least 2 characters).');
      nameInput?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Please enter a valid email address.');
      emailInput?.focus();
      return;
    }

    if (password.length < 8) {
      showAlert('Password must be at least 8 characters long.');
      passwordInput?.focus();
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please verify your password.');
      confirmPasswordInput?.focus();
      return;
    }

    if (!apiConfig.authUrl) {
      showAlert('Authentication service is offline in Demo Mode. Start the local backend server (npm start in backend/runner) to register.');
      return;
    }

    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';
    }

    try {
      const res = await fetch(`${apiConfig.authUrl}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (_) {
        data = {};
      }

      if (res.status === 201) {
        showAlert('Account created successfully! Redirecting to login...', false);
        setTimeout(() => {
          window.location.href = 'login.html?registered=true';
        }, 800);
      } else {
        showAlert(data.error || 'Registration failed. Please try again.');
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      }
    } catch (err) {
      showAlert(`Unable to reach authentication service: ${err.message}`);
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    }
  }

  if (form) {
    form.addEventListener('submit', handleRegister);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      if (!form) {
        handleRegister(e);
      }
    });
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegister);
  } else {
    initRegister();
  }
}
