// =============================================================================
// ALGOLAB — Global Navigation Authentication Controller (Phase 15 / 18A)
//
// Automatically mounts into the sidebar and navbar on every page, checks session
// state via /api/auth/me, and renders Login/Register or User/Logout controls.
// =============================================================================

import { resolveApiConfig } from './api-config.js';

export async function initAuthNav() {
  const authSlot = document.getElementById('nav-auth-slot');
  const navLinks = document.getElementById('nav-links');
  const mobileAuth = document.getElementById('mobile-auth-widget');

  if (!authSlot && !navLinks) return;

  const apiConfig = resolveApiConfig();
  if (!apiConfig.authUrl) {
    // Offline mode: render basic login/register links
    renderLoggedOut(authSlot, navLinks, mobileAuth);
    return;
  }

  try {
    const res = await fetch(`${apiConfig.authUrl}/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        renderLoggedIn(authSlot, navLinks, mobileAuth, data.user, apiConfig.authUrl);
        return;
      }
    }
  } catch (err) {
    // Server unreachable or network error
  }

  renderLoggedOut(authSlot, navLinks, mobileAuth);
}

function renderLoggedIn(authSlot, navLinks, mobileAuth, user, authUrl) {
  // 1. Sidebar Account Slot
  if (authSlot) {
    const firstName = user.name ? user.name.split(' ')[0] : 'Student';
    authSlot.innerHTML = `
      <div class="sidebar-user-card">
        <div class="user-avatar-circle">👤</div>
        <div class="user-meta">
          <div class="user-display-name">${escapeHtml(user.name || 'Student')}</div>
          <div class="user-status-text"><span class="user-online-dot"></span> Active Session</div>
        </div>
      </div>
      <button id="nav-logout-btn" class="nav-logout-button" type="button" aria-label="Sign out">
        <span class="nav-icon">🚪</span>
        <span class="nav-text">Sign Out</span>
      </button>
    `;

    bindLogout(document.getElementById('nav-logout-btn'), authUrl);
  }

  // 2. Mobile Topbar Chip
  if (mobileAuth) {
    const firstName = user.name ? user.name.split(' ')[0] : 'Student';
    mobileAuth.innerHTML = `
      <a href="dashboard.html" class="mobile-user-chip" title="Go to Dashboard">
        👤 <span>${escapeHtml(firstName)}</span>
      </a>
    `;
  }

  // 3. Backward Compatibility with legacy navLinks container if present
  if (navLinks) {
    let dashLink = navLinks.querySelector('a[href="dashboard.html"]');
    if (!dashLink) {
      const li = document.createElement('li');
      li.innerHTML = '<a href="dashboard.html" class="nav-link"><span class="nav-icon">📊</span><span class="nav-text">Dashboard</span></a>';
      const practiceLink = navLinks.querySelector('a[href="practice.html"]');
      if (practiceLink && practiceLink.parentElement) {
        practiceLink.parentElement.insertAdjacentElement('afterend', li);
      }
    }

    // If no dedicated authSlot, append legacy controls
    if (!authSlot) {
      const existing = navLinks.querySelectorAll('.nav-auth-item');
      existing.forEach(el => el.remove());

      const userLi = document.createElement('li');
      userLi.className = 'nav-auth-item';
      userLi.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-left: 10px;">
          <a href="dashboard.html" class="nav-user-badge">👤 ${escapeHtml(user.name.split(' ')[0])}</a>
          <button id="legacy-logout-btn" class="btn btn-secondary" style="font-size: 0.78rem; padding: 4px 10px; height: auto;">Logout</button>
        </div>
      `;
      navLinks.appendChild(userLi);
      bindLogout(document.getElementById('legacy-logout-btn'), authUrl);
    }
  }
}

function renderLoggedOut(authSlot, navLinks, mobileAuth) {
  const currentPath = window.location.pathname.toLowerCase();
  const isLogin = currentPath.includes('login');
  const isRegister = currentPath.includes('register');

  // 1. Sidebar Account Slot
  if (authSlot) {
    authSlot.innerHTML = `
      <a href="login.html" class="nav-link ${isLogin ? 'active' : ''}">
        <span class="nav-icon">🔑</span>
        <span class="nav-text">Login</span>
      </a>
      <a href="register.html" class="nav-link ${isRegister ? 'active' : ''}">
        <span class="nav-icon">✨</span>
        <span class="nav-text">Register</span>
      </a>
    `;
  }

  // 2. Mobile Topbar Chip
  if (mobileAuth) {
    mobileAuth.innerHTML = `
      <a href="login.html" class="mobile-login-chip">Login</a>
    `;
  }

  // 3. Backward Compatibility with legacy navLinks
  if (navLinks && !authSlot) {
    const existing = navLinks.querySelectorAll('.nav-auth-item');
    existing.forEach(el => el.remove());

    const authLi = document.createElement('li');
    authLi.className = 'nav-auth-item';
    authLi.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-left: 10px;">
        <a href="login.html" class="nav-login-link">Login</a>
        <a href="register.html" class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 12px; height: auto;">Register</a>
      </div>
    `;
    navLinks.appendChild(authLi);
  }
}

function bindLogout(btn, authUrl) {
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await fetch(`${authUrl}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (_) {}
    window.location.href = 'index.html';
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthNav);
  } else {
    initAuthNav();
  }
}
