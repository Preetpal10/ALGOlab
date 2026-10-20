// =============================================================================
// ALGOLAB — Student Dashboard Controller (Phase 15)
//
// Manages authentication verification, metrics aggregation, recent submission
// history display, and code inspection modal.
// =============================================================================

import { resolveApiConfig } from './api-config.js';

export async function initDashboard() {
  const profileSub = document.getElementById('student-profile-sub');
  const alertBox = document.getElementById('dash-alert');
  const loadingBox = document.getElementById('dash-loading');
  const contentBox = document.getElementById('dash-content');

  // Metric elements
  const statSolved = document.getElementById('stat-solved');
  const statSolvedSub = document.getElementById('stat-solved-sub');
  const statAttempted = document.getElementById('stat-attempted');
  const statSubmissions = document.getElementById('stat-submissions');
  const statAcceptance = document.getElementById('stat-acceptance');
  const topicContainer = document.getElementById('topic-progress-container');

  // Submissions elements
  const submissionsTbody = document.getElementById('submissions-tbody');
  const submissionsEmpty = document.getElementById('submissions-empty');
  const submissionsTableWrap = document.getElementById('submissions-table-wrap');

  // Solved / In Progress lists
  const solvedList = document.getElementById('solved-list');
  const solvedEmpty = document.getElementById('solved-empty');
  const countSolvedTab = document.getElementById('count-solved-tab');

  const attemptedList = document.getElementById('attempted-list');
  const attemptedEmpty = document.getElementById('attempted-empty');
  const countAttemptedTab = document.getElementById('count-attempted-tab');

  // Modal elements
  const codeModal = document.getElementById('code-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtext = document.getElementById('modal-subtext');
  const modalCode = document.getElementById('modal-code');
  const modalCloseBtn = document.getElementById('modal-close-btn');

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

  // 1. Authenticate user
  if (!apiConfig.authUrl) {
    if (loadingBox) loadingBox.style.display = 'none';
    showAlert('Database and authentication services are offline in Demo Mode. Connect your local backend runner (npm start in backend/runner) to use the student dashboard.');
    return;
  }

  let currentUser = null;
  try {
    const authRes = await fetch(`${apiConfig.authUrl}/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (authRes.status === 401) {
      window.location.href = 'login.html?returnUrl=dashboard.html';
      return;
    }

    if (!authRes.ok) {
      throw new Error(`Authentication check returned status ${authRes.status}`);
    }

    const authData = await authRes.json();
    if (!authData.authenticated || !authData.user) {
      window.location.href = 'login.html?returnUrl=dashboard.html';
      return;
    }

    currentUser = authData.user;
  } catch (err) {
    if (loadingBox) loadingBox.style.display = 'none';
    showAlert(`Failed to verify session: ${err.message}. Please verify the backend is running.`);
    return;
  }

  // Render profile header
  if (profileSub && currentUser) {
    const joinDate = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active Student';
    profileSub.textContent = `Welcome back, ${currentUser.name} (${currentUser.email}) • Member since ${joinDate}`;
  }

  // 2. Fetch Progress and Submissions in parallel
  try {
    const [progressRes, submissionsRes] = await Promise.all([
      fetch(apiConfig.progressUrl, { credentials: 'include' }),
      fetch(`${apiConfig.submissionsUrl}?limit=20`, { credentials: 'include' })
    ]);

    if (!progressRes.ok || !submissionsRes.ok) {
      throw new Error('Database service returned an error while loading progress data.');
    }

    const progressData = await progressRes.json();
    const submissionsData = await submissionsRes.json();

    renderProgress(progressData);
    renderSubmissions(submissionsData);

    if (loadingBox) loadingBox.style.display = 'none';
    if (contentBox) contentBox.style.display = 'block';

  } catch (err) {
    if (loadingBox) loadingBox.style.display = 'none';
    showAlert(`Error loading dashboard records: ${err.message}`);
  }

  function renderProgress(p) {
    if (statSolved) statSolved.textContent = p.uniqueSolved || 0;
    if (statSolvedSub) {
      const pct = p.totalCatalogProblems ? Math.round((p.uniqueSolved / p.totalCatalogProblems) * 100) : 0;
      statSolvedSub.textContent = `${pct}% of ${p.totalCatalogProblems} catalog problems completed`;
    }
    if (statAttempted) statAttempted.textContent = p.uniqueAttempted || 0;
    if (statSubmissions) statSubmissions.textContent = p.totalSubmissions || 0;
    if (statAcceptance) statAcceptance.textContent = `${p.acceptanceRate || 0}%`;

    // Render topic breakdown
    if (topicContainer && Array.isArray(p.topicProgress)) {
      topicContainer.innerHTML = p.topicProgress.map(tp => {
        const pct = tp.total > 0 ? Math.round((tp.solved / tp.total) * 100) : 0;
        return `
          <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: 8px; padding: 14px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.88rem; color: #1e293b;">${escapeHtml(tp.topic)}</span>
              <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">${tp.solved} / ${tp.total}</span>
            </div>
            <div class="topic-progress-bar-bg">
              <div class="topic-progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-light); margin-top: 4px; text-align: right;">${pct}% complete</div>
          </div>
        `;
      }).join('');
    }

    // Solved list
    if (countSolvedTab) countSolvedTab.textContent = p.solvedProblems?.length || 0;
    if (p.solvedProblems && p.solvedProblems.length > 0) {
      if (solvedEmpty) solvedEmpty.style.display = 'none';
      if (solvedList) {
        solvedList.innerHTML = p.solvedProblems.map(sp => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 6px;">
            <div>
              <strong style="font-size: 0.88rem; color: #166534;">${escapeHtml(sp.title)}</strong>
              <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(sp.topic)} • ${escapeHtml(sp.difficulty)}</div>
            </div>
            <a href="practice.html?problem=${encodeURIComponent(sp.problemId)}" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 10px;">Solve Again</a>
          </div>
        `).join('');
      }
    } else {
      if (solvedEmpty) solvedEmpty.style.display = 'block';
    }

    // In-progress / Attempted list
    if (countAttemptedTab) countAttemptedTab.textContent = p.attemptedUnsolvedProblems?.length || 0;
    if (p.attemptedUnsolvedProblems && p.attemptedUnsolvedProblems.length > 0) {
      if (attemptedEmpty) attemptedEmpty.style.display = 'none';
      if (attemptedList) {
        attemptedList.innerHTML = p.attemptedUnsolvedProblems.map(ap => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
            <div>
              <strong style="font-size: 0.88rem; color: #92400e;">${escapeHtml(ap.title)}</strong>
              <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(ap.topic)} • ${escapeHtml(ap.difficulty)}</div>
            </div>
            <a href="practice.html?problem=${encodeURIComponent(ap.problemId)}" class="btn btn-primary" style="font-size: 0.75rem; padding: 4px 10px;">Continue &rarr;</a>
          </div>
        `).join('');
      }
    } else {
      if (attemptedEmpty) attemptedEmpty.style.display = 'block';
    }
  }

  function renderSubmissions(subData) {
    const list = subData.submissions || [];
    if (!list || list.length === 0) {
      if (submissionsTableWrap) submissionsTableWrap.style.display = 'none';
      if (submissionsEmpty) submissionsEmpty.style.display = 'block';
      return;
    }

    if (submissionsTableWrap) submissionsTableWrap.style.display = 'block';
    if (submissionsEmpty) submissionsEmpty.style.display = 'none';

    if (submissionsTbody) {
      submissionsTbody.innerHTML = list.map(sub => {
        let badgeStyle = 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';
        if (sub.verdict === 'Accepted') {
          badgeStyle = 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';
        } else if (sub.verdict === 'Compilation Error') {
          badgeStyle = 'background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;';
        } else if (sub.verdict === 'Time Limit Exceeded') {
          badgeStyle = 'background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff;';
        }

        const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—';
        const runtimeStr = sub.executionTimeMs !== null ? `${sub.executionTimeMs}ms` : '—';

        return `
          <tr>
            <td style="font-family: Consolas, monospace; font-size: 0.8rem; color: #64748b;">#${sub.id}</td>
            <td>
              <a href="practice.html?problem=${encodeURIComponent(sub.problemId)}" style="font-weight: 600; color: #2563eb; text-decoration: none;">
                ${escapeHtml(sub.problemId)}
              </a>
            </td>
            <td>
              <span class="status-badge" style="font-size: 0.75rem; padding: 3px 8px; border-radius: 9999px; font-weight: 600; ${badgeStyle}">
                ${escapeHtml(sub.verdict)}
              </span>
            </td>
            <td>${sub.passedTests} / ${sub.totalTests}</td>
            <td>${runtimeStr}</td>
            <td style="font-size: 0.8rem; color: #64748b;">${dateStr}</td>
            <td>
              <button class="btn btn-secondary view-code-btn" data-id="${sub.id}" style="padding: 3px 8px; font-size: 0.76rem;">
                View Code
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Wire View Code modal buttons
      submissionsTbody.querySelectorAll('.view-code-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const subId = btn.getAttribute('data-id');
          await openCodeModal(subId);
        });
      });
    }
  }

  async function openCodeModal(subId) {
    if (!codeModal) return;
    codeModal.style.display = 'flex';
    if (modalTitle) modalTitle.textContent = `Submission #${subId}`;
    if (modalSubtext) modalSubtext.textContent = 'Loading source code...';
    if (modalCode) modalCode.textContent = '// Fetching code...';

    try {
      const res = await fetch(`${apiConfig.submissionsUrl}/${subId}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Could not retrieve submission code.');
      }
      const data = await res.json();
      const s = data.submission;
      if (modalSubtext) {
        modalSubtext.textContent = `Problem: ${s.problemId} • Verdict: ${s.verdict} • Passed: ${s.passedTests}/${s.totalTests}`;
      }
      if (modalCode) {
        modalCode.textContent = s.sourceCode;
      }
    } catch (err) {
      if (modalSubtext) modalSubtext.textContent = 'Failed to load code.';
      if (modalCode) modalCode.textContent = `// Error: ${err.message}`;
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      if (codeModal) codeModal.style.display = 'none';
    });
  }

  if (codeModal) {
    codeModal.addEventListener('click', (e) => {
      if (e.target === codeModal) {
        codeModal.style.display = 'none';
      }
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
}
