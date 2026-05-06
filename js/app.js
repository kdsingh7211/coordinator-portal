/* ===========================
   EUREKA! WORKPLACE — APP JS
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
  editingResourceId: null,
  trackDbViewMode: 'all',
  trackDbStatusFilter: 'all',
  trackDbExpandedCoordinators: {},
  trackDbExpandedCompanies: {},
  trackDbSelectedCompanies: {},
  timelineTab: 'task',
  managerTimelineMessage: { type: '', text: '' },
  firebaseDb: null,
};

// ── DB SUB-CATEGORIES ──
const DB_SUB_CATEGORIES_DEFAULT = [
  'Incentive Partner', 'Government Partner', 'Venture Capitalist',
  'Incubator', 'Accelerator', 'Media Partner', 'Corporate Partner',
  'Mentor', 'Other'
];

// ── SEED DATA ──
const DATA = {
  coordinators: [],
  categories: ['Incubators', 'Startups', 'Email Outreach', 'Database Work', 'Events', 'Research'],
  pocCategories: ['Incentive Partner', 'Investor', 'Mentor', 'Corporate'],
  tasks: [],
  managerTimeline: [],
  pocs: [],
  dbCompanies: [],
  dbSubCategories: DB_SUB_CATEGORIES_DEFAULT.slice(),
  dbStatusOptions: ['Mail Sent', 'Replied', 'Denied', 'Accepted'],
  confirmedLeads: [],
  confirmedLeadCategories: ['Incentive Partner', 'Government Partner', 'Incubator', 'Accelerator', 'VC'],
  confirmedLeadStages: ['Zonals', 'Finals', 'Other'],
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

const DB_STATUS_OPTIONS = ['Mail Sent', 'Replied', 'Denied', 'Accepted'];
const TEMP_PASSWORD = 'E-Cell@2025';
const STORAGE_RESET_VERSION_KEY = 'cp-storage-reset-version';
const STORAGE_RESET_VERSION = '2026-04-14-auth-reset-2';
const SESSION_KEY = 'cp-session';
const SESSION_TTL_DAYS = 7;
const FIREBASE_USERS_PATH = 'cp-users';
const TASKS_STORAGE_KEY = 'cp-tasks';
const FIREBASE_TASKS_PATH = 'cp-tasks';

const DATA_STORAGE_KEYS = {
  tasks: 'cp-tasks',
  managerTimeline: 'cp-manager-timeline',
  pocs: 'cp-pocs',
  dbCompanies: 'cp-db-companies',
  dbSubCategories: 'cp-db-sub-categories',
  dbStatusOptions: 'cp-db-status-options',
  confirmedLeads: 'cp-confirmed-leads',
  confirmedLeadCategories: 'cp-confirmed-lead-categories',
  confirmedLeadStages: 'cp-confirmed-lead-stages',
  notifications: 'cp-notifications',
  categories: 'cp-categories',
  resources: 'cp-resources'
};

const FIREBASE_DATA_PATHS = {
  tasks: 'cp-tasks',
  managerTimeline: 'cp-manager-timeline',
  pocs: 'cp-pocs',
  dbCompanies: 'cp-db-companies',
  dbSubCategories: 'cp-db-sub-categories',
  dbStatusOptions: 'cp-db-status-options',
  confirmedLeads: 'cp-confirmed-leads',
  confirmedLeadCategories: 'cp-confirmed-lead-categories',
  confirmedLeadStages: 'cp-confirmed-lead-stages',
  notifications: 'cp-notifications',
  categories: 'cp-categories',
  resources: 'cp-resources'
};
const MAX_NOTIFICATIONS = 100;
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAjB_KKDL_F_4nc6agyqINBe-e41JSXRb8',
  authDomain: 'coordie-portal.firebaseapp.com',
  projectId: 'coordie-portal',
  storageBucket: 'coordie-portal.firebasestorage.app',
  messagingSenderId: '552803820221',
  appId: '1:552803820221:web:0dc5963eee88418c348dd4',
  databaseURL: 'https://coordie-portal-default-rtdb.asia-southeast1.firebasedatabase.app/'
};

// ── HELPERS ──
function getSessionExpiry() {
  return Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
}

async function hashPassword(password) {
  if (!crypto.subtle) {
    throw new Error('Password hashing requires a secure context (HTTPS or localhost).');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadUsers() {
  if (Array.isArray(APP.users) && APP.users.length) {
    return APP.users;
  }
  try {
    return JSON.parse(localStorage.getItem('cp-users') || '[]');
  } catch {
    return [];
  }
}

function setUsersLocally(users) {
  localStorage.setItem('cp-users', JSON.stringify(users));
  APP.users = users;
}

function initFirebase() {
  if (!window.firebase || typeof window.firebase.initializeApp !== 'function') {
    return false;
  }
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(FIREBASE_CONFIG);
  }
  APP.firebaseDb = window.firebase.database();
  return true;
}

async function fetchUsersFromFirebase() {
  if (!APP.firebaseDb) return null;
  try {
    const snapshot = await APP.firebaseDb.ref(FIREBASE_USERS_PATH).once('value');
    const value = snapshot.val();
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'object') return Object.values(value).filter(Boolean);
    return [];
  } catch (error) {
    console.warn('Failed to fetch users from Firebase. Falling back to local users.', error);
    return null;
  }
}

async function syncUsersFromFirebase() {
  const remoteUsers = await fetchUsersFromFirebase();
  if (!Array.isArray(remoteUsers)) return;
  if (remoteUsers.length) {
    setUsersLocally(remoteUsers);
    return;
  }
  const localUsers = loadUsers();
  if (localUsers.length) {
    await persistUsersToFirebase(localUsers);
  }
}

async function persistUsersToFirebase(users) {
  if (!APP.firebaseDb) return;
  try {
    await APP.firebaseDb.ref(FIREBASE_USERS_PATH).set(users);
  } catch (error) {
    console.warn('Failed to save users to Firebase. Keeping local copy only.', error);
  }
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setTasksLocally(tasks) {
  DATA.tasks = Array.isArray(tasks) ? tasks : [];
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(DATA.tasks));
}

async function fetchTasksFromFirebase() {
  if (!APP.firebaseDb) return null;
  try {
    const snapshot = await APP.firebaseDb.ref(FIREBASE_TASKS_PATH).once('value');
    const value = snapshot.val();
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'object') return Object.values(value).filter(Boolean);
    return [];
  } catch (error) {
    console.warn('Failed to fetch tasks from Firebase. Falling back to local tasks.', error);
    return null;
  }
}

async function persistTasksToFirebase(tasks) {
  if (!APP.firebaseDb) return;
  try {
    await APP.firebaseDb.ref(FIREBASE_TASKS_PATH).set(tasks);
  } catch (error) {
    console.warn('Failed to save tasks to Firebase. Keeping local copy only.', error);
  }
}

async function syncTasksFromFirebase() {
  await syncDataCollection('tasks');
}

// ── GENERIC PERSISTENCE HELPERS ──
function loadLocalDataCollection(key) {
  const storageKey = DATA_STORAGE_KEYS[key];
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage.`, error);
    return null;
  }
}

function setDataCollectionLocally(key, items) {
  const storageKey = DATA_STORAGE_KEYS[key];
  if (!storageKey) return;
  DATA[key] = Array.isArray(items) ? items : [];
  localStorage.setItem(storageKey, JSON.stringify(DATA[key]));
}

async function fetchDataCollectionFromFirebase(key) {
  if (!APP.firebaseDb) return null;
  const path = FIREBASE_DATA_PATHS[key];
  if (!path) return null;
  try {
    const snapshot = await APP.firebaseDb.ref(path).once('value');
    const value = snapshot.val();
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'object') return Object.values(value).filter(Boolean);
    return [];
  } catch (error) {
    console.warn(`Failed to fetch ${key} from Firebase. Falling back to local data.`, error);
    return null;
  }
}

async function persistDataCollectionToFirebase(key) {
  if (!APP.firebaseDb) return;
  const path = FIREBASE_DATA_PATHS[key];
  if (!path) return;
  try {
    await APP.firebaseDb.ref(path).set(DATA[key] || []);
  } catch (error) {
    console.warn(`Failed to save ${key} to Firebase. Keeping local copy only.`, error);
  }
}

function saveDataCollection(key) {
  const storageKey = DATA_STORAGE_KEYS[key];
  if (!storageKey) return;
  if (!Array.isArray(DATA[key])) DATA[key] = [];
  localStorage.setItem(storageKey, JSON.stringify(DATA[key]));
  void persistDataCollectionToFirebase(key);
}

async function syncDataCollection(key) {
  try {
    const remoteItems = await fetchDataCollectionFromFirebase(key);
    if (Array.isArray(remoteItems) && remoteItems.length) {
      setDataCollectionLocally(key, remoteItems);
      console.log(`${key} loaded from Firebase:`, remoteItems.length);
      return;
    }
    const localItems = loadLocalDataCollection(key);
    if (Array.isArray(localItems) && localItems.length) {
      setDataCollectionLocally(key, localItems);
      await persistDataCollectionToFirebase(key);
      console.log(`${key} loaded locally and pushed to Firebase:`, localItems.length);
      return;
    }
    if (Array.isArray(DATA[key]) && DATA[key].length) {
      localStorage.setItem(DATA_STORAGE_KEYS[key], JSON.stringify(DATA[key]));
      await persistDataCollectionToFirebase(key);
      console.log(`${key} defaults saved:`, DATA[key].length);
      return;
    }
    setDataCollectionLocally(key, []);
  } catch (error) {
    console.warn(`Sync failed for ${key}. Loading local data if available.`, error);
    const localItems = loadLocalDataCollection(key);
    if (Array.isArray(localItems)) {
      setDataCollectionLocally(key, localItems);
    }
  }
}

async function syncAllAppData() {
  for (const key of Object.keys(DATA_STORAGE_KEYS)) {
    await syncDataCollection(key);
  }
}

// ── PERSISTENCE WRAPPERS ──
function saveTasks() { saveDataCollection('tasks'); }
function saveDbCompanies() { saveDataCollection('dbCompanies'); }
function saveDbSubCategories() { saveDataCollection('dbSubCategories'); }
function saveDbStatusOptions() { saveDataCollection('dbStatusOptions'); }
function savePocs() { saveDataCollection('pocs'); }
function saveManagerTimeline() { saveDataCollection('managerTimeline'); }
function saveNotifications() { saveDataCollection('notifications'); }
function saveCategories() { saveDataCollection('categories'); }
function saveResources() { saveDataCollection('resources'); }
function saveConfirmedLeads() { saveDataCollection('confirmedLeads'); }
function saveConfirmedLeadCategories() { saveDataCollection('confirmedLeadCategories'); }
function saveConfirmedLeadStages() { saveDataCollection('confirmedLeadStages'); }

function resetPersistedDataIfNeeded() {
  const version = localStorage.getItem(STORAGE_RESET_VERSION_KEY);
  if (version === STORAGE_RESET_VERSION) return;
  localStorage.removeItem('cp-theme');
  localStorage.removeItem('cp-sidebar-collapsed');
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.setItem(STORAGE_RESET_VERSION_KEY, STORAGE_RESET_VERSION);
  APP.theme = 'light';
  APP.sidebarCollapsed = false;
}

function saveUsers(users) {
  setUsersLocally(users);
  void persistUsersToFirebase(users);
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '#';
  if (raw === '#') return '#';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
  return '#';
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
  const hasValidManagers = existing.some(u =>
    u.role === 'manager' &&
    typeof u.passwordHash === 'string' &&
    u.passwordHash.length === 64
  );
  if (hasValidManagers) {
    APP.users = existing;
    return;
  }
  const hash = await hashPassword(TEMP_PASSWORD);
  const now = new Date().toISOString();
  const seedManagers = [
    {
      id: createId('user'),
      name: 'Chetan Jangid',
      username: 'chetan',
      passwordHash: hash,
      role: 'manager',
      mustChangePassword: true,
      createdAt: now
    },
    {
      id: createId('user'),
      name: 'Karandeep Singh',
      username: 'karandeep',
      passwordHash: hash,
      role: 'manager',
      mustChangePassword: true,
      createdAt: now
    }
  ];
  const nonManagerUsers = existing.filter(u => u.role !== 'manager');
  const nextUsers = [...nonManagerUsers, ...seedManagers];
  saveUsers(nextUsers);
  APP.users = loadUsers();
  console.log('SEEDING: seeded managers:', seedManagers.map(u => u.username));
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
function createId(prefix = 'id') {
  const uuid = globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${uuid}`;
}
function getVisiblePocs() {
  if (!APP.user) return [];
  const userId = APP.user.id;
  if (APP.role === 'manager') {
    return DATA.pocs.filter(p => (
      p.createdByRole === 'coordinator' ||
      p.createdBy === userId ||
      (Array.isArray(p.sharedManagerIds) && p.sharedManagerIds.includes(userId))
    ));
  }
  return DATA.pocs.filter(p => p.createdByRole === 'coordinator' && p.createdBy === userId);
}

function canManagePocEntry(entry) {
  if (!APP.user || !entry) return false;
  if (APP.role === 'manager') {
    return getVisiblePocs().some(p => p.id === entry.id);
  }
  return APP.role === 'coordinator' && entry.createdByRole === 'coordinator' && entry.createdBy === APP.user.id;
}

function encodeForAttr(value) {
  return encodeURIComponent(String(value ?? ''));
}

function decodeFromAttr(value) {
  try {
    return decodeURIComponent(String(value ?? ''));
  } catch {
    return String(value ?? '');
  }
}

function toDomSafeId(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function normalizeCompanyName(name) {
  return String(name || '').trim().toLowerCase();
}

function normalizeTrackDbCompanyKey(companyName) {
  return normalizeCompanyName(companyName);
}

// ── DB STATUS OPTION HELPERS ──
function getDbStatusOptions(currentStatus = '') {
  const options = Array.isArray(DATA.dbStatusOptions) && DATA.dbStatusOptions.length
    ? [...DATA.dbStatusOptions]
    : ['Mail Sent', 'Replied', 'Denied', 'Accepted'];
  if (currentStatus && !options.includes(currentStatus)) {
    options.push(currentStatus);
  }
  return options;
}

// ── CONFIRMED LEAD OPTION HELPERS ──
function getConfirmedLeadCategoryOptions(current = '') {
  const options = Array.isArray(DATA.confirmedLeadCategories) && DATA.confirmedLeadCategories.length
    ? [...DATA.confirmedLeadCategories]
    : ['Incentive Partner', 'Government Partner', 'Incubator', 'Accelerator', 'VC'];
  if (current && !options.includes(current)) options.push(current);
  return options;
}

function getConfirmedLeadStageOptions(current = '') {
  const options = Array.isArray(DATA.confirmedLeadStages) && DATA.confirmedLeadStages.length
    ? [...DATA.confirmedLeadStages]
    : ['Zonals', 'Finals', 'Other'];
  if (current && !options.includes(current)) options.push(current);
  return options;
}

function getPocDisplayName(poc) {
  if (!poc) return '—';
  const parts = [poc.name];
  if (poc.organization) parts.push(poc.organization);
  else if (poc.email) parts.push(poc.email);
  return parts.join(' — ');
}

// ── JSZIP DYNAMIC LOADER ──
function loadScriptOnce(src, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) { resolve(window[globalName]); return; }
    const existing = document.querySelector(`script[data-dynamic-src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(globalName ? window[globalName] : true));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.dynamicSrc = src;
    script.onload = () => resolve(globalName ? window[globalName] : true);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureJsZipLoaded() {
  if (window.JSZip) return true;
  try {
    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
    return !!window.JSZip;
  } catch (error) {
    console.warn('JSZip failed to load.', error);
    return false;
  }
}

// ── SCREEN HELPERS ──
function showBootScreen() {
  const boot = document.getElementById('boot-screen');
  const login = document.getElementById('login-page');
  const app = document.getElementById('app');
  if (boot) boot.style.display = 'flex';
  if (login) login.style.display = 'none';
  if (app) app.style.display = 'none';
}

function showLoginScreen() {
  const boot = document.getElementById('boot-screen');
  const login = document.getElementById('login-page');
  const app = document.getElementById('app');
  if (boot) boot.style.display = 'none';
  if (login) login.style.display = 'flex';
  if (app) app.style.display = 'none';
}

function showAppScreen() {
  const boot = document.getElementById('boot-screen');
  const login = document.getElementById('login-page');
  const app = document.getElementById('app');
  if (boot) boot.style.display = 'none';
  if (login) login.style.display = 'none';
  if (app) app.style.display = 'flex';
}

function getTaskNameById(taskId) {
  if (!taskId) return '';
  const task = getTask(taskId);
  return task ? task.name : '';
}

function sanitizeFilename(value) {
  return String(value || 'company')
    .trim()
    .replace(/[^a-z0-9\-_ ]/gi, '')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'company';
}

function escapeCsvCell(value) {
  const raw = String(value ?? '');
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function rowsToCsv(rows) {
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\n');
}

function getTrackDbCompanyGroups(entries) {
  const groups = {};
  entries.forEach(entry => {
    const companyName = entry.companyName || entry.company || 'Unknown Company';
    const key = normalizeTrackDbCompanyKey(companyName);
    if (!groups[key]) {
      groups[key] = { key, companyName, entries: [], contacts: [] };
    }
    groups[key].entries.push(entry);
    const contacts = Array.isArray(entry.contacts) ? entry.contacts : [];
    contacts.forEach(contact => {
      groups[key].contacts.push({
        name: contact.name || '',
        email: contact.email || '',
        company: contact.company || companyName,
        subCategory: entry.subCategory || '',
        coordinator: entry.coordinatorName || '',
        coordinatorId: entry.coordinatorId || '',
        sourceTask: getTaskNameById(entry.sourceTaskId),
        status: entry.status || '',
        comment: entry.comment || ''
      });
    });
  });
  return Object.values(groups).sort((a, b) => a.companyName.localeCompare(b.companyName));
}

function getCsvRowsForCompanyGroup(group) {
  const header = ['Name', 'Email', 'Company', 'Sub Category', 'Coordinator', 'Source Task', 'Status', 'Comment'];
  const rows = group.contacts.map(contact => [
    contact.name,
    contact.email,
    contact.company,
    contact.subCategory,
    contact.coordinator,
    contact.sourceTask,
    contact.status,
    contact.comment
  ]);
  return [header, ...rows];
}

function getTrackDbEntriesForCurrentUser() {
  if (!APP.user) return [];
  if (APP.role === 'manager') return DATA.dbCompanies;
  return DATA.dbCompanies.filter(entry => entry.coordinatorId === APP.user.id);
}

function findDbCompanyEntry(companyName, coordinatorId) {
  const key = normalizeCompanyName(companyName);
  return DATA.dbCompanies.find(entry => (
    entry.coordinatorId === coordinatorId &&
    normalizeCompanyName(entry.companyName) === key
  ));
}

function ensureUniqueContacts(existingContacts, nextContacts) {
  const merged = [...(existingContacts || [])];
  const makeContactKey = (name, email) => `${String(name || '').trim().toLowerCase()}|${String(email || '').trim().toLowerCase()}`;
  const existingKeys = new Set(merged.map(c => makeContactKey(c.name, c.email)));
  (nextContacts || []).forEach(contact => {
    const name = String(contact.name || '').trim();
    const email = String(contact.email || '').trim();
    const key = makeContactKey(name, email);
    if (!name || !email || existingKeys.has(key)) return;
    existingKeys.add(key);
    merged.push({ name, email, company: String(contact.company || '').trim() });
  });
  return merged;
}

function upsertDbCompanyEntries(contacts, { coordinatorId, coordinatorName, sourceTaskId = '' } = {}) {
  if (!coordinatorId || !Array.isArray(contacts) || !contacts.length) return 0;
  let touched = 0;
  contacts.forEach(contact => {
    const companyName = String(contact.company || '').trim();
    if (!companyName) return;
    const existing = findDbCompanyEntry(companyName, coordinatorId);
    if (existing) {
      existing.contacts = ensureUniqueContacts(existing.contacts, [contact]);
      if (!existing.sourceTaskId && sourceTaskId) existing.sourceTaskId = sourceTaskId;
      existing.updatedAt = new Date().toISOString();
      touched += 1;
      return;
    }
    DATA.dbCompanies.unshift({
      id: createId('db-company'),
      companyName,
      status: 'Mail Sent',
      comment: '',
      coordinatorId,
      coordinatorName: coordinatorName || getCoordinator(coordinatorId)?.name || 'Unknown',
      sourceTaskId: sourceTaskId || '',
      contacts: ensureUniqueContacts([], [contact]),
      pocId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    touched += 1;
  });
  return touched;
}

function parseCsvTextToRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const input = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === '"') {
      if (inQuotes && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n' && !inQuotes) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.length > 1 || row[0].trim()) rows.push(row);
  return rows;
}

function normalizeDateForInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    const normalized = new Date(Date.UTC(year, month - 1, day));
    if (
      normalized.getUTCFullYear() === year &&
      normalized.getUTCMonth() + 1 === month &&
      normalized.getUTCDate() === day
    ) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '';
  }
  const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    const normalized = new Date(Date.UTC(year, month - 1, day));
    if (
      normalized.getUTCFullYear() === year &&
      normalized.getUTCMonth() + 1 === month &&
      normalized.getUTCDate() === day
    ) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '';
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseManagerTimelineCsv(text) {
  const rows = parseCsvTextToRows(String(text || '').replace(/^\uFEFF/, ''));
  if (!rows.length) return { entries: [], error: 'CSV is empty.' };
  const header = rows[0].map(h => String(h || '').trim().toLowerCase());
  const idxTask = header.indexOf('task');
  const idxDeadline = header.indexOf('deadline');
  const idxComments = header.indexOf('comments');
  if (idxTask === -1 || idxDeadline === -1 || idxComments === -1) {
    return { entries: [], error: 'CSV must include columns: Task, Deadline, Comments.' };
  }
  const entries = [];
  for (let i = 1; i < rows.length; i += 1) {
    const source = rows[i];
    const task = String(source[idxTask] || '').trim();
    const deadlineRaw = String(source[idxDeadline] || '').trim();
    const comments = String(source[idxComments] || '').trim();
    const isEmptyRow = !task && !deadlineRaw && !comments;
    if (isEmptyRow) continue;
    if (!task || !deadlineRaw) {
      return { entries: [], error: `Row ${i + 1}: Task and Deadline are required.` };
    }
    const deadline = normalizeDateForInput(deadlineRaw);
    if (!deadline) {
      return { entries: [], error: `Row ${i + 1}: Deadline must be a valid date.` };
    }
    entries.push({
      id: createId('manager-timeline'),
      task,
      deadline,
      comments,
      completed: false
    });
  }
  if (!entries.length) return { entries: [], error: 'CSV has no data rows.' };
  return { entries, error: '' };
}

function parseDbCsv(text) {
  const rows = parseCsvTextToRows(String(text || '').replace(/^\uFEFF/, ''));
  if (!rows.length) return { contacts: [], error: 'CSV is empty.' };
  const header = rows[0].map(h => String(h || '').trim().toLowerCase());
  const idxName = header.indexOf('name');
  const idxEmail = header.indexOf('email');
  const idxCompany = header.indexOf('company');
  if (idxName === -1 || idxEmail === -1 || idxCompany === -1) {
    return { contacts: [], error: 'CSV must include columns: Name, Email, Company (column names are case-insensitive).' };
  }
  const contacts = [];
  for (let i = 1; i < rows.length; i += 1) {
    const source = rows[i];
    const name = String(source[idxName] || '').trim();
    const email = String(source[idxEmail] || '').trim();
    const company = String(source[idxCompany] || '').trim();
    const isEmptyRow = !name && !email && !company;
    if (isEmptyRow) continue;
    if (!name || !email || !company) {
      return { contacts: [], error: `Row ${i + 1}: Name, Email, and Company are all required.` };
    }
    contacts.push({ name, email, company });
  }
  if (!contacts.length) return { contacts: [], error: 'CSV has no data rows.' };
  return { contacts, error: '' };
}

async function importDbCsvFile(file, { coordinatorId, coordinatorName, sourceTaskId = '' } = {}) {
  if (!file) {
    alert('Please choose a CSV file.');
    return false;
  }
  const isCsv = file.name?.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
  if (!isCsv) {
    alert('Please upload a valid CSV file.');
    return false;
  }
  let text = '';
  try {
    text = await file.text();
  } catch {
    alert('Unable to read the selected file.');
    return false;
  }
  const { contacts, error } = parseDbCsv(text);
  if (error) {
    alert(error);
    return false;
  }
  const touched = upsertDbCompanyEntries(contacts, { coordinatorId, coordinatorName, sourceTaskId });
  if (!touched) {
    alert('No valid company entries found in this CSV.');
    return false;
  }
  return true;
}

function hasDbUploadForTask(taskId, coordinatorId) {
  return DATA.dbCompanies.some(entry => entry.sourceTaskId === taskId && entry.coordinatorId === coordinatorId);
}

// ── DATABASE WORK HELPERS ──
function isDatabaseWorkTask(task) {
  return task?.category === 'Database Work' || task?.dbWorkflowEnabled === true;
}

function normalizeTask(task) {
  if (!task) return task;
  if (!Array.isArray(task.comments)) task.comments = [];
  if (!Array.isArray(task.subtasks)) task.subtasks = [];
  if (!Array.isArray(task.timeline)) task.timeline = [];
  if (isDatabaseWorkTask(task)) {
    task.dbWorkflowEnabled = true;
    task.dbRequired = true;
    if (!task.dbSubCategory) task.dbSubCategory = '';
    if (!Array.isArray(task.dbEntities)) task.dbEntities = [];
  } else {
    if (!Array.isArray(task.dbEntities)) task.dbEntities = [];
  }
  return task;
}

function normalizeAllTasks() {
  DATA.tasks.forEach(normalizeTask);
}

function shouldBlockTaskCompletion(task, status, isAssignedCoordinator, userId) {
  if (status !== 'Done') return false;
  if (!isAssignedCoordinator) return false;
  if (isDatabaseWorkTask(task)) {
    // DB Work tasks: block unless at least one entity has contactsUploaded
    const entities = task.dbEntities || [];
    if (!entities.length) return true;
    return !entities.some(e => e.contactsUploaded);
  }
  if (!task?.dbRequired) return false;
  return !hasDbUploadForTask(task.id, userId);
}

function statusBadge(status) {
  const map = { 'Done': 'green', 'In Progress': 'blue', 'Not Started': 'gray' };
  return `<span class="badge badge-${map[status] || 'gray'}">${status}</span>`;
}
function catBadge(cat) {
  const map = { 'Incubators':'purple','Startups':'orange','Email Outreach':'blue','Database Work':'yellow','Events':'green','Research':'gray' };
  return `<span class="badge badge-${map[cat]||'gray'}">${escapeHtml(cat)}</span>`;
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
  // Swap logos for light/dark mode
  const logoSrc = t === 'dark' ? 'icons/logo-white.svg' : 'icons/logo-black.svg';
  document.querySelectorAll('.login-logo-img, .sidebar-logo-img').forEach(el => el.src = logoSrc);
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
    poc: ['POC', 'Point of contact details'],
    trackdb: ['Track DB', 'Track uploaded database companies'],
    confirmedleads: ['Confirmed Leads', 'Manager-only confirmed leads tracker'],
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
    poc: renderPoc,
    trackdb: renderTrackDb,
    confirmedleads: renderConfirmedLeads,
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
  saveNotifications();
  renderNotifPanel();
}
function markAllRead() {
  DATA.notifications.forEach(n => n.read = true);
  saveNotifications();
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
          ${DATA.categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
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
// ── SUBTASK BUILDER HELPERS ──
function renderSubtaskBuilder(existingSubtasks) {
  const subs = Array.isArray(existingSubtasks) ? existingSubtasks : [];
  return `
    <div class="fw-600 mb-3" style="font-size:13px">📊 Subtasks / Metrics</div>
    <div id="subtask-builder-list">
      ${subs.map((s, idx) => `
        <div class="form-row subtask-builder-row" data-sub-idx="${idx}" style="align-items:center;margin-bottom:8px">
          <input class="form-input" placeholder="Subtask name" id="sub-name-${idx}" value="${escapeHtml(s.name || '')}">
          <select class="form-select" id="sub-type-${idx}" onchange="onSubtaskTypeChange(${idx})" style="width:120px;flex:0 0 auto">
            <option value="checkbox" ${s.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
            <option value="number" ${s.type === 'number' ? 'selected' : ''}>Numeric</option>
          </select>
          <div id="sub-target-wrap-${idx}" style="display:${s.type === 'number' ? '' : 'none'};flex:0 0 auto">
            <input type="number" class="form-input" placeholder="Target" id="sub-target-${idx}" value="${s.target || ''}" style="width:80px">
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="removeSubtaskRow(${idx})" style="flex:0 0 auto">🗑️</button>
        </div>
      `).join('')}
    </div>
    <button type="button" class="btn btn-secondary btn-sm" onclick="addSubtaskInputRow()">+ Add Subtask</button>
  `;
}

function onSubtaskTypeChange(idx) {
  const wrap = document.getElementById('sub-target-wrap-' + idx);
  const sel = document.getElementById('sub-type-' + idx);
  if (wrap && sel) wrap.style.display = sel.value === 'number' ? '' : 'none';
}

function addSubtaskInputRow() {
  const list = document.getElementById('subtask-builder-list');
  if (!list) return;
  const rows = list.querySelectorAll('.subtask-builder-row');
  const idx = rows.length;
  const div = document.createElement('div');
  div.className = 'form-row subtask-builder-row';
  div.dataset.subIdx = idx;
  div.style.cssText = 'align-items:center;margin-bottom:8px';
  div.innerHTML = `
    <input class="form-input" placeholder="Subtask name" id="sub-name-${idx}" value="">
    <select class="form-select" id="sub-type-${idx}" onchange="onSubtaskTypeChange(${idx})" style="width:120px;flex:0 0 auto">
      <option value="checkbox">Checkbox</option>
      <option value="number">Numeric</option>
    </select>
    <div id="sub-target-wrap-${idx}" style="display:none;flex:0 0 auto">
      <input type="number" class="form-input" placeholder="Target" id="sub-target-${idx}" value="" style="width:80px">
    </div>
    <button type="button" class="btn btn-ghost btn-sm" onclick="removeSubtaskRow(${idx})" style="flex:0 0 auto">🗑️</button>
  `;
  list.appendChild(div);
}

function removeSubtaskRow(idx) {
  const row = document.querySelector(`.subtask-builder-row[data-sub-idx="${idx}"]`);
  if (row) row.remove();
}

function collectSubtasksFromForm() {
  const rows = document.querySelectorAll('.subtask-builder-row');
  const subtasks = [];
  rows.forEach(row => {
    const idx = row.dataset.subIdx;
    const nameEl = document.getElementById('sub-name-' + idx);
    const typeEl = document.getElementById('sub-type-' + idx);
    const targetEl = document.getElementById('sub-target-' + idx);
    const name = nameEl?.value?.trim();
    if (!name) return;
    const type = typeEl?.value === 'number' ? 'number' : 'checkbox';
    const target = type === 'number' ? (parseFloat(targetEl?.value) || 100) : undefined;
    const sub = { id: createId('sub'), name, type, value: type === 'checkbox' ? false : 0 };
    if (type === 'number') sub.target = target;
    subtasks.push(sub);
  });
  return subtasks;
}

// ── DB ENTITY MANAGEMENT ──
function addDbEntity(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  const isManager = APP.role === 'manager';
  const isAssignedCoordinator = APP.role === 'coordinator' && task.assignedTo === APP.user?.id;
  if (!isManager && !isAssignedCoordinator) return;
  const input = document.getElementById('db-entity-name-input-' + toDomSafeId(taskId));
  const entityName = input?.value?.trim();
  if (!entityName) { alert('Please enter an entity name.'); return; }
  const normalized = normalizeCompanyName(entityName);
  // Conflict check across all tasks
  let conflictMsg = '';
  DATA.tasks.forEach(t => {
    if (!Array.isArray(t.dbEntities)) return;
    t.dbEntities.forEach(e => {
      if (normalizeCompanyName(e.name) === normalized) {
        const coordName = e.coordinatorName || getCoordinator(e.coordinatorId)?.name || 'Unknown';
        conflictMsg += `"${e.name}" already added by ${coordName} in task "${t.name}".\n`;
      }
    });
  });
  if (conflictMsg) {
    if (!confirm('⚠️ Conflict detected:\n' + conflictMsg + '\nDo you still want to add this entity?')) return;
  }
  if (!Array.isArray(task.dbEntities)) task.dbEntities = [];
  task.dbEntities.push({
    id: createId('entity'),
    name: entityName,
    normalizedName: normalized,
    subCategory: task.dbSubCategory || '',
    sourceTaskId: task.id,
    coordinatorId: APP.user?.id || '',
    coordinatorName: APP.user?.name || '',
    createdBy: APP.user?.id || '',
    createdByName: APP.user?.name || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contactsUploaded: false,
    contactCount: 0
  });
  saveTasks();
  openTaskDetail(task.id);
}

function deleteDbEntity(taskId, entityId) {
  const task = getTask(taskId);
  if (!task) return;
  const isManager = APP.role === 'manager';
  const isAssignedCoordinator = APP.role === 'coordinator' && task.assignedTo === APP.user?.id;
  if (!isManager && !isAssignedCoordinator) return;
  if (!confirm('Delete this entity?')) return;
  task.dbEntities = (task.dbEntities || []).filter(e => e.id !== entityId);
  saveTasks();
  openTaskDetail(task.id);
}

function deleteDbEntityByEncoded(encodedTaskId, encodedEntityId) {
  deleteDbEntity(decodeFromAttr(encodedTaskId), decodeFromAttr(encodedEntityId));
}

async function uploadEntityCsv(taskId, entityId) {
  const task = getTask(taskId);
  if (!task || !APP.user) return;
  const isManager = APP.role === 'manager';
  const isAssignedCoordinator = APP.role === 'coordinator' && task.assignedTo === APP.user.id;
  if (!isManager && !isAssignedCoordinator) {
    alert('Only the assigned coordinator or manager can upload CSV for this entity.');
    return;
  }
  const entity = (task.dbEntities || []).find(e => e.id === entityId);
  if (!entity) return;
  const fileInputId = 'entity-csv-' + toDomSafeId(entityId);
  const fileInput = document.getElementById(fileInputId);
  const file = fileInput?.files?.[0];
  const ok = await importDbCsvFile(file, {
    coordinatorId: isManager ? (entity.coordinatorId || APP.user.id) : APP.user.id,
    coordinatorName: isManager ? (entity.coordinatorName || APP.user.name) : APP.user.name,
    sourceTaskId: task.id
  });
  if (!ok) return;
  entity.contactsUploaded = true;
  const coordId = isManager ? (entity.coordinatorId || APP.user.id) : APP.user.id;
  entity.contactCount = DATA.dbCompanies
    .filter(e => e.sourceTaskId === task.id && e.coordinatorId === coordId)
    .reduce((sum, e) => sum + (Array.isArray(e.contacts) ? e.contacts.length : 0), 0);
  entity.updatedAt = new Date().toISOString();
  saveTasks();
  saveDbCompanies();
  if (fileInput) fileInput.value = '';
  addNotification(`Entity CSV uploaded for "${escapeHtml(entity.name)}" in task "${escapeHtml(task.name)}".`, { browser: true });
  alert('CSV uploaded successfully.');
  openTaskDetail(task.id);
}

async function uploadEntityCsvByEncoded(encodedTaskId, encodedEntityId) {
  await uploadEntityCsv(decodeFromAttr(encodedTaskId), decodeFromAttr(encodedEntityId));
}

// ── TASK DETAIL MODAL ──
function openTaskDetail(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  normalizeTask(task);
  const isManager = APP.role === 'manager';
  const isAssignedCoordinator = APP.role === 'coordinator' && task.assignedTo === APP.user?.id;
  if (!isManager && !isAssignedCoordinator) {
    alert('You do not have access to this task.');
    return;
  }
  const canUpdateStatus = isManager || isAssignedCoordinator;
  const canEditEntities = isManager || isAssignedCoordinator;
  const coord = getCoordinator(task.assignedTo);
  const coordinators = getUsersByRole('coordinator');
  const p = calcTaskProgress(task);
  const encodedTaskId = encodeForAttr(task.id);
  const coordinatorOptions = coordinators.length
    ? coordinators.map(c => `<option value="${c.id}" ${task.assignedTo === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')
    : '<option value="">No coordinators available</option>';
  const taskDbFileInputId = `task-db-file-${toDomSafeId(task.id)}`;
  const dbUploads = task.dbRequired && APP.user
    ? DATA.dbCompanies.filter(entry => entry.sourceTaskId === task.id && entry.coordinatorId === APP.user.id)
    : [];
  const isDbWork = isDatabaseWorkTask(task);

  // Stage 1 + 2 HTML for Database Work tasks
  let dbWorkSection = '';
  if (isDbWork) {
    const entities = task.dbEntities || [];
    const entityInputId = 'db-entity-name-input-' + toDomSafeId(task.id);
    const entityRows = entities.map(entity => {
      const encodedEntityId = encodeForAttr(entity.id);
      const fileInputId = 'entity-csv-' + toDomSafeId(entity.id);
      const uploadedBadge = entity.contactsUploaded
        ? `<span class="badge badge-green">✅ ${entity.contactCount} contacts</span>`
        : `<span class="badge badge-gray">No upload yet</span>`;
      return `
        <div class="card mb-3" style="border:1px solid var(--border)">
          <div class="card-header" style="padding:var(--sp-3) var(--sp-4)">
            <div class="d-flex items-center gap-3" style="flex-wrap:wrap">
              <span class="fw-500">${escapeHtml(entity.name)}</span>
              ${uploadedBadge}
              ${entity.subCategory ? `<span class="badge badge-purple">${escapeHtml(entity.subCategory)}</span>` : ''}
              <span class="text-muted text-sm">by ${escapeHtml(entity.coordinatorName || 'Unknown')}</span>
            </div>
            ${canEditEntities ? `<button class="btn btn-ghost btn-sm" onclick="deleteDbEntityByEncoded('${encodedTaskId}','${encodedEntityId}')">🗑️</button>` : ''}
          </div>
          ${canEditEntities ? `
          <div class="card-body" style="padding:var(--sp-3) var(--sp-4)">
            <div class="text-sm text-muted mb-2">Stage 2: Upload contacts CSV (Name, Email, Company)</div>
            <div class="form-row">
              <div class="form-group">
                <input type="file" class="form-input" id="${fileInputId}" accept=".csv,text/csv">
              </div>
              <div class="form-group" style="align-self:flex-end">
                <button class="btn btn-primary btn-sm" onclick="uploadEntityCsvByEncoded('${encodedTaskId}','${encodedEntityId}')">Upload CSV</button>
              </div>
            </div>
          </div>` : ''}
        </div>
      `;
    }).join('');
    dbWorkSection = `
      <hr class="divider">
      <div class="fw-600 mb-3" style="font-size:14px">🗄️ Database Work Progress</div>
      <div class="text-sm text-muted mb-3">Sub-category: <strong>${escapeHtml(task.dbSubCategory || '—')}</strong></div>
      <div class="fw-500 mb-2" style="font-size:13px">Stage 1: Target Entities</div>
      ${canEditEntities ? `
      <div class="form-row mb-3">
        <div class="form-group">
          <input class="form-input" id="${entityInputId}" placeholder="e.g. ClickUp, IIT Bombay Incubator">
        </div>
        <div class="form-group" style="align-self:flex-end">
          <button class="btn btn-primary btn-sm" onclick="addDbEntity('${escapeHtml(task.id)}')">+ Add Entity</button>
        </div>
      </div>` : ''}
      ${entityRows || '<div class="text-muted text-sm mb-3">No entities added yet.</div>'}
    `;
  }

  const modal = document.getElementById('task-detail-modal');
  document.getElementById('task-detail-body').innerHTML = `
    <div class="d-flex items-center gap-3 mb-4" style="flex-wrap:wrap">
      ${catBadge(task.category)}
      ${statusBadge(task.status)}
      ${task.dbRequired ? '<span class="badge badge-purple">DB Required</span>' : ''}
      ${isDbWork ? '<span class="badge badge-yellow">DB Work</span>' : ''}
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
      <div class="meta-item">
        <div class="meta-key">DB Upload</div>
        <div class="meta-val mt-2">${task.dbRequired ? 'Required' : 'Not Required'}</div>
      </div>
      ${canUpdateStatus ? `<div class="meta-item">
        <div class="meta-key">Update Status</div>
        <select class="form-select mt-2" onchange="updateTaskStatusByEncoded('${encodedTaskId}', this.value, this)">
          ${['Not Started','In Progress','Done'].map(s => `<option ${task.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>` : ''}
      ${isManager ? `<div class="meta-item">
        <div class="meta-key">Reassign Coordinator</div>
        <select class="form-select mt-2" onchange="updateTaskAssignmentByEncoded('${encodedTaskId}', this.value, this)" ${coordinators.length ? '' : 'disabled'}>
          ${coordinatorOptions}
        </select>
      </div>` : ''}
    </div>

    ${isAssignedCoordinator && task.dbRequired && !isDbWork ? `
      <hr class="divider">
      <div class="fw-600 mb-4" style="font-size:14px">🗂️ DB Upload Required</div>
      <div class="card" style="margin-bottom:var(--sp-4)">
        <div class="card-body">
          <div class="text-sm text-muted mb-3">
            Upload CSV with columns: Name, Email, Company before marking this task as Done.
          </div>
          <div class="text-sm mb-3">
            Uploaded companies for this task: <span class="fw-600">${dbUploads.length}</span>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">CSV File</label>
              <input type="file" class="form-input" id="${taskDbFileInputId}" accept=".csv,text/csv">
            </div>
            <div class="form-group" style="align-self:flex-end">
              <button class="btn btn-primary" onclick="uploadTaskDbCsvByEncoded('${encodedTaskId}')">Upload DB CSV</button>
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    ${dbWorkSection}

    <hr class="divider">
    <div class="fw-600 mb-4" style="font-size:14px">📊 Sub-tasks & Metrics</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Metric</th><th>Value</th>${task.subtasks.some(s=>s.target) ? '<th>Target</th><th>Rate</th>' : ''}</tr></thead>
        <tbody>
          ${task.subtasks.length ? task.subtasks.map(s => {
            const rate = s.target ? Math.round((s.value/s.target)*100) : null;
            const canToggle = isManager || (APP.role === 'coordinator' && task.assignedTo === APP.user?.id);
            return `<tr class="subtask-row">
              <td>${escapeHtml(s.name)}</td>
              <td>
                ${s.type === 'checkbox'
                  ? `<span id="subtask-badge-${s.id}" class="badge ${s.value ? 'badge-green' : 'badge-gray'}" style="${canToggle ? 'cursor:pointer' : ''}" ${canToggle ? `onclick="toggleSubtask('${task.id}','${s.id}')"` : ''}>${s.value ? '✅ Done' : '❌ Pending'}</span>`
                  : `<input type="number" value="${s.value||0}" min="0"
                      ${!canToggle ? 'disabled' : ''}
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
          }).join('') : '<tr><td colspan="4"><div class="text-muted text-sm">No subtasks.</div></td></tr>'}
        </tbody>
      </table>
    </div>

    <hr class="divider">
    <div class="fw-600 mb-4" style="font-size:14px">🕐 Timeline</div>
    <div class="timeline">
      ${task.timeline.length ? task.timeline.map(tl => `
        <div class="timeline-item">
          <div class="timeline-dot ${tl.done ? 'done' : 'pending'}"></div>
          <div class="timeline-date">${tl.date}</div>
          <div class="timeline-title">${tl.title}</div>
          <div class="timeline-body">${tl.body}</div>
        </div>
      `).join('') : '<div class="text-muted text-sm">No timeline entries.</div>'}
    </div>

    <hr class="divider">
    <div class="fw-600 mb-4" style="font-size:14px">💬 Comments</div>
    <div id="comment-list-${task.id}">
      ${task.comments.length ? task.comments.map(c => `
        <div class="comment">
          <div class="avatar" style="width:28px;height:28px;font-size:11px;flex-shrink:0">${escapeHtml(c.initials || '?')}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-name">${escapeHtml(c.user)}</span>
              <span class="comment-time">${escapeHtml(c.time)}</span>
            </div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
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
  if (!sub) return;
  if (sub.type === 'checkbox') {
    sub.value = val === true || val === 'true' || val === 1;
  } else {
    sub.value = parseFloat(val) || 0;
  }
  saveTasks();
}

function toggleSubtask(taskId, subId) {
  const task = getTask(taskId);
  if (!task) return;
  const isManager = APP.role === 'manager';
  const isAssignedCoordinator = APP.role === 'coordinator' && task.assignedTo === APP.user?.id;
  if (!isManager && !isAssignedCoordinator) return;
  const sub = task.subtasks.find(s => s.id === subId);
  if (!sub || sub.type !== 'checkbox') return;
  sub.value = !sub.value;
  saveTasks();
  // Re-render just the badge
  const badge = document.getElementById('subtask-badge-' + subId);
  if (badge) {
    badge.className = 'badge ' + (sub.value ? 'badge-green' : 'badge-gray');
    badge.textContent = sub.value ? '✅ Done' : '❌ Pending';
  }
}

function updateTaskStatus(taskId, status, selectEl) {
  const task = getTask(taskId);
  if (!task || !APP.user) return;
  const prevStatus = task.status;
  const isManager = APP.role === 'manager';
  const isAssignedCoordinator = APP.role === 'coordinator' && task.assignedTo === APP.user.id;
  if (!isManager && !isAssignedCoordinator) {
    if (selectEl) selectEl.value = prevStatus;
    return;
  }
  if (shouldBlockTaskCompletion(task, status, isAssignedCoordinator, APP.user.id)) {
    alert('This task requires DB upload. Please upload a CSV (Name, Email, Company) in the DB Upload Required section before marking it Done.');
    if (selectEl) selectEl.value = prevStatus;
    return;
  }
  task.status = status;
  saveTasks();
  addNotification(`Task "${escapeHtml(task.name)}" status changed to ${status}.`, { browser: true });
  renderTasks(window._currentTaskFilter || 'all');
  renderDashboard();
}

function updateTaskStatusByEncoded(encodedTaskId, status, selectEl) {
  updateTaskStatus(decodeFromAttr(encodedTaskId), status, selectEl);
}

function updateTaskAssignment(taskId, assignedTo, selectEl) {
  const task = getTask(taskId);
  if (!task || APP.role !== 'manager') return;
  const nextAssignee = getUserById(assignedTo);
  if (!nextAssignee || nextAssignee.role !== 'coordinator') {
    if (selectEl) selectEl.value = task.assignedTo || '';
    return;
  }
  const previousAssignee = getCoordinator(task.assignedTo);
  task.assignedTo = assignedTo;
  console.log('Assigned task to coordinator id:', assignedTo);
  task.timeline.unshift({
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    title: 'Task Reassigned',
    body: `Reassigned from ${previousAssignee?.name || 'Unassigned'} to ${nextAssignee.name}.`,
    done: true
  });
  addNotification(`Task "${escapeHtml(task.name)}" reassigned to ${escapeHtml(nextAssignee.name)}.`, { browser: true });
  saveTasks();
  renderTasks(window._currentTaskFilter || 'all');
  renderDashboard();
  openTaskDetail(taskId);
}

function updateTaskAssignmentByEncoded(encodedTaskId, assignedTo, selectEl) {
  updateTaskAssignment(decodeFromAttr(encodedTaskId), assignedTo, selectEl);
}

async function uploadTaskDbCsv(taskId) {
  const task = getTask(taskId);
  if (!task || !APP.user) return;
  if (APP.role !== 'coordinator' || task.assignedTo !== APP.user.id) {
    alert('Only the assigned coordinator can upload DB for this task.');
    return;
  }
  const fileInput = document.getElementById(`task-db-file-${toDomSafeId(task.id)}`);
  const file = fileInput?.files?.[0];
  const ok = await importDbCsvFile(file, {
    coordinatorId: APP.user.id,
    coordinatorName: APP.user.name,
    sourceTaskId: task.id
  });
  if (!ok) return;
  saveTasks();
  saveDbCompanies();
  if (fileInput) fileInput.value = '';
  addNotification(`DB CSV uploaded for task "${escapeHtml(task.name)}".`, { browser: true });
  alert('DB CSV uploaded successfully.');
  openTaskDetail(task.id);
}

async function uploadTaskDbCsvByEncoded(encodedTaskId) {
  await uploadTaskDbCsv(decodeFromAttr(encodedTaskId));
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
  saveTasks();
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
function renderTaskCategoryOptions(selectedCategory) {
  const selected = selectedCategory || DATA.categories[0] || '';
  return DATA.categories.map(c => `<option ${selected===c?'selected':''}>${escapeHtml(c)}</option>`).join('');
}

function refreshTaskCategorySelect(selectedCategory) {
  const select = document.getElementById('nt-cat');
  if (!select) return;
  select.innerHTML = renderTaskCategoryOptions(selectedCategory);
}

function sameCategory(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function addTaskCategory() {
  if (APP.role !== 'manager') return;
  const name = prompt('Enter new category name:')?.trim();
  if (!name) return;
  if (DATA.categories.some(c => sameCategory(c, name))) {
    alert('Category already exists.');
    return;
  }
  DATA.categories.push(name);
  saveCategories();
  refreshTaskCategorySelect(name);
}

function renameTaskCategory() {
  if (APP.role !== 'manager') return;
  const select = document.getElementById('nt-cat');
  const current = select?.value;
  if (!current) return;
  const next = prompt('Edit category name:', current)?.trim();
  if (!next || next === current) return;
  if (DATA.categories.some(c => sameCategory(c, next) && !sameCategory(c, current))) {
    alert('Category already exists.');
    return;
  }
  const idx = DATA.categories.findIndex(c => sameCategory(c, current));
  if (idx === -1) return;
  DATA.categories[idx] = next;
  DATA.tasks.forEach(t => {
    if (sameCategory(t.category, current)) t.category = next;
  });
  saveCategories();
  saveTasks();
  refreshTaskCategorySelect(next);
}

function deleteTaskCategory() {
  if (APP.role !== 'manager') return;
  const select = document.getElementById('nt-cat');
  const current = select?.value;
  if (!current) return;
  if (DATA.categories.length <= 1) {
    alert('At least one category is required.');
    return;
  }
  if (!confirm(`Delete "${current}" category? Tasks in this category will move to "Uncategorized".`)) return;
  DATA.categories = DATA.categories.filter(c => !sameCategory(c, current));
  if (!DATA.categories.some(c => sameCategory(c, 'Uncategorized'))) DATA.categories.push('Uncategorized');
  DATA.tasks.forEach(t => {
    if (sameCategory(t.category, current)) t.category = 'Uncategorized';
  });
  saveCategories();
  saveTasks();
  refreshTaskCategorySelect('Uncategorized');
}

function openNewTaskModal() {
  const modal = document.getElementById('new-task-modal');
  const coordinators = getUsersByRole('coordinator');
  const coordinatorOptions = coordinators.length
    ? coordinators.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')
    : `<option value="" disabled selected>No coordinators yet</option>`;
  const defaultCategory = DATA.categories[0] || '';
  const subCatOptions = DATA.dbSubCategories.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  const isDbWork = defaultCategory === 'Database Work';
  document.getElementById('new-task-form').innerHTML = `
    <div class="form-group">
      <label class="form-label">Task Name</label>
      <input class="form-input" id="nt-name" placeholder="e.g. Incubator Outreach – Phase 2">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label d-flex items-center" style="justify-content:space-between;gap:8px">
          <span>Category</span>
          ${APP.role === 'manager' ? `<span class="d-flex gap-2">
            <button type="button" class="btn btn-ghost btn-sm" onclick="addTaskCategory()">＋</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="renameTaskCategory()">✏️</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="deleteTaskCategory()">🗑️</button>
          </span>` : ''}
        </label>
        <select class="form-select" id="nt-cat" onchange="onTaskCategoryChange(this.value)">
          ${renderTaskCategoryOptions(defaultCategory)}
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
    <div class="form-group">
      <label class="d-flex items-center gap-2" style="font-size:13px">
        <input type="checkbox" id="nt-db-required">
        <span>DB required (coordinator must upload CSV: Name, Email, Company before marking Done)</span>
      </label>
    </div>

    <div id="db-work-block" style="display:${isDbWork ? '' : 'none'}">
      <hr class="divider">
      <div class="fw-600 mb-2" style="font-size:13px">🗄️ Database Work Settings</div>
      <div class="text-sm text-muted mb-3">Database Work tasks use Stage 1 entity selection and Stage 2 contact CSV upload.</div>
      <div class="form-group">
        <label class="form-label">Sub-category</label>
        <select class="form-select" id="nt-db-sub-category">
          <option value="">— Select sub-category —</option>
          ${subCatOptions}
        </select>
      </div>
    </div>

    <hr class="divider">
    <div id="subtask-builder-section">
      ${renderSubtaskBuilder([])}
    </div>
  `;
  openModal('new-task-modal');
}

function onTaskCategoryChange(category) {
  const block = document.getElementById('db-work-block');
  const dbReqCheck = document.getElementById('nt-db-required');
  if (!block) return;
  if (category === 'Database Work') {
    block.style.display = '';
    if (dbReqCheck) dbReqCheck.checked = true;
  } else {
    block.style.display = 'none';
  }
}

function saveNewTask() {
  const name = document.getElementById('nt-name')?.value?.trim();
  if (!name) { alert('Please enter a task name'); return; }
  const assignedTo = document.getElementById('nt-assign')?.value || '';
  if (!assignedTo) {
    alert('Please add a coordinator before assigning tasks.');
    return;
  }
  const category = document.getElementById('nt-cat')?.value || '';
  const isDbWork = category === 'Database Work';
  let dbSubCategory = '';
  if (isDbWork) {
    dbSubCategory = document.getElementById('nt-db-sub-category')?.value || '';
    if (!dbSubCategory) {
      alert('Please select a sub-category for Database Work task.');
      return;
    }
  }
  const subtasks = collectSubtasksFromForm();
  const newTask = {
    id: createId('task'),
    name,
    category,
    assignedTo,
    status: document.getElementById('nt-status')?.value || 'Not Started',
    deadline: document.getElementById('nt-deadline')?.value || '',
    dbRequired: isDbWork ? true : !!document.getElementById('nt-db-required')?.checked,
    dbWorkflowEnabled: isDbWork,
    dbSubCategory: isDbWork ? dbSubCategory : '',
    dbEntities: [],
    comments: [],
    subtasks,
    timeline: [{ date: new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'}), title: 'Task Created', body: 'Task has been created and assigned', done: true }]
  };
  DATA.tasks.unshift(newTask);
  saveTasks();
  closeModal('new-task-modal');
  addNotification(`Task created: "${escapeHtml(newTask.name)}"`, { browser: true });
  renderTasks();
  renderDashboard();
}

function openEditTaskModal(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  normalizeTask(task);
  const coordinators = getUsersByRole('coordinator');
  const isDbWork = isDatabaseWorkTask(task);
  const subCatOptions = DATA.dbSubCategories.map(s =>
    `<option value="${escapeHtml(s)}" ${task.dbSubCategory === s ? 'selected' : ''}>${escapeHtml(s)}</option>`
  ).join('');
  document.getElementById('new-task-modal-title').textContent = 'Edit Task';
  document.getElementById('new-task-form').innerHTML = `
    <div class="form-group">
      <label class="form-label">Task Name</label>
      <input class="form-input" id="nt-name" value="${escapeHtml(task.name)}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label d-flex items-center" style="justify-content:space-between;gap:8px">
          <span>Category</span>
          ${APP.role === 'manager' ? `<span class="d-flex gap-2">
            <button type="button" class="btn btn-ghost btn-sm" onclick="addTaskCategory()">＋</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="renameTaskCategory()">✏️</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="deleteTaskCategory()">🗑️</button>
          </span>` : ''}
        </label>
        <select class="form-select" id="nt-cat" onchange="onTaskCategoryChange(this.value)">
          ${renderTaskCategoryOptions(task.category)}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Assigned To</label>
        <select class="form-select" id="nt-assign">
          ${coordinators.length
            ? coordinators.map(c => `<option value="${c.id}" ${task.assignedTo===c.id?'selected':''}>${escapeHtml(c.name)}</option>`).join('')
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
    <div class="form-group">
      <label class="d-flex items-center gap-2" style="font-size:13px">
        <input type="checkbox" id="nt-db-required" ${task.dbRequired ? 'checked' : ''}>
        <span>DB required (coordinator must upload CSV: Name, Email, Company before marking Done)</span>
      </label>
    </div>

    <div id="db-work-block" style="display:${isDbWork ? '' : 'none'}">
      <hr class="divider">
      <div class="fw-600 mb-2" style="font-size:13px">🗄️ Database Work Settings</div>
      <div class="text-sm text-muted mb-3">Database Work tasks use Stage 1 entity selection and Stage 2 contact CSV upload.</div>
      <div class="form-group">
        <label class="form-label">Sub-category</label>
        <select class="form-select" id="nt-db-sub-category">
          <option value="">— Select sub-category —</option>
          ${subCatOptions}
        </select>
      </div>
    </div>

    <hr class="divider">
    <div id="subtask-builder-section">
      ${renderSubtaskBuilder(task.subtasks)}
    </div>
  `;
  document.getElementById('save-new-task-btn').onclick = () => {
    const editCategory = document.getElementById('nt-cat')?.value || task.category;
    const editIsDbWork = editCategory === 'Database Work';
    let editDbSubCategory = task.dbSubCategory || '';
    if (editIsDbWork) {
      editDbSubCategory = document.getElementById('nt-db-sub-category')?.value || '';
      if (!editDbSubCategory) {
        alert('Please select a sub-category for Database Work task.');
        return;
      }
    }
    task.name = document.getElementById('nt-name')?.value?.trim() || task.name;
    task.category = editCategory;
    task.assignedTo = document.getElementById('nt-assign')?.value || task.assignedTo;
    task.status = document.getElementById('nt-status')?.value || task.status;
    task.deadline = document.getElementById('nt-deadline')?.value || '';
    task.dbRequired = editIsDbWork ? true : !!document.getElementById('nt-db-required')?.checked;
    task.dbWorkflowEnabled = editIsDbWork;
    task.dbSubCategory = editIsDbWork ? editDbSubCategory : '';
    if (!Array.isArray(task.dbEntities)) task.dbEntities = [];
    task.subtasks = collectSubtasksFromForm();
    saveTasks();
    closeModal('new-task-modal');
    renderTasks();
  };
  openModal('new-task-modal');
}

function deleteTask(taskId) {
  if (!confirm('Delete this task? This cannot be undone.')) return;
  const idx = DATA.tasks.findIndex(t => t.id === taskId);
  if (idx !== -1) DATA.tasks.splice(idx, 1);
  saveTasks();
  renderTasks();
  renderDashboard();
}

// ── TIMELINE PAGE ──
function setTimelineTab(tab) {
  APP.timelineTab = tab === 'manager' ? 'manager' : 'task';
  renderTimeline();
}

function setManagerTimelineMessage(text, type = '') {
  APP.managerTimelineMessage = { text: String(text || ''), type: String(type || '') };
}

async function uploadManagerTimelineCsv() {
  if (APP.role !== 'manager') return;
  const fileInput = document.getElementById('manager-timeline-csv-file');
  const file = fileInput?.files?.[0];
  if (!file) {
    setManagerTimelineMessage('Please choose a CSV file.', 'error');
    renderTimeline();
    return;
  }
  const isCsv = file.name?.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
  if (!isCsv) {
    setManagerTimelineMessage('Please upload a valid CSV file.', 'error');
    renderTimeline();
    return;
  }
  let text = '';
  try {
    text = await file.text();
  } catch {
    setManagerTimelineMessage('Unable to read the selected file.', 'error');
    renderTimeline();
    return;
  }
  const { entries, error } = parseManagerTimelineCsv(text);
  if (error) {
    setManagerTimelineMessage(error, 'error');
    renderTimeline();
    return;
  }
  DATA.managerTimeline.push(...entries);
  saveManagerTimeline();
  setManagerTimelineMessage(`${entries.length} timeline entr${entries.length === 1 ? 'y' : 'ies'} added.`, 'success');
  addNotification(`Manager timeline CSV uploaded: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} added.`, { browser: true });
  renderTimeline();
}

function addManagerTimelineItem() {
  if (APP.role !== 'manager') return;
  DATA.managerTimeline.push({
    id: createId('manager-timeline'),
    task: '',
    deadline: '',
    comments: '',
    completed: false
  });
  saveManagerTimeline();
  setManagerTimelineMessage('', '');
  renderTimeline();
}

function updateManagerTimelineField(id, field, value) {
  if (APP.role !== 'manager') return;
  const item = DATA.managerTimeline.find(entry => entry.id === id);
  if (!item) return;
  switch (field) {
    case 'deadline':
      item.deadline = normalizeDateForInput(value);
      saveManagerTimeline();
      renderTimeline();
      return;
    case 'task':
    case 'comments':
      item[field] = String(value || '');
      saveManagerTimeline();
      renderTimeline();
      return;
    default:
      console.warn('Invalid manager timeline field:', field);
  }
}

function updateManagerTimelineFieldByEncoded(encodedId, field, value) {
  updateManagerTimelineField(decodeFromAttr(encodedId), field, value);
}

function toggleManagerTimelineCompleted(id, completed) {
  if (APP.role !== 'manager') return;
  const item = DATA.managerTimeline.find(entry => entry.id === id);
  if (!item) return;
  item.completed = !!completed;
  saveManagerTimeline();
  renderTimeline();
}

function toggleManagerTimelineCompletedByEncoded(encodedId, completed) {
  toggleManagerTimelineCompleted(decodeFromAttr(encodedId), completed);
}

function deleteManagerTimelineItem(id) {
  if (APP.role !== 'manager') return;
  const idx = DATA.managerTimeline.findIndex(entry => entry.id === id);
  if (idx === -1) return;
  DATA.managerTimeline.splice(idx, 1);
  saveManagerTimeline();
  setManagerTimelineMessage('', '');
  renderTimeline();
}

function deleteManagerTimelineItemByEncoded(encodedId) {
  deleteManagerTimelineItem(decodeFromAttr(encodedId));
}

function renderTaskTimelineView(tasks, byMonth) {
  return `
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

function renderManagerTimelineView() {
  const rows = [...DATA.managerTimeline].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
  const messageClass = APP.managerTimelineMessage.type === 'error'
    ? 'badge-red'
    : APP.managerTimelineMessage.type === 'success'
      ? 'badge-green'
      : 'badge-gray';
  return `
    <div class="card mb-6">
      <div class="card-header"><span class="card-title">Eureka! Manager Timeline</span></div>
      <div class="card-body">
        <div class="d-flex gap-3 items-center mb-4" style="flex-wrap:wrap">
          <input type="file" class="form-input" id="manager-timeline-csv-file" accept=".csv,text/csv" style="min-width:220px;flex:1">
          <button class="btn btn-primary" onclick="uploadManagerTimelineCsv()">Upload CSV</button>
          <button class="btn btn-secondary" onclick="addManagerTimelineItem()">+ Add Timeline Entry</button>
        </div>
        <div class="text-sm text-muted mb-3">CSV format: <strong>Task, Deadline, Comments</strong>. Comments can be blank.</div>
        ${APP.managerTimelineMessage.text ? `<div class="mb-4"><span class="badge ${messageClass}">${escapeHtml(APP.managerTimelineMessage.text)}</span></div>` : ''}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="min-width:220px">Task</th>
                <th style="min-width:160px">Deadline</th>
                <th style="min-width:220px">Comments</th>
                <th style="width:120px">Completed</th>
                <th style="width:96px">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(item => {
                const encodedId = encodeForAttr(item.id);
                return `
                  <tr>
                    <td><input class="form-input" value="${escapeHtml(item.task)}" placeholder="Enter task" onchange="updateManagerTimelineFieldByEncoded('${encodedId}','task',this.value)"></td>
                    <td><input type="date" class="form-input" value="${escapeHtml(item.deadline || '')}" onchange="updateManagerTimelineFieldByEncoded('${encodedId}','deadline',this.value)"></td>
                    <td><input class="form-input" value="${escapeHtml(item.comments)}" placeholder="Optional" onchange="updateManagerTimelineFieldByEncoded('${encodedId}','comments',this.value)"></td>
                    <td><label class="d-flex items-center gap-2" style="font-size:13px"><input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleManagerTimelineCompletedByEncoded('${encodedId}',this.checked)"><span>Done</span></label></td>
                    <td><button class="btn btn-ghost btn-sm" onclick="deleteManagerTimelineItemByEncoded('${encodedId}')">Delete</button></td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="5"><div class="text-sm text-muted">No timeline entries yet. Upload a CSV or add one manually.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTimeline() {
  const el = document.getElementById('page-timeline');
  const isManager = APP.role === 'manager';
  if (!isManager && APP.timelineTab === 'manager') APP.timelineTab = 'task';
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

    <div class="tabs" style="margin-bottom:var(--sp-4)">
      <div class="tab ${APP.timelineTab === 'task' ? 'active' : ''}" onclick="setTimelineTab('task')">Timeline</div>
      ${isManager ? `<div class="tab ${APP.timelineTab === 'manager' ? 'active' : ''}" onclick="setTimelineTab('manager')">Eureka! Manager Timeline</div>` : ''}
    </div>

    ${APP.timelineTab === 'manager' && isManager ? renderManagerTimelineView() : renderTaskTimelineView(tasks, byMonth)}
  `;
}

// ── RESOURCES ──
function renderResources() {
  const el = document.getElementById('page-resources');
  const isManager = APP.role === 'manager';
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
        ${isManager ? `<button class="btn btn-primary" onclick="openResourceModal()">＋ Add Resource</button>` : ''}
      </div>
    </div>

    <div class="tabs" id="res-tabs">
      <div class="tab active" data-cat="all">All</div>
      ${cats.map(c => `<div class="tab" data-cat="${encodeURIComponent(c)}">${escapeHtml(c)}</div>`).join('')}
    </div>

    <div class="resource-grid" id="res-grid">
      ${renderResourceCards(DATA.resources, isManager)}
    </div>
  `;

  window.filterRes = (cat, tab) => {
    document.querySelectorAll('#res-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filtered = cat === 'all' ? DATA.resources : DATA.resources.filter(r => r.category === cat);
    document.getElementById('res-grid').innerHTML = renderResourceCards(filtered, isManager);
    bindResourceActions(isManager);
  };
  window.searchResources = (q) => {
    const filtered = DATA.resources.filter(r =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.desc.toLowerCase().includes(q.toLowerCase())
    );
    document.getElementById('res-grid').innerHTML = renderResourceCards(filtered, isManager);
    bindResourceActions(isManager);
  };

  document.querySelectorAll('#res-tabs .tab').forEach(tab => {
    tab.onclick = () => {
      const encodedCat = tab.dataset.cat || 'all';
      const cat = encodedCat === 'all' ? 'all' : decodeURIComponent(encodedCat);
      window.filterRes(cat, tab);
    };
  });
  bindResourceActions(isManager);
}

function renderResourceCards(resources, isManager) {
  if (!resources.length) return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No resources found</div></div>`;
  return resources.map(r => `
    <div class="resource-card" data-resource-url="${encodeURIComponent(sanitizeUrl(r.url))}">
      <div class="resource-icon" style="background:var(--accent-light)">${escapeHtml(r.icon)}</div>
      <div class="resource-name">${escapeHtml(r.name)}</div>
      <div class="resource-desc">${escapeHtml(r.desc)}</div>
      <div class="resource-type">${escapeHtml(r.type)}</div>
      ${isManager ? `
      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-ghost btn-sm" data-resource-edit-id="${r.id}">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" data-resource-delete-id="${r.id}">🗑️ Delete</button>
      </div>` : ''}
    </div>
  `).join('');
}

function bindResourceActions(isManager) {
  document.querySelectorAll('#res-grid .resource-card').forEach(card => {
    card.onclick = () => {
      const safeUrl = sanitizeUrl(decodeURIComponent(card.dataset.resourceUrl || '#'));
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    };
  });
  if (!isManager) return;
  document.querySelectorAll('#res-grid [data-resource-edit-id]').forEach(btn => {
    btn.onclick = (event) => {
      event.stopPropagation();
      openResourceModal(btn.dataset.resourceEditId);
    };
  });
  document.querySelectorAll('#res-grid [data-resource-delete-id]').forEach(btn => {
    btn.onclick = (event) => {
      event.stopPropagation();
      deleteResource(btn.dataset.resourceDeleteId);
    };
  });
}

function openResourceModal(resourceId) {
  if (APP.role !== 'manager') return;
  APP.editingResourceId = resourceId || null;
  const resource = DATA.resources.find(r => r.id === resourceId) || null;
  const title = document.getElementById('resource-modal-title');
  const form = document.getElementById('resource-form');
  if (!title || !form) return;
  title.textContent = resource ? 'Edit Resource' : 'Add Resource';
  form.innerHTML = `
    <div class="form-group">
      <label class="form-label">Name</label>
      <input class="form-input" id="res-name" value="${escapeHtml(resource?.name || '')}" placeholder="Resource name">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <input class="form-input" id="res-category" value="${escapeHtml(resource?.category || '')}" placeholder="e.g. Templates">
      </div>
      <div class="form-group">
        <label class="form-label">Type</label>
        <input class="form-input" id="res-type" value="${escapeHtml(resource?.type || '')}" placeholder="e.g. Google Sheet">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Icon</label>
        <input class="form-input" id="res-icon" value="${escapeHtml(resource?.icon || '📚')}" placeholder="Emoji icon">
      </div>
      <div class="form-group">
        <label class="form-label">URL</label>
        <input class="form-input" id="res-url" value="${escapeHtml(resource?.url || '#')}" placeholder="https://...">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-input" id="res-desc" rows="3" placeholder="Short description">${escapeHtml(resource?.desc || '')}</textarea>
    </div>
  `;
  openModal('resource-modal');
}

function saveResource() {
  if (APP.role !== 'manager') return;
  const name = document.getElementById('res-name')?.value?.trim();
  const category = document.getElementById('res-category')?.value?.trim();
  const type = document.getElementById('res-type')?.value?.trim();
  const icon = document.getElementById('res-icon')?.value?.trim() || '📚';
  const desc = document.getElementById('res-desc')?.value?.trim();
  const rawUrl = document.getElementById('res-url')?.value?.trim() || '';
  const url = sanitizeUrl(rawUrl);
  if (!name || !category || !type || !desc) {
    alert('Please fill in all required resource fields.');
    return;
  }
  if (rawUrl && rawUrl !== '#' && url === '#') {
    alert('Please enter a valid URL (http://, https://, mailto:, or tel:) or use #.');
    return;
  }
  if (APP.editingResourceId) {
    const resource = DATA.resources.find(r => r.id === APP.editingResourceId);
    if (!resource) return;
    resource.name = name;
    resource.category = category;
    resource.type = type;
    resource.icon = icon;
    resource.desc = desc;
    resource.url = url;
  } else {
    DATA.resources.unshift({
      id: createId('resource'),
      name,
      category,
      type,
      icon,
      desc,
      url
    });
  }
  closeModal('resource-modal');
  APP.editingResourceId = null;
  saveResources();
  renderResources();
}

function deleteResource(resourceId) {
  if (APP.role !== 'manager') return;
  if (!confirm('Delete this resource?')) return;
  const idx = DATA.resources.findIndex(r => r.id === resourceId);
  if (idx !== -1) DATA.resources.splice(idx, 1);
  saveResources();
  renderResources();
}

// ── POC PAGE ──
function renderPoc() {
  const el = document.getElementById('page-poc');
  const isManager = APP.role === 'manager';
  const visiblePocs = getVisiblePocs();
  const tableColspan = isManager ? 8 : 6;
  const otherManagers = getUsersByRole('manager').filter(m => m.id !== APP.user?.id);

  el.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">POC</div>
        <div class="section-desc">Add and manage your point of contacts</div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header"><span class="card-title">Add New POC</span></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="poc-name" placeholder="e.g. Rohan Sharma">
          </div>
          <div class="form-group">
            <label class="form-label">Organization / Company (if any)</label>
            <input class="form-input" id="poc-org" placeholder="e.g. ABC Ventures">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-select" id="poc-category" onchange="togglePocOtherCategory(this.value)">
              ${DATA.pocCategories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group" id="poc-other-wrap" style="display:none">
            <label class="form-label">Custom Category</label>
            <input class="form-input" id="poc-category-other" placeholder="Enter category">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email (if any)</label>
            <input class="form-input" id="poc-email" placeholder="e.g. name@company.com">
          </div>
          <div class="form-group">
            <label class="form-label">Contact Number (if any)</label>
            <input class="form-input" id="poc-contact" placeholder="e.g. +91 9876543210">
          </div>
        </div>
        ${isManager && otherManagers.length ? `
        <div class="form-group">
          <label class="form-label">Visible to Other Managers</label>
          <div class="d-flex" style="flex-wrap:wrap;gap:var(--sp-4)">
            ${otherManagers.map(m => `
              <label class="d-flex items-center gap-2" style="font-size:13px">
                <input type="checkbox" class="poc-share-manager" value="${m.id}">
                <span>${escapeHtml(m.name)}</span>
              </label>
            `).join('')}
          </div>
        </div>
        ` : ''}
        <button class="btn btn-primary" onclick="savePocEntry()">Save POC</button>
      </div>
    </div>

    ${isManager ? `
    <div class="card mb-6">
      <div class="card-header"><span class="card-title">POC Categories</span></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Add Predefined Category</label>
            <input class="form-input" id="poc-new-category" placeholder="e.g. Incubator Partner">
          </div>
          <div class="form-group" style="align-self:flex-end">
            <button class="btn btn-secondary" onclick="addPocCategory()">Add Category</button>
          </div>
        </div>
        <div class="d-flex" style="flex-wrap:wrap;gap:var(--sp-2)">
          ${DATA.pocCategories.map(c => `<span class="badge badge-gray">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    <div class="card">
      <div class="card-header">
        <span class="card-title">POC List</span>
        <span class="text-muted text-sm">${visiblePocs.length} item${visiblePocs.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Category</th>
              <th>Email</th>
              <th>Contact Number</th>
              ${isManager ? '<th>Coordinator</th><th>Added By</th>' : ''}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${visiblePocs.length ? visiblePocs.map(p => {
              const encodedPocId = encodeForAttr(p.id);
              const canManage = canManagePocEntry(p);
              return `
              <tr>
                <td class="td-main">${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.organization || '—')}</td>
                <td>${catBadge(escapeHtml(p.category))}</td>
                <td>${escapeHtml(p.email || '—')}</td>
                <td>${escapeHtml(p.contact || '—')}</td>
                ${isManager ? `
                  <td>${p.createdByRole === 'coordinator' ? escapeHtml(p.createdByName || '—') : '—'}</td>
                  <td>${escapeHtml(p.createdByName || '—')} <span class="text-muted text-sm">(${p.createdByRole === 'manager' ? 'Manager' : 'Coordinator'})</span></td>
                ` : ''}
                <td>
                  ${canManage ? `
                    <div class="d-flex gap-2">
                      <button class="btn btn-ghost btn-sm" onclick="editPocEntryByEncoded('${encodedPocId}')">✏️ Edit</button>
                      <button class="btn btn-ghost btn-sm" onclick="deletePocEntryByEncoded('${encodedPocId}')">🗑️ Delete</button>
                    </div>
                  ` : '—'}
                </td>
              </tr>
            `;
            }).join('') : `<tr><td colspan="${tableColspan}"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No POCs yet</div></div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  window.togglePocOtherCategory = (value) => {
    const wrap = document.getElementById('poc-other-wrap');
    if (!wrap) return;
    wrap.style.display = value === 'Other' ? '' : 'none';
  };

  window.addPocCategory = () => {
    if (APP.role !== 'manager') return;
    const input = document.getElementById('poc-new-category');
    const value = input?.value?.trim();
    if (!value) {
      alert('Please enter a category name for POC classification.');
      return;
    }
    const exists = DATA.pocCategories.some(c => c.toLowerCase() === value.toLowerCase());
    if (exists) {
      alert('This category already exists. Please check the list below and enter a different category name.');
      return;
    }
    DATA.pocCategories.push(value);
    renderPoc();
  };

  window.savePocEntry = () => {
    const name = document.getElementById('poc-name')?.value?.trim();
    const organization = document.getElementById('poc-org')?.value?.trim() || '';
    const selectedCategory = document.getElementById('poc-category')?.value || '';
    const customCategory = document.getElementById('poc-category-other')?.value?.trim() || '';
    const email = document.getElementById('poc-email')?.value?.trim() || '';
    const contact = document.getElementById('poc-contact')?.value?.trim() || '';
    if (!name) {
      alert('Please enter the POC name.');
      return;
    }
    const category = selectedCategory === 'Other' ? customCategory : selectedCategory;
    if (!category) {
      alert('Please select a category, or if "Other" is selected, enter a custom category.');
      return;
    }
    const sharedManagerIds = APP.role === 'manager'
      ? Array.from(document.querySelectorAll('.poc-share-manager:checked')).map(el => el.value)
      : [];
    DATA.pocs.unshift({
      id: createId('poc'),
      name,
      organization,
      category,
      email,
      contact,
      createdBy: APP.user?.id || '',
      createdByName: APP.user?.name || '',
      createdByRole: APP.role || '',
      sharedManagerIds,
      createdAt: new Date().toISOString()
    });
    savePocs();
    renderPoc();
  };
}

function editPocEntry(pocId) {
  const entry = DATA.pocs.find(item => item.id === pocId);
  if (!entry || !canManagePocEntry(entry)) return;
  const name = prompt('Edit POC name:', entry.name || '')?.trim();
  if (!name) return;
  const organization = prompt('Edit organization/company (optional):', entry.organization || '');
  if (organization === null) return;
  const category = prompt('Edit category:', entry.category || '')?.trim();
  if (!category) {
    alert('Category is required.');
    return;
  }
  const email = prompt('Edit email (optional):', entry.email || '');
  if (email === null) return;
  const contact = prompt('Edit contact number (optional):', entry.contact || '');
  if (contact === null) return;
  entry.name = name;
  entry.organization = String(organization || '').trim();
  entry.category = category;
  entry.email = String(email || '').trim();
  entry.contact = String(contact || '').trim();
  savePocs();
  renderPoc();
}

function editPocEntryByEncoded(encodedPocId) {
  editPocEntry(decodeFromAttr(encodedPocId));
}

function deletePocEntry(pocId) {
  const idx = DATA.pocs.findIndex(item => item.id === pocId);
  if (idx === -1) return;
  const entry = DATA.pocs[idx];
  if (!canManagePocEntry(entry)) return;
  if (!confirm('Delete this POC?')) return;
  DATA.pocs.splice(idx, 1);
  savePocs();
  renderPoc();
}

function deletePocEntryByEncoded(encodedPocId) {
  deletePocEntry(decodeFromAttr(encodedPocId));
}

function canEditDbEntry(entry) {
  if (!APP.user || !entry) return false;
  if (APP.role === 'manager') return true;
  return APP.role === 'coordinator' && entry.coordinatorId === APP.user.id;
}

function dbStatusBadgeClass(status) {
  if (status === 'Accepted') return 'badge-green';
  if (status === 'Denied') return 'badge-red';
  if (status === 'Replied') return 'badge-blue';
  if (status === 'Mail Sent') return 'badge-yellow';
  return 'badge-gray';
}

function getTrackDbFilteredEntries() {
  const base = getTrackDbEntriesForCurrentUser();
  if (APP.trackDbStatusFilter === 'all') return base;
  return base.filter(entry => entry.status === APP.trackDbStatusFilter);
}

function renderTrackDbTableRows(entries, { showCoordinator = false } = {}) {
  const isManager = APP.role === 'manager';
  const colspan = showCoordinator ? 7 : 6;
  if (!entries.length) {
    return `<tr><td colspan="${colspan}"><div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No companies found</div></div></td></tr>`;
  }
  return entries.map(entry => {
    const editable = canEditDbEntry(entry);
    const contactCount = Array.isArray(entry.contacts) ? entry.contacts.length : 0;
    const encodedEntryId = encodeForAttr(entry.id);
    return `
      <tr>
        <td class="td-main">
          ${escapeHtml(entry.companyName)}
          <div class="text-sm text-muted mt-1">${contactCount} contact${contactCount !== 1 ? 's' : ''}</div>
        </td>
        ${showCoordinator ? `<td>${escapeHtml(entry.coordinatorName || getCoordinator(entry.coordinatorId)?.name || 'Unknown')}</td>` : ''}
        <td>
          <select class="form-select" ${editable ? '' : 'disabled'} onchange="updateDbCompanyStatusByEncoded('${encodedEntryId}', this.value)">
            ${getDbStatusOptions(entry.status).map(status => `<option ${entry.status === status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
          </select>
          <div class="mt-1"><span class="badge ${dbStatusBadgeClass(entry.status)}">${escapeHtml(entry.status || '—')}</span></div>
        </td>
        <td>
          <textarea class="form-input" rows="2" ${editable ? '' : 'disabled'} onblur="updateDbCompanyCommentByEncoded('${encodedEntryId}', this.value)">${escapeHtml(entry.comment || '')}</textarea>
        </td>
        <td>${entry.sourceTaskId ? '<span class="badge badge-blue">Task</span>' : '<span class="badge badge-gray">Direct</span>'}</td>
        <td>${entry.pocId ? '<span class="badge badge-green">Linked</span>' : '<span class="badge badge-gray">—</span>'}</td>
        <td>
          ${editable ? `
            <div class="d-flex gap-2">
              <button class="btn btn-ghost btn-sm" onclick="editDbCompanyEntryByEncoded('${encodedEntryId}')">✏️ Edit</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteDbCompanyEntryByEncoded('${encodedEntryId}')">🗑️ Delete</button>
            </div>
          ` : '—'}
        </td>
      </tr>
    `;
  }).join('');
}

function renderTrackDbCompanyWise(groups) {
  const selected = APP.trackDbSelectedCompanies || {};
  const selectedCount = Object.keys(selected).length;

  const controlsHtml = `
    <div class="d-flex gap-2 mb-4" style="align-items:center;flex-wrap:wrap">
      <label style="display:flex;align-items:center;gap:var(--sp-2);cursor:pointer">
        <input type="checkbox" ${selectedCount > 0 && selectedCount === groups.length ? 'checked' : ''}
          onchange="if(this.checked){selectAllVisibleTrackDbCompanies();}else{clearTrackDbCompanySelection();}">
        Select All Visible
      </label>
      <button class="btn btn-ghost btn-sm" onclick="clearTrackDbCompanySelection()">Clear Selection</button>
      <span class="text-muted text-sm">${selectedCount} compan${selectedCount !== 1 ? 'ies' : 'y'} selected</span>
      <button class="btn btn-primary btn-sm" onclick="downloadSelectedCompanyCsvZip()">⬇️ Download Selected CSVs</button>
    </div>
  `;

  if (!groups.length) {
    return `${controlsHtml}<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No companies found</div></div>`;
  }

  const groupsHtml = groups.map(group => {
    const isSelected = !!selected[group.key];
    const isExpanded = !!(APP.trackDbExpandedCompanies || {})[group.key];
    const encodedKey = encodeForAttr(group.key);
    const statuses = [...new Set(group.entries.map(e => e.status).filter(Boolean))];
    const coordinatorNames = [...new Set(group.entries.map(e => e.coordinatorName || '').filter(Boolean))];

    const contactsHtml = isExpanded ? (
      group.contacts.length ? `
        <div class="table-wrap" style="border-top:1px solid var(--border)">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Coordinator</th>
                <th>Sub-category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${group.contacts.map(c => `
                <tr>
                  <td>${escapeHtml(c.name)}</td>
                  <td>${escapeHtml(c.email)}</td>
                  <td>${escapeHtml(c.coordinator)}</td>
                  <td>${escapeHtml(c.subCategory)}</td>
                  <td><span class="badge ${dbStatusBadgeClass(c.status)}">${escapeHtml(c.status || '—')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `<div class="text-sm text-muted" style="padding:var(--sp-4)">No contacts uploaded for this company yet.</div>`
    ) : '';

    return `
      <div class="card mb-3" style="overflow:hidden">
        <div class="d-flex gap-2" style="align-items:center;padding:var(--sp-3) var(--sp-4);cursor:pointer;user-select:none"
          onclick="toggleTrackDbCompanyExpandedByEncoded('${encodedKey}')">
          <input type="checkbox" ${isSelected ? 'checked' : ''}
            onclick="event.stopPropagation();toggleTrackDbCompanySelectedByEncoded('${encodedKey}', this.checked)"
            style="cursor:pointer;flex-shrink:0">
          <span style="flex:1;font-weight:500">${escapeHtml(group.companyName)}</span>
          <span class="text-muted text-sm">${group.contacts.length} contact${group.contacts.length !== 1 ? 's' : ''}</span>
          ${coordinatorNames.length ? `<span class="text-muted text-sm" style="margin-left:var(--sp-2)">${coordinatorNames.map(n => escapeHtml(n)).join(', ')}</span>` : ''}
          ${statuses.map(s => `<span class="badge ${dbStatusBadgeClass(s)}">${escapeHtml(s)}</span>`).join('')}
          <span style="font-size:12px;margin-left:var(--sp-2)">${isExpanded ? '▲' : '▼'}</span>
        </div>
        ${contactsHtml}
      </div>
    `;
  }).join('');

  return `${controlsHtml}<div>${groupsHtml}</div>`;
}

function renderTrackDb() {
  const el = document.getElementById('page-trackdb');
  if (!el) return;
  const isManager = APP.role === 'manager';
  if (!isManager && APP.trackDbViewMode === 'grouped') {
    APP.trackDbViewMode = 'all';
  }
  const entries = getTrackDbFilteredEntries();
  const companyGroups = getTrackDbCompanyGroups(entries);
  const coordinators = getUsersByRole('coordinator');
  const grouped = entries.reduce((acc, entry) => {
    const key = entry.coordinatorId || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});
  const groupedCoordinatorIds = Object.keys(grouped);

  el.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Track DB</div>
        <div class="section-desc">Track unique companies from uploaded CSV data</div>
      </div>
      <div class="section-actions">
        <select class="form-select" style="height:34px;width:auto" onchange="setTrackDbStatusFilter(this.value)">
          <option value="all" ${APP.trackDbStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
          ${getDbStatusOptions().map(status => `<option value="${escapeHtml(status)}" ${APP.trackDbStatusFilter === status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header"><span class="card-title">Upload CSV</span></div>
      <div class="card-body">
        <div class="text-sm text-muted mb-4">CSV format: <strong>Name, Email, Company</strong>. Duplicate companies are merged per coordinator.</div>
        <div class="form-row">
          ${isManager ? `
          <div class="form-group">
            <label class="form-label">Coordinator</label>
            <select class="form-select" id="trackdb-upload-coordinator">
              <option value="">Select coordinator</option>
              ${coordinators.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>` : ''}
          <div class="form-group">
            <label class="form-label">CSV File</label>
            <input type="file" class="form-input" id="trackdb-upload-file" accept=".csv,text/csv">
          </div>
        </div>
        <button class="btn btn-primary" onclick="uploadTrackDbCsv()">Upload CSV</button>
      </div>
    </div>

    <div class="tabs" style="margin-bottom:var(--sp-4)">
      <div class="tab ${APP.trackDbViewMode === 'all' ? 'active' : ''}" onclick="setTrackDbViewMode('all')">${isManager ? 'All Companies' : 'All'}</div>
      ${isManager ? `<div class="tab ${APP.trackDbViewMode === 'grouped' ? 'active' : ''}" onclick="setTrackDbViewMode('grouped')">By Coordinator</div>` : ''}
      <div class="tab ${APP.trackDbViewMode === 'company' ? 'active' : ''}" onclick="setTrackDbViewMode('company')">By Company</div>
    </div>

    ${isManager ? `
    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title">⚙️ Manage DB Status Options</span>
      </div>
      <div class="card-body">
        <div class="mb-3">
          ${getDbStatusOptions().map(status => {
            const isProtected = status === 'Accepted';
            const encodedStatus = encodeForAttr(status);
            return `
              <div class="d-flex gap-2 mb-2" style="align-items:center;flex-wrap:wrap">
                <span class="badge badge-gray" style="flex:1;min-width:80px">${escapeHtml(status)}${isProtected ? ' 🔒' : ''}</span>
                ${!isProtected ? `
                  <button class="btn btn-ghost btn-sm" onclick="renameDbStatusOption('${encodedStatus}')">✏️ Rename</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteDbStatusOption('${encodedStatus}')">🗑️</button>
                ` : `<span class="text-sm text-muted">Protected</span>`}
              </div>`;
          }).join('')}
        </div>
        <div class="form-row">
          <input class="form-input" id="new-db-status-input" placeholder="New status name…" style="flex:1">
          <button class="btn btn-secondary btn-sm" onclick="addDbStatusOption()">+ Add</button>
        </div>
      </div>
    </div>` : ''}

    ${APP.trackDbViewMode === 'all' ? `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${isManager ? 'All Companies' : 'My Companies'}</span>
          <span class="text-muted text-sm">${entries.length} compan${entries.length === 1 ? 'y' : 'ies'}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                ${isManager ? '<th>Coordinator</th>' : ''}
                <th>Status</th>
                <th>Comments</th>
                <th>Source</th>
                <th>POC</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${renderTrackDbTableRows(entries, { showCoordinator: isManager })}</tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${isManager && APP.trackDbViewMode === 'grouped' ? `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Coordinator Uploads</span>
          <span class="text-muted text-sm">${groupedCoordinatorIds.length} coordinator${groupedCoordinatorIds.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="card-body">
          ${groupedCoordinatorIds.length ? groupedCoordinatorIds.map(coordinatorId => {
            const rowEntries = grouped[coordinatorId] || [];
            const coordinatorName = rowEntries[0]?.coordinatorName || getCoordinator(coordinatorId)?.name || 'Unknown';
            const expanded = !!APP.trackDbExpandedCoordinators[coordinatorId];
            const encodedCoordinatorId = encodeForAttr(coordinatorId);
            return `
              <div class="card mb-4" style="overflow:hidden">
                <button class="btn btn-secondary" style="width:100%;justify-content:space-between" onclick="toggleTrackDbCoordinatorByEncoded('${encodedCoordinatorId}')">
                  <span>${escapeHtml(coordinatorName)}</span>
                  <span>${rowEntries.length} compan${rowEntries.length === 1 ? 'y' : 'ies'} ${expanded ? '▲' : '▼'}</span>
                </button>
                ${expanded ? `
                  <div class="table-wrap">
                    <table>
                      <thead><tr><th>Company</th><th>Status</th><th>Comments</th><th>Source</th><th>POC</th><th>Actions</th></tr></thead>
                      <tbody>${renderTrackDbTableRows(rowEntries, { showCoordinator: false })}</tbody>
                    </table>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') : '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No coordinator uploads yet</div></div>'}
        </div>
      </div>
    ` : ''}

    ${APP.trackDbViewMode === 'company' ? `
      <div class="card">
        <div class="card-header">
          <span class="card-title">By Company</span>
          <span class="text-muted text-sm">${companyGroups.length} compan${companyGroups.length !== 1 ? 'ies' : 'y'}</span>
        </div>
        <div class="card-body">
          ${renderTrackDbCompanyWise(companyGroups)}
        </div>
      </div>
    ` : ''}
  `;
}

function setTrackDbStatusFilter(value) {
  APP.trackDbStatusFilter = value || 'all';
  renderTrackDb();
}

// ── DB STATUS OPTION MANAGEMENT ──
function addDbStatusOption() {
  const input = document.getElementById('new-db-status-input');
  const value = (input?.value || '').trim();
  if (!value) { alert('Status name cannot be empty.'); return; }
  const opts = getDbStatusOptions();
  if (opts.some(o => o.toLowerCase() === value.toLowerCase())) {
    alert('A status with this name already exists.');
    return;
  }
  DATA.dbStatusOptions = opts;
  DATA.dbStatusOptions.push(value);
  saveDbStatusOptions();
  renderTrackDb();
}

function renameDbStatusOption(encodedOldStatus) {
  const oldStatus = decodeFromAttr(encodedOldStatus);
  if (oldStatus === 'Accepted') {
    alert('Accepted is required for confirmed lead workflow and cannot be renamed.');
    return;
  }
  const newName = prompt('Rename status:', oldStatus)?.trim();
  if (!newName || newName === oldStatus) return;
  const opts = getDbStatusOptions();
  if (opts.some(o => o.toLowerCase() === newName.toLowerCase() && o !== oldStatus)) {
    alert('A status with this name already exists.');
    return;
  }
  const idx = opts.indexOf(oldStatus);
  if (idx === -1) return;
  opts[idx] = newName;
  DATA.dbStatusOptions = opts;
  saveDbStatusOptions();
  renderTrackDb();
}

function deleteDbStatusOption(encodedStatus) {
  const status = decodeFromAttr(encodedStatus);
  if (status === 'Accepted') {
    alert('Accepted is required for confirmed lead workflow and cannot be deleted.');
    return;
  }
  const opts = getDbStatusOptions();
  if (opts.length <= 1) { alert('Cannot delete the last status option.'); return; }
  const usedByEntries = DATA.dbCompanies.some(e => e.status === status);
  if (usedByEntries) {
    if (!confirm(`This status is used by existing entries. Existing entries will keep this status, but it will be removed from future dropdowns. Continue?`)) return;
  }
  DATA.dbStatusOptions = opts.filter(o => o !== status);
  saveDbStatusOptions();
  renderTrackDb();
}

function setTrackDbViewMode(mode) {
  const validModes = APP.role === 'manager' ? ['all', 'grouped', 'company'] : ['all', 'company'];
  APP.trackDbViewMode = validModes.includes(mode) ? mode : 'all';
  renderTrackDb();
}

function toggleTrackDbCoordinator(coordinatorId) {
  APP.trackDbExpandedCoordinators[coordinatorId] = !APP.trackDbExpandedCoordinators[coordinatorId];
  renderTrackDb();
}

function toggleTrackDbCoordinatorByEncoded(encodedCoordinatorId) {
  toggleTrackDbCoordinator(decodeFromAttr(encodedCoordinatorId));
}

function toggleTrackDbCompanyExpanded(companyKey) {
  APP.trackDbExpandedCompanies = APP.trackDbExpandedCompanies || {};
  APP.trackDbExpandedCompanies[companyKey] = !APP.trackDbExpandedCompanies[companyKey];
  renderTrackDb();
}

function toggleTrackDbCompanyExpandedByEncoded(encodedKey) {
  toggleTrackDbCompanyExpanded(decodeFromAttr(encodedKey));
}

function toggleTrackDbCompanySelected(companyKey, checked) {
  APP.trackDbSelectedCompanies = APP.trackDbSelectedCompanies || {};
  if (checked) {
    APP.trackDbSelectedCompanies[companyKey] = true;
  } else {
    delete APP.trackDbSelectedCompanies[companyKey];
  }
  renderTrackDb();
}

function toggleTrackDbCompanySelectedByEncoded(encodedKey, checked) {
  toggleTrackDbCompanySelected(decodeFromAttr(encodedKey), checked);
}

function clearTrackDbCompanySelection() {
  APP.trackDbSelectedCompanies = {};
  renderTrackDb();
}

function selectAllVisibleTrackDbCompanies() {
  APP.trackDbSelectedCompanies = APP.trackDbSelectedCompanies || {};
  const groups = getTrackDbCompanyGroups(getTrackDbFilteredEntries());
  groups.forEach(group => { APP.trackDbSelectedCompanies[group.key] = true; });
  renderTrackDb();
}

async function downloadSelectedCompanyCsvZip() {
  const selected = APP.trackDbSelectedCompanies || {};
  const selectedKeys = Object.keys(selected);
  if (!selectedKeys.length) {
    alert('Please select at least one company to download.');
    return;
  }
  const hasJsZip = await ensureJsZipLoaded();
  if (!hasJsZip) {
    alert('CSV ZIP export library could not be loaded. Please check your internet connection, disable blockers for this site, refresh, and try again.');
    return;
  }
  const entries = getTrackDbFilteredEntries();
  const groups = getTrackDbCompanyGroups(entries).filter(group => selected[group.key]);
  if (!groups.length) {
    alert('No selected company data found.');
    return;
  }
  const zip = new JSZip();
  groups.forEach(group => {
    const rows = getCsvRowsForCompanyGroup(group);
    const csv = rowsToCsv(rows);
    const filename = `${sanitizeFilename(group.companyName)}.csv`;
    zip.file(filename, csv);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const date = new Date().toISOString().slice(0, 10);
  const zipFilename = `track-db-selected-companies-${date}.zip`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function uploadTrackDbCsv() {
  if (!APP.user) return;
  const fileInput = document.getElementById('trackdb-upload-file');
  const file = fileInput?.files?.[0];
  let coordinatorId = APP.user.id;
  let coordinatorName = APP.user.name;
  if (APP.role === 'manager') {
    coordinatorId = document.getElementById('trackdb-upload-coordinator')?.value || '';
    if (!coordinatorId) {
      alert('Please select a coordinator to associate with this CSV upload.');
      return;
    }
    coordinatorName = getCoordinator(coordinatorId)?.name || '';
  }
  const ok = await importDbCsvFile(file, { coordinatorId, coordinatorName, sourceTaskId: '' });
  if (!ok) return;
  saveDbCompanies();
  if (fileInput) fileInput.value = '';
  addNotification('Track DB CSV uploaded successfully.', { browser: true });
  alert('CSV uploaded successfully.');
  renderTrackDb();
}

function updateDbCompanyComment(companyId, value) {
  const entry = DATA.dbCompanies.find(item => item.id === companyId);
  if (!entry || !canEditDbEntry(entry)) return;
  entry.comment = String(value || '').trim();
  entry.updatedAt = new Date().toISOString();
  saveDbCompanies();
}

function updateDbCompanyCommentByEncoded(encodedCompanyId, value) {
  updateDbCompanyComment(decodeFromAttr(encodedCompanyId), value);
}

async function promptAndCreatePocForDbCompany(entry) {
  const defaultContact = Array.isArray(entry.contacts) && entry.contacts.length ? entry.contacts[0] : null;
  const name = prompt('Enter POC name for this accepted company:', defaultContact?.name || '')?.trim();
  if (!name) return '';
  const email = prompt('Enter POC email (optional):', defaultContact?.email || '')?.trim() || '';
  const contact = prompt('Enter POC contact number (optional):', '')?.trim() || '';
  const categoryInput = prompt('Enter POC category (optional, default: Corporate):', 'Corporate')?.trim();
  const category = categoryInput || 'Corporate';
  const pocId = createId('poc');
  DATA.pocs.unshift({
    id: pocId,
    name,
    organization: entry.companyName,
    category,
    email,
    contact,
    createdBy: APP.user?.id || '',
    createdByName: APP.user?.name || '',
    createdByRole: APP.role || '',
    sharedManagerIds: [],
    createdAt: new Date().toISOString()
  });
  savePocs();
  return pocId;
}

async function updateDbCompanyStatus(companyId, status) {
  const entry = DATA.dbCompanies.find(item => item.id === companyId);
  if (!entry || !canEditDbEntry(entry)) return;
  if (!getDbStatusOptions(entry.status).includes(status)) return;
  const prevStatus = entry.status;
  if (status === 'Accepted' && !entry.pocId) {
    const pocId = await promptAndCreatePocForDbCompany(entry);
    if (!pocId) {
      alert('Cannot mark company as Accepted without creating a POC. Status change has been reverted.');
      renderTrackDb();
      return;
    }
    entry.pocId = pocId;
  }
  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  saveDbCompanies();
  if (prevStatus !== status) renderTrackDb();

  // Manager-only: when status becomes Accepted, offer to create Confirmed Lead
  if (status === 'Accepted' && APP.role === 'manager') {
    if (entry.confirmedLeadId) {
      const existingLead = DATA.confirmedLeads.find(l => l.id === entry.confirmedLeadId);
      if (existingLead) {
        if (confirm('This entry already has a confirmed lead. Open/edit it?')) {
          openConfirmedLeadModal(entry.confirmedLeadId);
        }
        return;
      }
    }
    // Pre-fill and open confirmed lead modal
    const matchCategory = getConfirmedLeadCategoryOptions().find(c =>
      entry.subCategory && c.toLowerCase() === entry.subCategory.toLowerCase()
    ) || '';
    APP._pendingConfirmedLeadFromDbEntryId = entry.id;
    openConfirmedLeadModal('', {
      organizationName: entry.companyName || '',
      category: matchCategory,
      pocId: entry.pocId || '',
      sourceDbEntryId: entry.id
    });
  }
}

async function updateDbCompanyStatusByEncoded(encodedCompanyId, status) {
  await updateDbCompanyStatus(decodeFromAttr(encodedCompanyId), status);
}

async function editDbCompanyEntry(companyId) {
  const entry = DATA.dbCompanies.find(item => item.id === companyId);
  if (!entry || !canEditDbEntry(entry)) return;
  const companyName = prompt('Edit company name:', entry.companyName || '')?.trim();
  if (!companyName) return;
  const existing = findDbCompanyEntry(companyName, entry.coordinatorId);
  if (existing && existing.id !== entry.id) {
    alert('A company with this name already exists for this coordinator.');
    return;
  }
  const currentOptions = getDbStatusOptions(entry.status);
  const statusInput = prompt(`Edit status (${currentOptions.join(', ')}):`, entry.status || 'Mail Sent');
  if (statusInput === null) return;
  const status = String(statusInput || '').trim();
  if (!currentOptions.includes(status)) {
    alert(`Status must be one of: ${currentOptions.join(', ')}.`);
    return;
  }
  const commentInput = prompt('Edit comment (optional):', entry.comment || '');
  if (commentInput === null) return;
  entry.companyName = companyName;
  entry.comment = String(commentInput || '').trim();
  entry.updatedAt = new Date().toISOString();
  await updateDbCompanyStatus(companyId, status);
  saveDbCompanies();
  renderTrackDb();
}

async function editDbCompanyEntryByEncoded(encodedCompanyId) {
  await editDbCompanyEntry(decodeFromAttr(encodedCompanyId));
}

function deleteDbCompanyEntry(companyId) {
  const idx = DATA.dbCompanies.findIndex(item => item.id === companyId);
  if (idx === -1) return;
  const entry = DATA.dbCompanies[idx];
  if (!canEditDbEntry(entry)) return;
  if (!confirm('Delete this Track DB entry?')) return;
  DATA.dbCompanies.splice(idx, 1);
  saveDbCompanies();
  renderTrackDb();
}

function deleteDbCompanyEntryByEncoded(encodedCompanyId) {
  deleteDbCompanyEntry(decodeFromAttr(encodedCompanyId));
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
        <div class="d-flex items-center mt-4" style="justify-content:space-between;padding-top:var(--sp-3);border-top:1px solid var(--border)">
          <div>
            <div class="fw-500">Browser Notifications</div>
            <div class="text-muted text-sm">Receive native browser/device notifications</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="requestNotificationPermission()">Enable Notifications</button>
        </div>
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
            <label class="form-label" for="tm-password">Temporary Password</label>
            <input class="form-input" id="tm-password" type="password" placeholder="Set temporary password for coordinator">
            <div class="text-muted text-sm mt-2">Used for adding or resetting a coordinator password. Coordinator must change it on first login.</div>
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
                      <td>
                        <div class="d-flex items-center" style="gap:var(--sp-2);flex-wrap:wrap">
                          <button class="btn btn-ghost btn-sm" onclick="resetCoordinatorPassword('${c.id}')">Reset Password</button>
                          <button class="btn btn-ghost btn-sm" onclick="removeCoordinator('${c.id}')">Remove</button>
                        </div>
                      </td>
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
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      userId: APP.user.id,
      role: APP.role,
      name: APP.user.name,
      initials: APP.user.initials,
      expiresAt: getSessionExpiry()
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
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
    alert('Coordinator created with temporary password. They must change it on first login.');
    renderSettings();
  };
  window.removeCoordinator = (id) => {
    if (!confirm('Remove this coordinator?')) return;
    const users = loadUsers();
    const next = users.filter(u => u.id !== id);
    saveUsers(next);
    renderSettings();
  };
  window.resetCoordinatorPassword = async (id) => {
    const trimmedPassword = document.getElementById('tm-password')?.value?.trim() || '';
    if (trimmedPassword.length < 8) {
      alert('Please enter a temporary password in the field above (minimum 8 characters).');
      return;
    }
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === id && u.role === 'coordinator');
    if (idx === -1) {
      alert('Coordinator not found.');
      return;
    }
    users[idx].passwordHash = await hashPassword(trimmedPassword);
    users[idx].mustChangePassword = true;
    users[idx].updatedAt = new Date().toISOString();
    saveUsers(users);
    const tempPasswordInput = document.getElementById('tm-password');
    if (tempPasswordInput) tempPasswordInput.value = '';
    alert('Success: Coordinator password reset. They must set a new password at next login.');
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
  if (id === 'resource-modal') APP.editingResourceId = null;
  document.getElementById('new-task-modal-title').textContent = 'New Task';
  document.getElementById('save-new-task-btn').onclick = saveNewTask;
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    if (e.target.id === 'confirmed-lead-modal') {
      closeConfirmedLeadModal();
      return;
    }
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── LOGIN ──
async function handleLogin() {
  if (APP.passwordChangeUserId) {
    await handlePasswordChange();
    return;
  }
  await handleSignIn();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY); // cleanup for old sessions
  APP.role = null; APP.user = null; APP.passwordChangeUserId = null;
  showLoginScreen();
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
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch (error) {
    console.warn('Invalid session data detected. Clearing stored session.', error);
    localStorage.removeItem(SESSION_KEY);
  }

  // Backward compatibility: migrate old sessionStorage session to localStorage
  if (!session) {
    try {
      const legacy = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (legacy) {
        legacy.expiresAt = getSessionExpiry();
        localStorage.setItem(SESSION_KEY, JSON.stringify(legacy));
        sessionStorage.removeItem(SESSION_KEY);
        session = legacy;
      }
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  if (!session) {
    APP.role = null;
    APP.user = null;
    return;
  }

  if (!session.expiresAt || Date.now() > session.expiresAt) {
    console.warn('Session expired. Logging out.');
    localStorage.removeItem(SESSION_KEY);
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
  console.log('LOGIN ATTEMPT: username =', username);
  if (!username || !password) {
    setLoginError('Enter both username and password.');
    return;
  }
  let hash;
  try {
    hash = await hashPassword(password);
  } catch (err) {
    setLoginError(err.message || 'Password hashing failed. Please use HTTPS or localhost.');
    return;
  }
  const users = loadUsers();
  console.log('LOGIN: available usernames =', users.map(u => u.username));
  const user = users.find(u => u.username === username && u.passwordHash === hash);
  console.log('LOGIN RESULT: user found =', user ? user.name : 'NOT FOUND');
  if (!user) {
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
    initials: getInitials(user.name),
    expiresAt: getSessionExpiry()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  APP.role = user.role;
  APP.user = {
    id: user.id,
    name: user.name,
    initials: session.initials,
    role: user.role
  };
  showAppScreen();
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

// ── BROWSER NOTIFICATIONS ──
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Browser notifications are not supported in this browser.');
    return;
  }
  if (Notification.permission === 'granted') {
    showBrowserNotification('Eureka! Workplace notifications enabled', {
      body: "You'll receive important portal updates here."
    });
    return;
  }
  if (Notification.permission === 'denied') {
    alert('Notifications are blocked. Please enable them in your browser settings.');
    return;
  }
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      showBrowserNotification('Eureka! Workplace notifications enabled', {
        body: "You'll receive important portal updates here."
      });
    }
  });
}

function showBrowserNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = {
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    ...options
  };
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, opts);
    }).catch(() => {
      new Notification(title, opts);
    });
  } else {
    try { new Notification(title, opts); } catch (err) { console.warn('Browser notification failed:', err); }
  }
}

function addNotification(text, options = {}) {
  DATA.notifications.unshift({
    id: createId('notif'),
    text,
    time: options.time || 'Just now',
    read: false,
    type: options.type || 'info'
  });
  DATA.notifications = DATA.notifications.slice(0, MAX_NOTIFICATIONS);
  saveNotifications();

  renderNotifPanel();

  if (APP.currentPage === 'notifications') {
    renderNotifications();
  }

  if (options.browser === true) {
    showBrowserNotification('Eureka! Workplace', { body: text });
  }
}

// ── CONFIRMED LEADS ──

function renderConfirmedLeads() {
  if (APP.role !== 'manager') return;
  const el = document.getElementById('page-confirmedleads');
  if (!el) return;
  const leads = Array.isArray(DATA.confirmedLeads) ? DATA.confirmedLeads : [];

  el.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Confirmed Leads</div>
        <div class="section-desc">${leads.length} confirmed lead${leads.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="section-actions">
        <button class="btn btn-primary" onclick="openConfirmedLeadModal()">＋ Add Confirmed Lead</button>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header"><span class="card-title">⚙️ Manage Categories</span></div>
      <div class="card-body">
        <div class="d-flex gap-2 mb-3" style="flex-wrap:wrap">
          ${getConfirmedLeadCategoryOptions().map(cat => {
            const encoded = encodeForAttr(cat);
            return `<span class="badge badge-purple" style="display:inline-flex;align-items:center;gap:4px">
              ${escapeHtml(cat)}
              <button class="btn-icon" style="font-size:10px;padding:0 2px" onclick="renameConfirmedLeadCategory('${encoded}')">✏️</button>
              <button class="btn-icon" style="font-size:10px;padding:0 2px;color:var(--danger)" onclick="deleteConfirmedLeadCategory('${encoded}')">✕</button>
            </span>`;
          }).join('')}
        </div>
        <div class="form-row">
          <input class="form-input" id="new-lead-category-input" placeholder="New category…" style="flex:1">
          <button class="btn btn-secondary btn-sm" onclick="addConfirmedLeadCategory()">+ Add</button>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header"><span class="card-title">⚙️ Manage Stages</span></div>
      <div class="card-body">
        <div class="d-flex gap-2 mb-3" style="flex-wrap:wrap">
          ${getConfirmedLeadStageOptions().map(stage => {
            const encoded = encodeForAttr(stage);
            return `<span class="badge badge-blue" style="display:inline-flex;align-items:center;gap:4px">
              ${escapeHtml(stage)}
              <button class="btn-icon" style="font-size:10px;padding:0 2px" onclick="renameConfirmedLeadStage('${encoded}')">✏️</button>
              <button class="btn-icon" style="font-size:10px;padding:0 2px;color:var(--danger)" onclick="deleteConfirmedLeadStage('${encoded}')">✕</button>
            </span>`;
          }).join('')}
        </div>
        <div class="form-row">
          <input class="form-input" id="new-lead-stage-input" placeholder="New stage…" style="flex:1">
          <button class="btn btn-secondary btn-sm" onclick="addConfirmedLeadStage()">+ Add</button>
        </div>
      </div>
    </div>

    ${leads.length ? `
    <div class="card">
      <div class="card-header"><span class="card-title">All Confirmed Leads</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Organization</th><th>POC</th><th>Category</th><th>Stage</th>
            <th>MoU</th><th>Logo</th><th>Deliverables</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${leads.map(lead => {
              const poc = DATA.pocs.find(p => p.id === lead.pocId);
              const delivs = Array.isArray(lead.deliverables) ? lead.deliverables : [];
              const done = delivs.filter(d => d.completed).length;
              const mouLink = sanitizeUrl(lead.mouLink || '');
              const logoLink = sanitizeUrl(lead.logoLink || '');
              const encodedId = encodeForAttr(lead.id);
              return `<tr>
                <td class="td-main">${escapeHtml(lead.organizationName || '—')}</td>
                <td>${poc ? escapeHtml(getPocDisplayName(poc)) : '<span class="text-muted">—</span>'}</td>
                <td>${lead.category ? `<span class="badge badge-purple">${escapeHtml(lead.category)}</span>` : '—'}</td>
                <td>${lead.stage ? `<span class="badge badge-blue">${escapeHtml(lead.stage)}</span>` : '—'}</td>
                <td>${mouLink !== '#' ? `<a href="${mouLink}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Open MoU</a>` : '—'}</td>
                <td>${logoLink !== '#' ? `<a href="${logoLink}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Open Logo</a>` : '—'}</td>
                <td>
                  <span class="badge badge-gray">${done}/${delivs.length} done</span>
                  ${delivs.map(d => `
                    <div class="d-flex gap-1 mt-1" style="align-items:center;font-size:12px">
                      <input type="checkbox" ${d.completed ? 'checked' : ''} onchange="toggleConfirmedLeadDeliverable('${encodedId}','${encodeForAttr(d.id)}',this.checked)">
                      <span style="${d.completed ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${escapeHtml(d.text)}</span>
                    </div>`).join('')}
                </td>
                <td>
                  <div class="d-flex gap-2">
                    <button class="btn btn-ghost btn-sm" onclick="openConfirmedLeadModal('${encodedId}')">✏️ Edit</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteConfirmedLead('${encodedId}')">🗑️</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : `
    <div class="card">
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <div class="empty-title">No confirmed leads yet</div>
        <div class="empty-desc">Add a confirmed lead manually or mark a Track DB company as Accepted.</div>
      </div>
    </div>`}
  `;
}

function openConfirmedLeadModal(encodedLeadId = '', prefill = {}) {
  if (APP.role !== 'manager') return;
  const leadId = encodedLeadId ? decodeFromAttr(encodedLeadId) : '';
  const existingLead = leadId ? DATA.confirmedLeads.find(l => l.id === leadId) : null;
  const lead = existingLead || {
    organizationName: prefill.organizationName || '',
    pocId: prefill.pocId || '',
    category: prefill.category || '',
    stage: '',
    mouLink: '',
    logoLink: '',
    deliverables: [],
    sourceDbEntryId: prefill.sourceDbEntryId || ''
  };

  document.getElementById('confirmed-lead-modal-title').textContent = existingLead ? 'Edit Confirmed Lead' : 'New Confirmed Lead';
  const encodedLead = leadId ? encodeForAttr(leadId) : '';
  document.getElementById('save-confirmed-lead-btn').onclick = () => saveConfirmedLeadFromModal(encodedLead, prefill.sourceDbEntryId);

  const pocs = Array.isArray(DATA.pocs) ? DATA.pocs : [];
  const categories = getConfirmedLeadCategoryOptions(lead.category);
  const stages = getConfirmedLeadStageOptions(lead.stage);
  const delivs = Array.isArray(lead.deliverables) ? lead.deliverables : [];

  document.getElementById('confirmed-lead-modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Company / Organization Name *</label>
      <input class="form-input" id="cl-org-name" value="${escapeHtml(lead.organizationName)}" placeholder="Organization name">
    </div>

    <div class="form-group">
      <label class="form-label">POC</label>
      <select class="form-select" id="cl-poc-select">
        <option value="">— Select POC —</option>
        ${pocs.map(p => `<option value="${p.id}" ${lead.pocId === p.id ? 'selected' : ''}>${escapeHtml(getPocDisplayName(p))}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Category</label>
      <select class="form-select" id="cl-category-select">
        <option value="">— Select Category —</option>
        ${categories.map(c => `<option value="${escapeHtml(c)}" ${lead.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Stage</label>
      <select class="form-select" id="cl-stage-select">
        <option value="">— Select Stage —</option>
        ${stages.map(s => `<option value="${escapeHtml(s)}" ${lead.stage === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">MoU</label>
      <div class="d-flex gap-2 mb-2">
        <a href="https://drive.google.com/drive/folders/1KFP0EkWOG0XQ59NoFCDhpKlxUElRmP-p?usp=sharing" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">📂 Open MoU Drive Folder</a>
        ${sanitizeUrl(lead.mouLink || '') !== '#' ? `<a href="${sanitizeUrl(lead.mouLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Open MoU</a>` : ''}
      </div>
      <input class="form-input" id="cl-mou-link" placeholder="Paste MoU file link after uploading to Drive…" value="${escapeHtml(lead.mouLink || '')}">
    </div>

    <div class="form-group">
      <label class="form-label">Logo</label>
      <div class="d-flex gap-2 mb-2">
        <a href="https://drive.google.com/drive/folders/1y3D9kqaaU1LiJWT6ra_9LDnI7NrfDXgl?usp=sharing" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">📂 Open Logo Drive Folder</a>
        ${sanitizeUrl(lead.logoLink || '') !== '#' ? `<a href="${sanitizeUrl(lead.logoLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Open Logo</a>` : ''}
      </div>
      <input class="form-input" id="cl-logo-link" placeholder="Paste Logo file link after uploading to Drive…" value="${escapeHtml(lead.logoLink || '')}">
    </div>

    <div class="form-group">
      <label class="form-label">Deliverables</label>
      <div id="cl-deliverables-list">
        ${delivs.map((d, idx) => renderDeliverableRow(d, idx)).join('')}
      </div>
      <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="addConfirmedLeadDeliverableRow()">+ Add Deliverable</button>
    </div>
  `;

  openModal('confirmed-lead-modal');
}

function renderDeliverableRow(d, idx) {
  return `
    <div class="form-row cl-deliverable-row" data-cl-deliv-idx="${idx}" style="align-items:center;margin-bottom:6px">
      <input type="checkbox" ${d.completed ? 'checked' : ''} id="cl-deliv-done-${idx}" style="flex-shrink:0;cursor:pointer">
      <input class="form-input" id="cl-deliv-text-${idx}" value="${escapeHtml(d.text || '')}" placeholder="Deliverable…" style="flex:1">
      <button type="button" class="btn btn-ghost btn-sm" onclick="removeConfirmedLeadDeliverableRow(${idx})" style="flex-shrink:0">🗑️</button>
    </div>`;
}

function addConfirmedLeadDeliverableRow() {
  const list = document.getElementById('cl-deliverables-list');
  if (!list) return;
  const rows = list.querySelectorAll('.cl-deliverable-row');
  const idx = rows.length;
  const div = document.createElement('div');
  div.innerHTML = renderDeliverableRow({ text: '', completed: false }, idx);
  list.appendChild(div.firstElementChild);
}

function removeConfirmedLeadDeliverableRow(idx) {
  const row = document.querySelector(`.cl-deliverable-row[data-cl-deliv-idx="${idx}"]`);
  if (row) row.remove();
}

function collectConfirmedLeadDeliverablesFromForm() {
  const rows = document.querySelectorAll('.cl-deliverable-row');
  const delivs = [];
  rows.forEach(row => {
    const idx = row.dataset.clDelivIdx;
    const textEl = document.getElementById('cl-deliv-text-' + idx);
    const doneEl = document.getElementById('cl-deliv-done-' + idx);
    const text = textEl?.value?.trim() || '';
    if (!text) return;
    delivs.push({ id: createId('deliverable'), text, completed: !!(doneEl?.checked) });
  });
  return delivs;
}

function saveConfirmedLeadFromModal(encodedLeadId = '', sourceDbEntryId = '') {
  const leadId = encodedLeadId ? decodeFromAttr(encodedLeadId) : '';
  const orgName = (document.getElementById('cl-org-name')?.value || '').trim();
  if (!orgName) { alert('Organization name is required.'); return; }

  const pocId = document.getElementById('cl-poc-select')?.value || '';
  const pocEntry = DATA.pocs.find(p => p.id === pocId);
  const category = document.getElementById('cl-category-select')?.value || '';
  const stage = document.getElementById('cl-stage-select')?.value || '';
  const mouLink = (document.getElementById('cl-mou-link')?.value || '').trim();
  const logoLink = (document.getElementById('cl-logo-link')?.value || '').trim();
  const deliverables = collectConfirmedLeadDeliverablesFromForm();

  const now = new Date().toISOString();

  if (leadId) {
    const lead = DATA.confirmedLeads.find(l => l.id === leadId);
    if (!lead) { alert('Lead not found.'); return; }
    lead.organizationName = orgName;
    lead.pocId = pocId;
    lead.pocName = pocEntry ? pocEntry.name : '';
    lead.category = category;
    lead.stage = stage;
    lead.mouLink = mouLink;
    lead.logoLink = logoLink;
    lead.deliverables = deliverables;
    lead.updatedAt = now;
    saveConfirmedLeads();
    closeConfirmedLeadModal();
    renderConfirmedLeads();
    return;
  }

  const dbEntryId = sourceDbEntryId || (APP._pendingConfirmedLeadFromDbEntryId || '');
  const lead = {
    id: createId('confirmed-lead'),
    organizationName: orgName,
    pocId,
    pocName: pocEntry ? pocEntry.name : '',
    category,
    stage,
    mouLink,
    logoLink,
    deliverables,
    sourceDbEntryId: dbEntryId,
    createdAt: now,
    updatedAt: now,
    createdBy: APP.user?.id || '',
    createdByName: APP.user?.name || ''
  };
  DATA.confirmedLeads.unshift(lead);
  saveConfirmedLeads();

  // Link to DB entry if applicable
  if (dbEntryId) {
    const dbEntry = DATA.dbCompanies.find(e => e.id === dbEntryId);
    if (dbEntry) {
      dbEntry.confirmedLeadId = lead.id;
      saveDbCompanies();
    }
    APP._pendingConfirmedLeadFromDbEntryId = '';
  }

  closeConfirmedLeadModal();
  addNotification(`Confirmed Lead added: ${escapeHtml(orgName)}.`);
  navigate('confirmedleads');
}

function closeConfirmedLeadModal() {
  const pendingDbEntryId = APP._pendingConfirmedLeadFromDbEntryId || '';
  if (pendingDbEntryId) {
    // Came from Accepted DB entry flow - ask whether to keep Accepted status
    const keepAccepted = confirm('Confirmed lead details were not saved. Keep the entry status as Accepted?');
    if (!keepAccepted) {
      const dbEntry = DATA.dbCompanies.find(e => e.id === pendingDbEntryId);
      if (dbEntry) {
        dbEntry.status = 'Mail Sent';
        dbEntry.updatedAt = new Date().toISOString();
        saveDbCompanies();
        if (APP.currentPage === 'trackdb') renderTrackDb();
      }
    }
    APP._pendingConfirmedLeadFromDbEntryId = '';
  }
  closeModal('confirmed-lead-modal');
}

function deleteConfirmedLead(encodedLeadId) {
  const leadId = decodeFromAttr(encodedLeadId);
  const idx = DATA.confirmedLeads.findIndex(l => l.id === leadId);
  if (idx === -1) return;
  if (!confirm('Delete this confirmed lead?')) return;
  const lead = DATA.confirmedLeads[idx];
  // Unlink from DB entry
  if (lead.sourceDbEntryId) {
    const dbEntry = DATA.dbCompanies.find(e => e.id === lead.sourceDbEntryId);
    if (dbEntry && dbEntry.confirmedLeadId === lead.id) {
      delete dbEntry.confirmedLeadId;
      saveDbCompanies();
    }
  }
  DATA.confirmedLeads.splice(idx, 1);
  saveConfirmedLeads();
  renderConfirmedLeads();
}

function toggleConfirmedLeadDeliverable(encodedLeadId, encodedDeliverableId, completed) {
  const leadId = decodeFromAttr(encodedLeadId);
  const deliverableId = decodeFromAttr(encodedDeliverableId);
  const lead = DATA.confirmedLeads.find(l => l.id === leadId);
  if (!lead) return;
  const deliv = Array.isArray(lead.deliverables) && lead.deliverables.find(d => d.id === deliverableId);
  if (!deliv) return;
  deliv.completed = !!completed;
  lead.updatedAt = new Date().toISOString();
  saveConfirmedLeads();
  renderConfirmedLeads();
}

// ── CONFIRMED LEAD CATEGORY MANAGEMENT ──
function addConfirmedLeadCategory() {
  const input = document.getElementById('new-lead-category-input');
  const value = (input?.value || '').trim();
  if (!value) { alert('Category name cannot be empty.'); return; }
  const opts = getConfirmedLeadCategoryOptions();
  if (opts.some(o => o.toLowerCase() === value.toLowerCase())) {
    alert('A category with this name already exists.');
    return;
  }
  DATA.confirmedLeadCategories = opts;
  DATA.confirmedLeadCategories.push(value);
  saveConfirmedLeadCategories();
  renderConfirmedLeads();
}

function renameConfirmedLeadCategory(encodedCategory) {
  const oldCat = decodeFromAttr(encodedCategory);
  const newName = prompt('Rename category:', oldCat)?.trim();
  if (!newName || newName === oldCat) return;
  const opts = getConfirmedLeadCategoryOptions();
  if (opts.some(o => o.toLowerCase() === newName.toLowerCase() && o !== oldCat)) {
    alert('A category with this name already exists.');
    return;
  }
  const idx = opts.indexOf(oldCat);
  if (idx === -1) return;
  opts[idx] = newName;
  DATA.confirmedLeadCategories = opts;
  saveConfirmedLeadCategories();
  renderConfirmedLeads();
}

function deleteConfirmedLeadCategory(encodedCategory) {
  const cat = decodeFromAttr(encodedCategory);
  const opts = getConfirmedLeadCategoryOptions();
  if (opts.length <= 1) { alert('Cannot delete the last category.'); return; }
  const usedByLeads = DATA.confirmedLeads.some(l => l.category === cat);
  if (usedByLeads) {
    if (!confirm(`This category is used by existing leads. Existing leads keep it, but it will be removed from future dropdowns. Continue?`)) return;
  }
  DATA.confirmedLeadCategories = opts.filter(o => o !== cat);
  saveConfirmedLeadCategories();
  renderConfirmedLeads();
}

// ── CONFIRMED LEAD STAGE MANAGEMENT ──
function addConfirmedLeadStage() {
  const input = document.getElementById('new-lead-stage-input');
  const value = (input?.value || '').trim();
  if (!value) { alert('Stage name cannot be empty.'); return; }
  const opts = getConfirmedLeadStageOptions();
  if (opts.some(o => o.toLowerCase() === value.toLowerCase())) {
    alert('A stage with this name already exists.');
    return;
  }
  DATA.confirmedLeadStages = opts;
  DATA.confirmedLeadStages.push(value);
  saveConfirmedLeadStages();
  renderConfirmedLeads();
}

function renameConfirmedLeadStage(encodedStage) {
  const oldStage = decodeFromAttr(encodedStage);
  const newName = prompt('Rename stage:', oldStage)?.trim();
  if (!newName || newName === oldStage) return;
  const opts = getConfirmedLeadStageOptions();
  if (opts.some(o => o.toLowerCase() === newName.toLowerCase() && o !== oldStage)) {
    alert('A stage with this name already exists.');
    return;
  }
  const idx = opts.indexOf(oldStage);
  if (idx === -1) return;
  opts[idx] = newName;
  DATA.confirmedLeadStages = opts;
  saveConfirmedLeadStages();
  renderConfirmedLeads();
}

function deleteConfirmedLeadStage(encodedStage) {
  const stage = decodeFromAttr(encodedStage);
  const opts = getConfirmedLeadStageOptions();
  if (opts.length <= 1) { alert('Cannot delete the last stage.'); return; }
  const usedByLeads = DATA.confirmedLeads.some(l => l.stage === stage);
  if (usedByLeads) {
    if (!confirm(`This stage is used by existing leads. Existing leads keep it, but it will be removed from future dropdowns. Continue?`)) return;
  }
  DATA.confirmedLeadStages = opts.filter(o => o !== stage);
  saveConfirmedLeadStages();
  renderConfirmedLeads();
}

// ── STARTUP ──
document.addEventListener('DOMContentLoaded', async () => {
  console.log('APP INIT START');
  showBootScreen();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleLogin();
    });
  }

  resetPersistedDataIfNeeded();
  setTheme(APP.theme);
  try {
    initFirebase();
    await syncUsersFromFirebase();
  } catch (err) {
    console.warn('Firebase init/sync failed. Continuing with local users.', err);
  }
  await ensureSeedManagers();
  APP.users = loadUsers();
  console.log('APP INIT: users loaded =', APP.users.length);
  await syncAllAppData();
  normalizeAllTasks();
  console.log('Tasks available:', DATA.tasks.length);
  hydrateSession();

  if (APP.role && APP.user) {
    showAppScreen();
    initApp();
  } else {
    showLoginScreen();
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

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
});
