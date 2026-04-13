/* ===========================
   COORDINATOR PORTAL — APP JS
   =========================== */

// ── APP STATE ──
const APP = {
  theme: localStorage.getItem('cp-theme') || 'light',
  role: null,
  user: null,
  users: [],
  passwordChangeUserId: null,
  currentPage: 'dashboard',
  notifPanelOpen: false,
  sidebarCollapsed: localStorage.getItem('cp-sidebar-collapsed') === 'true',
};

// ── SEED DATA ──
const DATA = {
  coordinators: [],
  categories: ['Incubators', 'Startups', 'Email Outreach', 'Database Work', 'Events', 'Research'],
  tasks: [],
  resources: [
    { id: 'r1', name: 'Cold Email Template', desc: 'Standard outreach email for incubators and startups', type: 'Email Template', icon: '📧', category: 'Templates', url: '#' },
    { id: 'r2', name: 'Follow-up Email #1', desc: 'First follow-up, send 3 days after initial email', type: 'Email Template', icon: '📨', category: 'Templates', url: '#' },
    { id: 'r3', name: 'Follow-up Email #2', desc: 'Second follow-up with value proposition', type: 'Email Template', icon: '📩', category: 'Templates', url: '#' },
    { id: 'r4', name: 'Startup Pitch Deck', desc: 'Main pitch deck for startup outreach', type: 'Google Slides', icon: '📊', category: 'Docs', url: '#' },
    { id: 'r5', name: 'Outreach Guidelines', desc: 'Step-by-step guide for conducting outreach', type: 'Document', icon: '📋', category: 'Guidelines', url: '#' },
    { id: 'r6', name: 'Database Template', desc: 'Master Excel sheet format for data entry', type: 'Google Sheet', icon: '📝', category: 'Docs', url: '#' },
    { id: 'r7', name: 'Response Tracker', desc: 'Track all replies and follow-up status', type: 'Google Sheet', icon: '📈', category: 'Docs', url: '#' },
    { id: 'r8', name: 'Coordinator Handbook', desc: 'Complete handbook for new coordinators', type: 'PDF', icon: '📖', category: 'Guidelines', url: '#' },
    { id: 'r9', name: 'Weekly Report Form', desc: 'Submit your weekly progress report here', type: 'Google Form', icon: '🔗', category: 'Links', url: '#' },
    { id: 'r10', name: 'Incubator Master List', desc: 'Complete database of 500+ Indian incubators', type: 'Google Sheet', icon: '🏢', category: 'Links', url: '#' },
  ],
  notifications: []
};

// ── HELPERS ──
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem('cp-users') || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem('cp-users', JSON.stringify(users));
  APP.users = users;
}

function normalizeUsername(username) {
  return (username || '').trim().toLowerCase();
}

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

function getUserById(id) {
  return APP.users.find(u => u.id === id) || null;
}

function getUsersByRole(role) {
  return APP.users.filter(u => u.role === role).map(u => ({
    ...u,
    initials: getInitials(u.name)
  }));
}

function getCoordinatorStats(userId) {
  const tasks = DATA.tasks.filter(t => t.assignedTo === userId);
  const done = tasks.filter(t => t.status === 'Done').length;
  const inProg = tasks.filter(t => t.status === 'In Progress').length;
  const performance = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + calcTaskProgress(t), 0) / tasks.length)
    : 0;
  return { tasks, done, inProg, performance };
}

async function ensureSeedManagers() {
  const existing = loadUsers();
  if (existing.length) {
    APP.users = existing;
    return;
  }
  const tempPassword = 'E-Cell@2025';
  const passwordHash = await hashPassword(tempPassword);
  const now = new Date().toISOString();
  const seedUsers = [
    {
      id: crypto.randomUUID(),
      name: 'Chetan Jangid',
      username: 'chetan',
      passwordHash,
      role: 'manager',
      mustChangePassword: true,
      createdAt: now
    },
    {
      id: crypto.randomUUID(),
      name: 'Karandeep Singh',
      username: 'karandeep',
      passwordHash,
      role: 'manager',
      mustChangePassword: true,
      createdAt: now
    }
  ];
  saveUsers(seedUsers);
}
function calcTaskProgress(task) {
  const subs = task.subtasks;
  if (!subs || !subs.length) return 0;
  let total = 0, done = 0;
  subs.forEach(s => {
    if (s.type === 'checkbox') { total += 1; done += s.value ? 1 : 0; }
    else { total += s.target || 100; done += Math.min(s.value || 0, s.target || 100); }
  });
  return total ? Math.round((done / total) * 100) : 0;
}

function getCoordinator(id) {
  const coord = APP.users.find(u => u.id === id && u.role === 'coordinator');
  if (!coord) return {};
  return { ...coord, initials: getInitials(coord.name) };
}
function getTask(id) { return DATA.tasks.find(t => t.id === id); }

function statusBadge(status) {
  const map = { 'Done': 'green', 'In Progress': 'blue', 'Not Started': 'gray' };
  return `<span class="badge badge-${map[status] || 'gray'}">${status}</span>`;
}
function catBadge(cat) {
  const map = { 'Incubators':'purple','Startups':'orange','Email Outreach':'blue','Database Work':'yellow','Events':'green','Research':'gray' };
  return `<span class="badge badge-${map[cat]||'gray'}">${cat}</span>`;
}
function progressColor(p) { return p >= 80 ? 'green' : p >= 40 ? '' : 'red'; }

function formatDeadline(d) {
  if (!d) return '—';
  const date = new Date(d), now = new Date();
  const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  const fmt = date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  if (diff < 0) return `<span class="deadline-near">${fmt} (Overdue)</span>`;
  if (diff <= 5) return `<span class="deadline-near">${fmt} (${diff}d left)</span>`;
  return `<span class="deadline-ok">${fmt}</span>`;
}

