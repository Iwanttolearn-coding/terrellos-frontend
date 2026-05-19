/**
 * TerrellOS Persistence Layer
 * Real database operations via Base44 entities.
 * Never use localStorage for critical data — use these helpers.
 */

import { base44 } from '@/api/base44Client';

// ── Conversations ────────────────────────────────────────────────────────────
export async function saveConversationMessage(sessionId, role, content, metadata = {}) {
  return base44.entities.BuildLog.create({
    command_type: 'custom',
    status: 'success',
    project_id: sessionId,
    project_name: `chat:${sessionId}`,
    prompt: role === 'user' ? content : '',
    backend_response: role === 'assistant' ? content : '',
    metadata: { role, ...metadata },
  });
}

export async function loadConversationHistory(sessionId, limit = 50) {
  const logs = await base44.entities.BuildLog.filter(
    { project_name: `chat:${sessionId}` },
    'created_date',
    limit
  );
  return logs.map(l => ({
    id: l.id,
    role: l.metadata?.role || (l.prompt ? 'user' : 'assistant'),
    content: l.prompt || l.backend_response || '',
    created_date: l.created_date,
  }));
}

// ── Activity Logging ─────────────────────────────────────────────────────────
export async function logActivity(eventType, data = {}) {
  return base44.entities.BuildLog.create({
    command_type: 'custom',
    status: 'success',
    project_name: `activity:${eventType}`,
    prompt: eventType,
    metadata: { event: eventType, ...data, logged_at: new Date().toISOString() },
  }).catch(() => null); // never throw on log failures
}

// ── Analytics ────────────────────────────────────────────────────────────────
export async function getRealAnalytics() {
  const [projects, uploads, logs, convoLogs] = await Promise.all([
    base44.entities.Project.list(),
    base44.entities.Upload.list(),
    base44.entities.BuildLog.list('-created_date', 200),
    base44.entities.BuildLog.filter({ project_name: { $regex: '^chat:' } }, '-created_date', 500).catch(() => []),
  ]);

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const last7Days = new Date(now - 7 * day);
  const last30Days = new Date(now - 30 * day);

  const recentLogs = logs.filter(l => new Date(l.created_date) > last7Days);
  const aiCalls = logs.filter(l => ['custom', 'create_app', 'fix_app'].includes(l.command_type));
  const conversations = convoLogs.length;
  const storage_kb = uploads.reduce((acc, u) => acc + (u.file_size_kb || 0), 0);

  // Build daily activity chart (last 7 days)
  const dailyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * day);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = logs.filter(l => {
      const ld = new Date(l.created_date);
      return ld.toDateString() === d.toDateString();
    }).length;
    dailyActivity.push({ label, count });
  }

  return {
    projects: projects.length,
    uploads: uploads.length,
    logs: logs.length,
    conversations,
    ai_calls: aiCalls.length,
    storage_kb,
    storage_mb: (storage_kb / 1024).toFixed(2),
    recent_activity: recentLogs.length,
    active_this_month: logs.filter(l => new Date(l.created_date) > last30Days).length,
    daily_activity: dailyActivity,
    success_rate: logs.length
      ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)
      : null,
  };
}

// ── Memory ───────────────────────────────────────────────────────────────────
export async function saveMemory(title, story, emotion, tags) {
  return base44.entities.Upload.create({
    file_name: title,
    file_url: '',
    file_type: 'other',
    description: JSON.stringify({ story, emotion, tags: tags || '', type: 'memory', saved_at: new Date().toISOString() }),
  });
}

export async function loadMemories(limit = 50) {
  const records = await base44.entities.Upload.filter({ file_type: 'other' }, '-created_date', limit);
  return records.map(r => {
    let meta = {};
    try { meta = JSON.parse(r.description || '{}'); } catch {}
    return { ...r, meta };
  }).filter(r => r.meta.type === 'memory');
}

// ── Projects ─────────────────────────────────────────────────────────────────
export async function createProject(name, description = '', stack = '') {
  return base44.entities.Project.create({ name, description, tech_stack: stack, status: 'active' });
}

export async function getProjects() {
  return base44.entities.Project.list('-updated_date', 100);
}

// ── Uploads ──────────────────────────────────────────────────────────────────
export async function persistUpload({ file_name, file_url, mime_type, file_size_kb, file_type, description, tags }) {
  return base44.entities.Upload.create({ file_name, file_url, mime_type, file_size_kb, file_type: file_type || 'other', description, tags });
}

export async function getUploads(limit = 100) {
  return base44.entities.Upload.list('-created_date', limit);
}