function unreadCount() { return DATA.notifications.filter(n => !n.read).length; }

// ── THEME ──
function setTheme(t) {
  APP.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('cp-theme', t);
  document.getElementById('theme-toggle-icon').textContent = t === 'dark' ? '☀️' : '🌙';
}

// ── SIDEBAR ──
function toggleSidebar() {
  APP.sidebarCollapsed = !APP.sidebarCollapsed;
  localStorage.setItem('cp-sidebar-collapsed', APP.sidebarCollapsed);
  document.getElementById('sidebar').classList.toggle('collapsed', APP.sidebarCollapsed);
}
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebar-overlay').classList.add('visible');
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ── NAVIGATION ──
function navigate(page, extra) {
  APP.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll(`[data-nav="${page}"]`).forEach(n => n.classList.add('active'));

  // Update topbar
  const titles = {
    dashboard: ['Dashboard', 'Overview of all activities'],
    tasks: ['Tasks', 'Manage and track all tasks'],
    timeline: ['Timeline', 'Project timeline view'],
    resources: ['Resources', 'Templates, docs, and links'],
    notifications: ['Notifications', 'Updates and alerts'],
    performance: ['Performance', 'Team performance metrics'],
    settings: ['Settings', 'Preferences and account'],
  };
  if (titles[page]) {
    document.getElementById('topbar-title').textContent = titles[page][0];
    document.getElementById('topbar-subtitle').textContent = titles[page][1];
  }

  // Render page content
  const renderMap = {
    dashboard: renderDashboard,
    tasks: renderTasks,
    timeline: renderTimeline,
    resources: renderResources,
    notifications: renderNotifications,
    performance: renderPerformance,
    settings: renderSettings,
  };
  if (renderMap[page]) renderMap[page](extra);
  closeMobileSidebar();
  window.scrollTo(0,0);
}

// ── NOTIFICATIONS ──
function toggleNotifPanel() {
  APP.notifPanelOpen = !APP.notifPanelOpen;
  document.getElementById('notif-panel').classList.toggle('open', APP.notifPanelOpen);
}
function renderNotifPanel() {
  const list = document.getElementById('notif-list');
  const cnt = document.getElementById('notif-count');
  const uc = unreadCount();
  cnt.textContent = uc || '';
  cnt.style.display = uc ? '' : 'none';

  list.innerHTML = DATA.notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead('${n.id}')">
      ${!n.read ? '<div class="notif-dot-sm"></div>' : '<div style="width:8px"></div>'}
      <div>
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}
function markRead(id) {
  const n = DATA.notifications.find(x => x.id === id);
  if (n) n.read = true;
  renderNotifPanel();
}
function markAllRead() {
  DATA.notifications.forEach(n => n.read = true);
  renderNotifPanel();
}

// ── DASHBOARD ──
function renderDashboard() {
  const total = DATA.tasks.length;
  const done = DATA.tasks.filter(t => t.status === 'Done').length;
  const inProg = DATA.tasks.filter(t => t.status === 'In Progress').length;
  const notStarted = DATA.tasks.filter(t => t.status === 'Not Started').length;
  const avgProg = total ? Math.round(DATA.tasks.reduce((s,t) => s + calcTaskProgress(t), 0) / total) : 0;

  const isManager = APP.role === 'manager';
  const el = document.getElementById('page-dashboard');

  let tasksToShow = DATA.tasks;
  if (!isManager && APP.user) {
    tasksToShow = DATA.tasks.filter(t => t.assignedTo === APP.user.id);
  }

  el.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Good ${greeting()}, ${APP.user?.name?.split(' ')[0] || 'there'} 👋</div>
        <div class="section-desc">${isManager ? "Here's your team overview for today." : "Here's what you need to do today."}</div>
      </div>
      ${isManager ? `<div class="section-actions">
        <button class="btn btn-primary" onclick="openNewTaskModal()">＋ New Task</button>
      </div>` : ''}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--accent-light);color:var(--accent)">📋</div>
        <div class="stat-label">Total Tasks</div>
        <div class="stat-value">${isManager ? total : tasksToShow.length}</div>
        <div class="stat-change">All categories</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--green-light);color:var(--green)">✅</div>
        <div class="stat-label">Completed</div>
        <div class="stat-value">${isManager ? done : tasksToShow.filter(t=>t.status==='Done').length}</div>
        <div class="stat-change"><span class="up">${isManager ? Math.round(done/total*100) : Math.round(tasksToShow.filter(t=>t.status==='Done').length/Math.max(tasksToShow.length,1)*100)}%</span> of total</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--yellow-light);color:var(--yellow)">⏳</div>
        <div class="stat-label">In Progress</div>
        <div class="stat-value">${isManager ? inProg : tasksToShow.filter(t=>t.status==='In Progress').length}</div>
        <div class="stat-change">Active tasks</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--purple-light);color:var(--purple)">📊</div>
        <div class="stat-label">${isManager ? 'Avg Progress' : 'My Progress'}</div>
        <div class="stat-value">${isManager ? avgProg : (tasksToShow.length ? Math.round(tasksToShow.reduce((s,t)=>s+calcTaskProgress(t),0)/tasksToShow.length) : 0)}%</div>
        <div class="stat-change">Across all tasks</div>
      </div>
      ${isManager ? `<div class="stat-card">
        <div class="stat-icon" style="background:var(--orange-light);color:var(--orange)">👥</div>
        <div class="stat-label">Coordinators</div>
        <div class="stat-value">${getUsersByRole('coordinator').length}</div>
        <div class="stat-change">Active members</div>
      </div>` : ''}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">${isManager ? 'All Tasks' : 'My Tasks'}</span>
        <button class="btn btn-ghost btn-sm" onclick="navigate('tasks')">View all →</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Task</th><th>Category</th>
            ${isManager ? '<th>Assigned To</th>' : ''}
            <th>Status</th><th>Progress</th><th>Deadline</th>
          </tr></thead>
          <tbody>
            ${tasksToShow.slice(0,5).map(t => {
              const p = calcTaskProgress(t);
              const coord = getCoordinator(t.assignedTo);
              return `<tr style="cursor:pointer" onclick="openTaskDetail('${t.id}')">
                <td class="td-main">${t.name}</td>
                <td>${catBadge(t.category)}</td>
                ${isManager ? `<td>
                  <div class="d-flex items-center gap-2">
                    <div class="avatar" style="width:24px;height:24px;font-size:10px">${coord.initials||'?'}</div>
                    <span>${coord.name||'Unassigned'}</span>
                  </div>
                </td>` : ''}
                <td>${statusBadge(t.status)}</td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-bar"><div class="progress-fill ${progressColor(p)}" style="width:${p}%"></div></div>
                    <span class="progress-pct">${p}%</span>
                  </div>
                </td>
                <td>${formatDeadline(t.deadline)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${isManager ? `
    <div class="mt-6 card">
      <div class="card-header"><span class="card-title">Team Performance</span></div>
      <div class="card-body">
        ${getUsersByRole('coordinator').map(c => {
          const stats = getCoordinatorStats(c.id);
          return `
          <div class="d-flex items-center gap-3 mb-4">
            <div class="avatar">${c.initials}</div>
            <div class="flex-1">
              <div class="d-flex items-center gap-2 mb-2" style="justify-content:space-between">
                <span class="fw-500" style="font-size:13px">${c.name}</span>
                <span class="mono text-sm text-muted">${stats.done}/${stats.tasks.length} done</span>
              </div>
              <div class="progress-bar" style="height:5px">
                <div class="progress-fill ${progressColor(stats.performance)}" style="width:${stats.performance}%"></div>
              </div>
            </div>
            <span class="mono fw-500" style="font-size:13px;min-width:36px;text-align:right">${stats.performance}%</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
  `;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

// ── TASKS PAGE ──
function renderTasks(filter) {
  const isManager = APP.role === 'manager';
  let tasks = DATA.tasks;
  if (!isManager && APP.user) tasks = tasks.filter(t => t.assignedTo === APP.user.id);

  const el = document.getElementById('page-tasks');

  let activeFilter = filter || 'all';
  const catFilter = document.getElementById('cat-filter')?.value || 'all';

  const applyFilter = (f, cat) => {
    activeFilter = f;
    let filtered = tasks;
    if (f !== 'all') filtered = filtered.filter(t => t.status === f);
    if (cat && cat !== 'all') filtered = filtered.filter(t => t.category === cat);
    renderTaskTable(filtered, isManager, 'task-tbody');
    document.querySelectorAll('.task-filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === f);
    });
  };

  el.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">${isManager ? 'All Tasks' : 'My Tasks'}</div>
        <div class="section-desc">${tasks.length} task${tasks.length !== 1 ? 's' : ''} total</div>
      </div>
      <div class="section-actions">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search tasks…" oninput="searchTasks(this.value)" id="task-search">
        </div>
        <select class="form-select" style="height:34px;width:auto" id="cat-filter" onchange="applyTaskFilters()">
          <option value="all">All Categories</option>
          ${DATA.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        ${isManager ? `<button class="btn btn-primary" onclick="openNewTaskModal()">＋ New Task</button>` : ''}
      </div>
    </div>

    <div class="tabs" style="margin-bottom:var(--sp-4)">
      ${['all','In Progress','Not Started','Done'].map(f => `
        <div class="tab task-filter-tab ${f==='all'?'active':''}" data-filter="${f}"
          onclick="filterTasksBy('${f}')">${f === 'all' ? 'All Tasks' : f}
          <span style="margin-left:4px;font-size:11px;color:var(--text-muted)">
            (${f==='all' ? tasks.length : tasks.filter(t=>t.status===f).length})
          </span>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Task Name</th><th>Category</th>
            ${isManager ? '<th>Assigned To</th>' : ''}
            <th>Status</th><th>Progress</th><th>Deadline</th>
            ${isManager ? '<th>Actions</th>' : ''}
          </tr></thead>
          <tbody id="task-tbody">
            ${renderTaskRows(tasks, isManager)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  window.filterTasksBy = (f) => {
    const cat = document.getElementById('cat-filter')?.value || 'all';
    let filtered = tasks;
    if (f !== 'all') filtered = filtered.filter(t => t.status === f);
    if (cat !== 'all') filtered = filtered.filter(t => t.category === cat);
    document.getElementById('task-tbody').innerHTML = renderTaskRows(filtered, isManager);
    document.querySelectorAll('.task-filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === f);
    });
    window._currentTaskFilter = f;
  };

  window.applyTaskFilters = () => {
    filterTasksBy(window._currentTaskFilter || 'all');
  };

  window.searchTasks = (q) => {
    const filtered = tasks.filter(t =>
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.category.toLowerCase().includes(q.toLowerCase())
    );
    document.getElementById('task-tbody').innerHTML = renderTaskRows(filtered, isManager);
  };
}

function renderTaskRows(tasks, isManager) {
  if (!tasks.length) return `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No tasks found</div></div></td></tr>`;
  return tasks.map(t => {
    const p = calcTaskProgress(t);
    const coord = getCoordinator(t.assignedTo);
    return `<tr style="cursor:pointer" onclick="openTaskDetail('${t.id}')">
      <td class="td-main">${t.name}</td>
      <td>${catBadge(t.category)}</td>
      ${isManager ? `<td>
        <div class="d-flex items-center gap-2">
          <div class="avatar" style="width:24px;height:24px;font-size:10px">${coord.initials||'?'}</div>
          <span>${coord.name||'Unassigned'}</span>
        </div>
      </td>` : ''}
      <td>${statusBadge(t.status)}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill ${progressColor(p)}" style="width:${p}%"></div></div>
          <span class="progress-pct">${p}%</span>
        </div>
      </td>
      <td>${formatDeadline(t.deadline)}</td>
      ${isManager ? `<td onclick="event.stopPropagation()">
        <div class="d-flex gap-2">
          <button class="btn btn-ghost btn-sm" onclick="openEditTaskModal('${t.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteTask('${t.id}')">🗑️</button>
        </div>
      </td>` : ''}
    </tr>`;
  }).join('');
}

function renderTaskTable(tasks, isManager, tbodyId) {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = renderTaskRows(tasks, isManager);
}

// ── TASK DETAIL MODAL ──
function openTaskDetail(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const isManager = APP.role === 'manager';
  const coord = getCoordinator(task.assignedTo);
  const p = calcTaskProgress(task);

  const modal = document.getElementById('task-detail-modal');
  document.getElementById('task-detail-body').innerHTML = `
    <div class="d-flex items-center gap-3 mb-4" style="flex-wrap:wrap">
      ${catBadge(task.category)}
      ${statusBadge(task.status)}
      <span class="mono text-sm text-muted">${p}% complete</span>
    </div>

    <div class="task-meta-grid">
      <div class="meta-item">
        <div class="meta-key">Assigned To</div>
        <div class="d-flex items-center gap-2 mt-2">
          <div class="avatar">${coord.initials||'?'}</div>
          <div class="meta-val">${coord.name||'Unassigned'}</div>
        </div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Deadline</div>
        <div class="meta-val mt-2">${formatDeadline(task.deadline)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Overall Progress</div>
        <div class="mt-2">
          <div class="progress-wrap">
            <div class="progress-bar"><div class="progress-fill ${progressColor(p)}" style="width:${p}%"></div></div>
            <span class="progress-pct">${p}%</span>
          </div>
        </div>
      </div>
      ${isManager ? `<div class="meta-item">
        <div class="meta-key">Update Status</div>
        <select class="form-select mt-2" onchange="updateTaskStatus('${task.id}', this.value)">
          ${['Not Started','In Progress','Done'].map(s => `<option ${task.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>` : ''}
    </div>

    <hr class="divider">
    <div class="fw-600 mb-4" style="font-size:14px">📊 Sub-tasks & Metrics</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Metric</th><th>Value</th>${task.subtasks.some(s=>s.target) ? '<th>Target</th><th>Rate</th>' : ''}</tr></thead>
        <tbody>
          ${task.subtasks.map(s => {
            const rate = s.target ? Math.round((s.value/s.target)*100) : null;
            return `<tr class="subtask-row">
              <td>${s.name}</td>
              <td>
                ${s.type === 'checkbox'
                  ? `<span class="badge ${s.value ? 'badge-green' : 'badge-gray'}">${s.value ? '✅ Done' : '❌ Pending'}</span>`
                  : `<input type="number" value="${s.value||0}" min="0"
                      ${!isManager && task.assignedTo !== (APP.user?.id) ? 'disabled' : ''}
                      onchange="updateSubtask('${task.id}','${s.id}',this.value)">`
                }
              </td>
              ${task.subtasks.some(x=>x.target) ? `
                <td class="text-muted">${s.target ? s.target : '—'}</td>
                <td>${rate !== null ? `
                  <div class="progress-wrap">
                    <div class="progress-bar" style="min-width:50px"><div class="progress-fill ${progressColor(rate)}" style="width:${Math.min(rate,100)}%"></div></div>
                    <span class="progress-pct">${rate}%</span>
                  </div>` : '—'}</td>
              ` : ''}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <hr class="divider">
    <div class="fw-600 mb-4" style="font-size:14px">🕐 Timeline</div>
    <div class="timeline">
      ${task.timeline.map(tl => `
        <div class="timeline-item">
          <div class="timeline-dot ${tl.done ? 'done' : 'pending'}"></div>
          <div class="timeline-date">${tl.date}</div>
          <div class="timeline-title">${tl.title}</div>
          <div class="timeline-body">${tl.body}</div>
        </div>
      `).join('')}
    </div>

    <hr class="divider">
    <div class="fw-600 mb-4" style="font-size:14px">💬 Comments</div>
    <div id="comment-list-${task.id}">
      ${task.comments.length ? task.comments.map(c => `
        <div class="comment">
          <div class="avatar" style="width:28px;height:28px;font-size:11px;flex-shrink:0">${c.initials}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-name">${c.user}</span>
              <span class="comment-time">${c.time}</span>
            </div>
            <div class="comment-text">${c.text}</div>
          </div>
        </div>
      `).join('') : '<div class="text-muted text-sm mb-4">No comments yet.</div>'}
    </div>
    <div class="comment-input-row">
      <input class="form-input" id="new-comment-${task.id}" placeholder="Add a comment…">
      <button class="btn btn-primary btn-sm" onclick="addComment('${task.id}')">Send</button>
    </div>
  `;

  document.getElementById('task-detail-title').textContent = task.name;
  openModal('task-detail-modal');
}

function updateSubtask(taskId, subId, val) {
  const task = getTask(taskId);
  if (!task) return;
  const sub = task.subtasks.find(s => s.id === subId);
  if (sub) sub.value = parseFloat(val) || 0;
}

function updateTaskStatus(taskId, status) {
  const task = getTask(taskId);
  if (task) { task.status = status; }
}

function addComment(taskId) {
  const input = document.getElementById(`new-comment-${taskId}`);
  const text = input?.value?.trim();
  if (!text) return;
  const task = getTask(taskId);
  if (!task) return;
  task.comments.push({
    user: APP.user?.name || 'You',
    initials: APP.user?.initials || 'YO',
    text, time: 'Just now'
  });
  input.value = '';
  // Re-render comment list
  const list = document.getElementById(`comment-list-${taskId}`);
  if (list) {
    list.innerHTML = task.comments.map(c => `
      <div class="comment">
        <div class="avatar" style="width:28px;height:28px;font-size:11px;flex-shrink:0">${c.initials}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-name">${c.user}</span>
            <span class="comment-time">${c.time}</span>
          </div>
          <div class="comment-text">${c.text}</div>
        </div>
      </div>
    `).join('');
  }
}

// ── NEW/EDIT TASK MODAL ──
function openNewTaskModal() {
  const modal = document.getElementById('new-task-modal');
  const coordinators = getUsersByRole('coordinator');
  const coordinatorOptions = coordinators.length
    ? coordinators.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
    : `<option value="" disabled selected>No coordinators yet</option>`;
  document.getElementById('new-task-form').innerHTML = `
    <div class="form-group">
      <label class="form-label">Task Name</label>
      <input class="form-input" id="nt-name" placeholder="e.g. Incubator Outreach – Phase 2">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="nt-cat">
          ${DATA.categories.map(c => `<option>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Assigned To</label>
        <select class="form-select" id="nt-assign">
          ${coordinatorOptions}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="nt-status">
          <option>Not Started</option><option>In Progress</option><option>Done</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deadline</label>
        <input type="date" class="form-input" id="nt-deadline">
      </div>
    </div>
  `;
  openModal('new-task-modal');
}

function saveNewTask() {
  const name = document.getElementById('nt-name')?.value?.trim();
  if (!name) { alert('Please enter a task name'); return; }
  const assignedTo = document.getElementById('nt-assign')?.value || '';
  if (!assignedTo) {
    alert('Please add a coordinator before assigning tasks.');
    return;
  }
  const newTask = {
    id: 't' + Date.now(),
    name,
    category: document.getElementById('nt-cat')?.value,
    assignedTo,
    status: document.getElementById('nt-status')?.value || 'Not Started',
    deadline: document.getElementById('nt-deadline')?.value,
    comments: [],
    subtasks: [],
    timeline: [{ date: new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'}), title: 'Task Created', body: 'Task has been created and assigned', done: true }]
  };
  DATA.tasks.unshift(newTask);
  closeModal('new-task-modal');
  renderTasks();
  renderDashboard();
}

function openEditTaskModal(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const coordinators = getUsersByRole('coordinator');
  document.getElementById('new-task-modal-title').textContent = 'Edit Task';
  document.getElementById('new-task-form').innerHTML = `
    <div class="form-group">
      <label class="form-label">Task Name</label>
      <input class="form-input" id="nt-name" value="${task.name}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="nt-cat">
          ${DATA.categories.map(c => `<option ${task.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Assigned To</label>
        <select class="form-select" id="nt-assign">
          ${coordinators.length
            ? coordinators.map(c => `<option value="${c.id}" ${task.assignedTo===c.id?'selected':''}>${c.name}</option>`).join('')
            : `<option value="" disabled selected>No coordinators yet</option>`}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="nt-status">
          ${['Not Started','In Progress','Done'].map(s => `<option ${task.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deadline</label>
        <input type="date" class="form-input" id="nt-deadline" value="${task.deadline||''}">
      </div>
    </div>
  `;
  document.getElementById('save-new-task-btn').onclick = () => {
    task.name = document.getElementById('nt-name')?.value?.trim() || task.name;
    task.category = document.getElementById('nt-cat')?.value;
    task.assignedTo = document.getElementById('nt-assign')?.value;
    task.status = document.getElementById('nt-status')?.value;
    task.deadline = document.getElementById('nt-deadline')?.value;
    closeModal('new-task-modal');
    renderTasks();
  };
  openModal('new-task-modal');
}

function deleteTask(taskId) {
  if (!confirm('Delete this task? This cannot be undone.')) return;
  const idx = DATA.tasks.findIndex(t => t.id === taskId);
  if (idx !== -1) DATA.tasks.splice(idx, 1);
  renderTasks();
  renderDashboard();
}

// ── TIMELINE PAGE ──
function renderTimeline() {
  const el = document.getElementById('page-timeline');
  const isManager = APP.role === 'manager';
  let tasks = DATA.tasks;
  if (!isManager && APP.user) tasks = tasks.filter(t => t.assignedTo === APP.user.id);

  // Group by month
  const byMonth = {};
  tasks.forEach(t => {
    if (!t.deadline) return;
    const d = new Date(t.deadline);
    const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(t);
  });

  el.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Timeline</div>
        <div class="section-desc">All task deadlines in chronological order</div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header"><span class="card-title">📅 Gantt Overview</span></div>
      <div class="card-body">
        ${tasks.map(t => {
          const p = calcTaskProgress(t);
          return `
          <div class="mb-4">
            <div class="d-flex items-center gap-3 mb-2" style="flex-wrap:wrap">
              <span class="fw-500" style="font-size:13px;flex:1;min-width:150px">${t.name}</span>
              ${catBadge(t.category)}
              ${statusBadge(t.status)}
              <span class="text-muted text-sm mono">${formatDeadline(t.deadline)}</span>
            </div>
            <div class="progress-bar" style="height:8px;border-radius:4px">
              <div class="progress-fill ${progressColor(p)}" style="width:${p}%;border-radius:4px"></div>
            </div>
            <div class="text-muted text-sm mt-1">${p}% complete</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${Object.entries(byMonth).sort().map(([month, mTasks]) => `
      <div class="mb-6">
        <div class="fw-600 mb-4" style="font-size:14px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.06em;font-family:var(--font-mono)">${month}</div>
        <div class="timeline">
          ${mTasks.sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map(t => {
            const p = calcTaskProgress(t);
            const coord = getCoordinator(t.assignedTo);
            return `
            <div class="timeline-item" style="cursor:pointer" onclick="openTaskDetail('${t.id}')">
              <div class="timeline-dot ${t.status === 'Done' ? 'done' : t.status === 'In Progress' ? '' : 'pending'}"></div>
              <div class="timeline-date">${new Date(t.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
              <div class="timeline-title">${t.name}</div>
              <div class="d-flex items-center gap-2 mt-1" style="flex-wrap:wrap">
                ${catBadge(t.category)}
                ${statusBadge(t.status)}
                <div class="d-flex items-center gap-1">
                  <div class="avatar" style="width:18px;height:18px;font-size:9px">${coord.initials||'?'}</div>
                  <span class="text-sm text-muted">${coord.name||'Unassigned'}</span>
                </div>
                <span class="mono text-sm" style="color:var(--${progressColor(p)||'accent'})">${p}%</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

// ── RESOURCES ──
function renderResources() {
  const el = document.getElementById('page-resources');
  const cats = [...new Set(DATA.resources.map(r => r.category))];

  el.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Resources</div>
        <div class="section-desc">Everything you need in one place</div>
      </div>
      <div class="section-actions">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search…" oninput="searchResources(this.value)" id="res-search">
        </div>
      </div>
    </div>

    <div class="tabs" id="res-tabs">
      <div class="tab active" onclick="filterRes('all', this)">All</div>
      ${cats.map(c => `<div class="tab" onclick="filterRes('${c}', this)">${c}</div>`).join('')}
    </div>

    <div class="resource-grid" id="res-grid">
      ${renderResourceCards(DATA.resources)}
    </div>
  `;

  window.filterRes = (cat, tab) => {
    document.querySelectorAll('#res-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filtered = cat === 'all' ? DATA.resources : DATA.resources.filter(r => r.category === cat);
    document.getElementById('res-grid').innerHTML = renderResourceCards(filtered);
  };
  window.searchResources = (q) => {
    const filtered = DATA.resources.filter(r =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.desc.toLowerCase().includes(q.toLowerCase())
    );
    document.getElementById('res-grid').innerHTML = renderResourceCards(filtered);
  };
}

function renderResourceCards(resources) {
  if (!resources.length) return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No resources found</div></div>`;
  return resources.map(r => `
    <div class="resource-card" onclick="window.open('${r.url}','_blank')">
      <div class="resource-icon" style="background:var(--accent-light)">${r.icon}</div>
      <div class="resource-name">${r.name}</div>
      <div class="resource-desc">${r.desc}</div>
      <div class="resource-type">${r.type}</div>
    </div>
  `).join('');
}

// ── NOTIFICATIONS PAGE ──
function renderNotifications() {
  const el = document.getElementById('page-notifications');
  el.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Notifications</div><div class="section-desc">${unreadCount()} unread</div></div>
      <div class="section-actions">
        <button class="btn btn-secondary btn-sm" onclick="markAllRead();renderNotifications()">Mark all read</button>
      </div>
    </div>
    <div class="card">
      ${DATA.notifications.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead('${n.id}');renderNotifications()" style="border-radius:0">
          ${!n.read ? '<div class="notif-dot-sm"></div>' : '<div style="width:8px"></div>'}
          <div>
            <div class="notif-text">${n.text}</div>
            <div class="notif-time">${n.time}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── PERFORMANCE PAGE ──
function renderPerformance() {
  const isManager = APP.role === 'manager';
  const el = document.getElementById('page-performance');

  if (!isManager) {
    // Coordinator view — own performance
    const myTasks = DATA.tasks.filter(t => t.assignedTo === APP.user?.id);
    const done = myTasks.filter(t => t.status === 'Done').length;
    const avgP = myTasks.length ? Math.round(myTasks.reduce((s,t)=>s+calcTaskProgress(t),0)/myTasks.length) : 0;

    el.innerHTML = `
      <div class="section-header">
        <div><div class="section-title">My Performance</div><div class="section-desc">Your personal metrics</div></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon" style="background:var(--accent-light);color:var(--accent)">📋</div><div class="stat-label">Total Tasks</div><div class="stat-value">${myTasks.length}</div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--green-light);color:var(--green)">✅</div><div class="stat-label">Completed</div><div class="stat-value">${done}</div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-light);color:var(--yellow)">⏳</div><div class="stat-label">In Progress</div><div class="stat-value">${myTasks.filter(t=>t.status==='In Progress').length}</div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--purple-light);color:var(--purple)">📊</div><div class="stat-label">Avg Progress</div><div class="stat-value">${avgP}%</div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Task Breakdown</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Task</th><th>Category</th><th>Status</th><th>Progress</th><th>Deadline</th></tr></thead>
            <tbody>${myTasks.map(t => {
              const p = calcTaskProgress(t);
              return `<tr onclick="openTaskDetail('${t.id}')" style="cursor:pointer">
                <td class="td-main">${t.name}</td>
                <td>${catBadge(t.category)}</td>
                <td>${statusBadge(t.status)}</td>
                <td><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill ${progressColor(p)}" style="width:${p}%"></div></div><span class="progress-pct">${p}%</span></div></td>
                <td>${formatDeadline(t.deadline)}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
    return;
  }

  // Manager view — team performance
  el.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Team Performance</div><div class="section-desc">Coordinator-level metrics</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon" style="background:var(--accent-light);color:var(--accent)">👥</div><div class="stat-label">Coordinators</div><div class="stat-value">${getUsersByRole('coordinator').length}</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--green-light);color:var(--green)">📋</div><div class="stat-label">Total Tasks</div><div class="stat-value">${DATA.tasks.length}</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-light);color:var(--yellow)">✅</div><div class="stat-label">Completed</div><div class="stat-value">${DATA.tasks.filter(t=>t.status==='Done').length}</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--purple-light);color:var(--purple)">📈</div><div class="stat-label">Avg Score</div><div class="stat-value">${(() => {
        const coords = getUsersByRole('coordinator');
        if (!coords.length) return 0;
        const avg = Math.round(coords.reduce((s, c) => s + getCoordinatorStats(c.id).performance, 0) / coords.length);
        return avg;
      })()}%</div></div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Coordinator Leaderboard</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Coordinator</th><th>Tasks Done</th><th>In Progress</th><th>Performance</th></tr></thead>
          <tbody>
            ${[...getUsersByRole('coordinator')].sort((a,b)=>getCoordinatorStats(b.id).performance - getCoordinatorStats(a.id).performance).map((c,i) => {
              const stats = getCoordinatorStats(c.id);
              return `<tr>
                <td class="mono text-muted">${i+1}</td>
                <td>
                  <div class="d-flex items-center gap-2">
                    <div class="avatar">${c.initials}</div>
                    <div>
                      <div class="fw-500">${c.name}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-green">${stats.done}</span></td>
                <td><span class="badge badge-blue">${stats.inProg}</span></td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-bar"><div class="progress-fill ${progressColor(stats.performance)}" style="width:${stats.performance}%"></div></div>
                    <span class="progress-pct">${stats.performance}%</span>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── SETTINGS ──
function renderSettings() {
  const el = document.getElementById('page-settings');
  const isManager = APP.role === 'manager';
  el.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">Settings</div><div class="section-desc">Account and preferences</div></div>
    </div>

    <div class="card mb-6">
      <div class="card-header"><span class="card-title">Profile</span></div>
      <div class="card-body">
        <div class="d-flex items-center gap-4 mb-6">
          <div class="avatar" style="width:56px;height:56px;font-size:20px">${APP.user?.initials||'?'}</div>
          <div>
            <div class="fw-600" style="font-size:16px">${APP.user?.name||'User'}</div>
            <div class="mt-1"><span class="badge ${APP.role==='manager'?'badge-purple':'badge-blue'}">${APP.role==='manager'?'Manager':'Coordinator'}</span></div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" value="${APP.user?.name||''}" id="s-name">
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveProfile()">Save Changes</button>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header"><span class="card-title">Appearance</span></div>
      <div class="card-body">
        <div class="d-flex items-center" style="justify-content:space-between">
          <div>
            <div class="fw-500">Dark Mode</div>
            <div class="text-muted text-sm">Switch between light and dark theme</div>
          </div>
          <div class="toggle ${APP.theme==='dark'?'on':''}" onclick="toggleThemeToggle(this)"></div>
        </div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header"><span class="card-title">Notifications</span></div>
      <div class="card-body">
        ${[
          ['Task Assignments', 'Get notified when a task is assigned to you', true],
          ['Deadline Reminders', 'Reminders 3 days before deadline', true],
          ['Manager Comments', 'When a manager comments on your task', true],
          ['Progress Updates', 'When task progress is updated by manager', false],
        ].map(([label, desc, on]) => `
          <div class="d-flex items-center mb-4" style="justify-content:space-between">
            <div>
              <div class="fw-500">${label}</div>
              <div class="text-muted text-sm">${desc}</div>
            </div>
            <div class="toggle ${on?'on':''}" onclick="this.classList.toggle('on')"></div>
          </div>
        `).join('')}
      </div>
    </div>

    ${isManager ? `
    <div class="card mb-6">
      <div class="card-header"><span class="card-title">Team Management</span></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" id="tm-name" placeholder="e.g. Ananya Gupta">
          </div>
          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-input" id="tm-username" placeholder="e.g. ananya">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Password</label>
            <input class="form-input" id="tm-password" type="password" placeholder="Set a temporary password">
          </div>
          <div class="form-group" style="align-self:flex-end">
            <button class="btn btn-primary" onclick="addCoordinator()">Add Coordinator</button>
          </div>
        </div>

        <div class="mt-6">
          <div class="fw-600 mb-3" style="font-size:14px">Coordinators</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Username</th><th>Actions</th></tr></thead>
              <tbody>
                ${(() => {
                  const coords = getUsersByRole('coordinator');
                  if (!coords.length) {
                    return `<tr><td colspan="3"><div class="text-muted text-sm">No coordinators yet.</div></td></tr>`;
                  }
                  return coords.map(c => `
                    <tr>
                      <td>${c.name}</td>
                      <td class="mono text-sm">${c.username}</td>
                      <td><button class="btn btn-ghost btn-sm" onclick="removeCoordinator('${c.id}')">Remove</button></td>
                    </tr>
                  `).join('');
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="card">
      <div class="card-header"><span class="card-title">Account</span></div>
      <div class="card-body">
        <button class="btn btn-danger" onclick="logout()">Sign Out</button>
      </div>
    </div>
  `;

  window.saveProfile = () => {
    const name = document.getElementById('s-name')?.value?.trim();
    if (!name) { alert('Please enter a name'); return; }
    if (!APP.user) return;
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === APP.user.id);
    if (idx !== -1) {
      users[idx].name = name;
      saveUsers(users);
    }
    APP.user.name = name;
    APP.user.initials = getInitials(name);
    sessionStorage.setItem('cp-session', JSON.stringify({
      userId: APP.user.id,
      role: APP.role,
      name: APP.user.name,
      initials: APP.user.initials
    }));
    alert('Profile saved!');
  };
  window.toggleThemeToggle = (el) => {
    el.classList.toggle('on');
    setTheme(el.classList.contains('on') ? 'dark' : 'light');
  };
  window.addCoordinator = async () => {
    const name = document.getElementById('tm-name')?.value?.trim();
    const username = normalizeUsername(document.getElementById('tm-username')?.value);
    const password = document.getElementById('tm-password')?.value || '';
    if (!name || !username || !password) {
      alert('Please fill in all coordinator fields.');
      return;
    }
    const users = loadUsers();
    if (users.some(u => u.username === username)) {
      alert('That username is already in use.');
      return;
    }
    const passwordHash = await hashPassword(password);
    users.push({
      id: crypto.randomUUID(),
      name,
      username,
      passwordHash,
      role: 'coordinator',
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
    renderSettings();
  };
  window.removeCoordinator = (id) => {
    if (!confirm('Remove this coordinator?')) return;
    const users = loadUsers();
    const next = users.filter(u => u.id !== id);
    saveUsers(next);
    renderSettings();
  };
}

// ── MODAL HELPERS ──
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('new-task-modal-title').textContent = 'New Task';
  document.getElementById('save-new-task-btn').onclick = saveNewTask;
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── LOGIN ──
function handleLogin() {
  if (APP.passwordChangeUserId) {
    return handlePasswordChange();
  }
  return handleSignIn();
}

function logout() {
  sessionStorage.removeItem('cp-session');
  APP.role = null; APP.user = null; APP.passwordChangeUserId = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  showLoginStep1();
}

function showLoginStep1() {
  APP.passwordChangeUserId = null;
  document.getElementById('login-step2').style.display = 'none';
  document.getElementById('login-step1').style.display = 'block';
  document.getElementById('login-proceed-btn').style.display = 'block';
  document.getElementById('login-proceed-btn').textContent = 'Sign In';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  setLoginError('');
}

function setLoginError(message) {
  const el = document.getElementById('login-error');
  if (!el) return;
  el.textContent = message || '';
  el.style.display = message ? 'block' : 'none';
}

function hydrateSession() {
  let session = null;
  try {
    session = JSON.parse(sessionStorage.getItem('cp-session') || 'null');
  } catch {
    sessionStorage.removeItem('cp-session');
  }
  if (!session) {
    APP.role = null;
    APP.user = null;
    return;
  }
  APP.role = session.role;
  APP.user = {
    id: session.userId,
    name: session.name,
    initials: session.initials,
    role: session.role
  };
}

async function handleSignIn() {
  const username = normalizeUsername(document.getElementById('login-username')?.value);
  const password = document.getElementById('login-password')?.value || '';
  if (!username || !password) {
    setLoginError('Enter both username and password.');
    return;
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    setLoginError('Invalid username or password.');
    return;
  }
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    setLoginError('Invalid username or password.');
    return;
  }
  if (user.mustChangePassword) {
    return showPasswordChange(user);
  }
  createSession(user);
}

function showPasswordChange(user) {
  APP.passwordChangeUserId = user.id;
  document.getElementById('login-step1').style.display = 'none';
  const step2 = document.getElementById('login-step2');
  step2.innerHTML = `
    <div class="form-group">
      <label class="form-label">Set New Password</label>
      <input class="form-input" id="new-password" type="password" placeholder="At least 8 characters">
    </div>
    <div class="form-group">
      <label class="form-label">Confirm New Password</label>
      <input class="form-input" id="confirm-password" type="password" placeholder="Re-enter password">
    </div>
  `;
  step2.style.display = 'block';
  document.getElementById('login-proceed-btn').textContent = 'Save Password';
  setLoginError('');
}

async function handlePasswordChange() {
  const newPassword = document.getElementById('new-password')?.value || '';
  const confirmPassword = document.getElementById('confirm-password')?.value || '';
  if (newPassword.length < 8) {
    setLoginError('New password must be at least 8 characters.');
    return;
  }
  if (newPassword !== confirmPassword) {
    setLoginError('Passwords do not match.');
    return;
  }
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === APP.passwordChangeUserId);
  if (idx === -1) {
    setLoginError('User not found. Please sign in again.');
    showLoginStep1();
    return;
  }
  users[idx].passwordHash = await hashPassword(newPassword);
  users[idx].mustChangePassword = false;
  saveUsers(users);
  APP.passwordChangeUserId = null;
  createSession(users[idx]);
}

function createSession(user) {
  const session = {
    userId: user.id,
    role: user.role,
    name: user.name,
    initials: getInitials(user.name)
  };
  sessionStorage.setItem('cp-session', JSON.stringify(session));
  APP.role = user.role;
  APP.user = {
    id: user.id,
    name: user.name,
    initials: session.initials,
    role: user.role
  };
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
}

// ── INIT APP ──
function initApp() {
  // Set up sidebar state
  document.getElementById('sidebar').classList.toggle('collapsed', APP.sidebarCollapsed);

  // Manager vs Coordinator nav
  const managerOnlyItems = document.querySelectorAll('[data-role="manager"]');
  managerOnlyItems.forEach(el => {
    el.style.display = APP.role === 'manager' ? '' : 'none';
  });

  // User avatar
  document.getElementById('user-avatar').textContent = APP.user?.initials || '?';
  document.getElementById('user-avatar-sidebar').textContent = APP.user?.initials || '?';
  document.getElementById('user-name-sidebar').textContent = APP.user?.name || 'User';
  document.getElementById('user-role-sidebar').textContent = APP.role === 'manager' ? 'Manager' : 'Coordinator';

  // Notification count
  renderNotifPanel();

  // Navigate to dashboard
  navigate('dashboard');
}

// ── STARTUP ──
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    setTheme(APP.theme);
    await ensureSeedManagers();
    APP.users = loadUsers();
    hydrateSession();

    if (APP.role && APP.user) {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      initApp();
    } else {
      document.getElementById('login-page').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
      showLoginStep1();
    }

    // Click outside notif panel
    document.addEventListener('click', e => {
      if (APP.notifPanelOpen &&
          !document.getElementById('notif-panel').contains(e.target) &&
          !document.getElementById('notif-btn').contains(e.target)) {
        APP.notifPanelOpen = false;
        document.getElementById('notif-panel').classList.remove('open');
      }
    });
  })();
});
