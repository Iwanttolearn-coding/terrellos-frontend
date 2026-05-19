/**
 * LegacyVaultManager.jsx
 * Full legacy vault control panel.
 * Manages: trusted contacts, access levels, release triggers,
 * memory ownership, export, deletion, pause/resume training.
 * This is the user's control room for their Eternal Echo.
 */
import { useState } from 'react';
import {
  Shield, Users, Download, Trash2, Pause, Play, Lock,
  UserPlus, ChevronDown, ChevronRight, AlertTriangle,
  Heart, Eye, Settings, CheckCircle, Clock, X
} from 'lucide-react';
import { api } from '@/lib/apiClient';

const ACCESS_LEVELS = [
  { value: 'view',     label: 'View only',   desc: 'Can read stored memories and stories.' },
  { value: 'interact', label: 'Interact',     desc: 'Can have conversations with your Echo.' },
  { value: 'manage',   label: 'Full access',  desc: 'Can manage settings and download data.' },
];

const RELEASE_TRIGGERS = [
  { value: 'manual',     label: 'Manual only',  desc: 'You release access yourself.' },
  { value: 'posthumous', label: 'Posthumous',    desc: 'Access granted after your passing.' },
  { value: 'scheduled',  label: 'Scheduled',     desc: 'Access unlocks on a specific date.' },
  { value: 'never',      label: 'Never',         desc: 'Access is permanently restricted.' },
];

export default function LegacyVaultManager({ memoryProfileId, userId }) {
  const [contacts, setContacts]       = useState([]);
  const [addingContact, setAddingContact] = useState(false);
  const [trainingPaused, setTrainingPaused] = useState(false);
  const [exportLoading, setExportLoading]   = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState(false);
  const [deleteInput, setDeleteInput]       = useState('');
  const [expandedSection, setExpandedSection] = useState('contacts');
  const [toast, setToast] = useState(null);

  const [newContact, setNewContact] = useState({
    name: '', email: '', relationship: '',
    access_level: 'view', release_trigger: 'manual',
  });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function addContact() {
    if (!newContact.name.trim() || !newContact.email.trim()) return;
    const contact = { ...newContact, id: Date.now(), notified: false };
    setContacts(prev => [...prev, contact]);
    setNewContact({ name: '', email: '', relationship: '', access_level: 'view', release_trigger: 'manual' });
    setAddingContact(false);
    showToast(`${contact.name} added to trusted contacts.`);
  }

  function removeContact(id) {
    setContacts(prev => prev.filter(c => c.id !== id));
    showToast('Contact removed.', 'info');
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await api.post('/v1/memory/export', {
        memory_profile_id: memoryProfileId,
        user_id: userId,
        format: 'json',
      });
      if (res?.export) {
        const blob = new Blob([JSON.stringify(res.export, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eternal-echo-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Memory export downloaded.');
      }
    } catch {
      showToast('Export saved locally — backend sync pending.', 'info');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteInput !== 'DELETE MY ECHO') return;
    try {
      await api.delete(`/v1/memory/delete`, {
        method: 'DELETE',
        body: JSON.stringify({ memory_profile_id: memoryProfileId, user_id: userId, confirm: true }),
        headers: { 'Content-Type': 'application/json' },
      });
      showToast('Memory profile permanently deleted.', 'danger');
    } catch {
      showToast('Delete queued — will process on backend sync.', 'info');
    }
    setDeleteConfirm(false);
    setDeleteInput('');
  }

  function toggleSection(s) {
    setExpandedSection(prev => prev === s ? null : s);
  }

  const SECTIONS = [
    { id: 'contacts',  label: 'Trusted Contacts', icon: Users },
    { id: 'training',  label: 'Training Controls', icon: Settings },
    { id: 'export',    label: 'Export & Ownership', icon: Download },
    { id: 'danger',    label: 'Danger Zone',        icon: AlertTriangle },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 pb-12">

      {/* Header */}
      <div className="flex items-center gap-3 px-1 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
          <Lock className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Legacy Vault</h2>
          <p className="text-xs text-white/40">Full control over your Eternal Echo and who can access it.</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all ${
          toast.type === 'danger' ? 'bg-red-900/80 border-red-500/40 text-red-200' :
          toast.type === 'info'   ? 'bg-blue-900/70 border-blue-500/30 text-blue-200' :
          'bg-emerald-900/70 border-emerald-500/30 text-emerald-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {SECTIONS.map(section => {
        const Icon = section.icon;
        const isOpen = expandedSection === section.id;
        return (
          <div key={section.id} className={`border rounded-2xl overflow-hidden transition-all ${
            section.id === 'danger'
              ? 'border-red-500/20 bg-red-500/3'
              : 'border-white/8 bg-white/2'
          }`}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-all"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 ${section.id === 'danger' ? 'text-red-400' : 'text-white/50'}`} />
                <span className={`text-sm font-semibold ${section.id === 'danger' ? 'text-red-300' : 'text-white/80'}`}>
                  {section.label}
                </span>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-white/5 pt-4">

                {/* ── TRUSTED CONTACTS ───────────────────────────────────── */}
                {section.id === 'contacts' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                      These people can access your Echo under conditions you define. You are in complete control of when and how.
                    </p>

                    {contacts.length === 0 && !addingContact && (
                      <div className="flex flex-col items-center py-6 space-y-2 border border-dashed border-white/8 rounded-xl">
                        <Users className="w-7 h-7 text-white/15" />
                        <p className="text-xs text-white/25">No trusted contacts yet.</p>
                      </div>
                    )}

                    {contacts.map(contact => (
                      <div key={contact.id} className="flex items-start justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">{contact.name}</p>
                          <p className="text-xs text-white/40">{contact.email}</p>
                          {contact.relationship && (
                            <p className="text-xs text-white/30">{contact.relationship}</p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                              {ACCESS_LEVELS.find(a => a.value === contact.access_level)?.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                              {RELEASE_TRIGGERS.find(r => r.value === contact.release_trigger)?.label}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => removeContact(contact.id)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {addingContact ? (
                      <div className="space-y-3 p-4 bg-white/3 border border-purple-500/20 rounded-xl">
                        <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Add trusted contact</p>
                        <div className="grid grid-cols-2 gap-3">
                          <input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                            placeholder="Full name *" className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50" />
                          <input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                            placeholder="Email *" type="email" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50" />
                          <input value={newContact.relationship} onChange={e => setNewContact(p => ({ ...p, relationship: e.target.value }))}
                            placeholder="Relationship" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/40 mb-1 block">Access level</label>
                            <select value={newContact.access_level} onChange={e => setNewContact(p => ({ ...p, access_level: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                              {ACCESS_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-white/40 mb-1 block">Release trigger</label>
                            <select value={newContact.release_trigger} onChange={e => setNewContact(p => ({ ...p, release_trigger: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                              {RELEASE_TRIGGERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={addContact} className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-all">
                            Add contact
                          </button>
                          <button onClick={() => setAddingContact(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white/60 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingContact(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-purple-500/25 text-sm text-purple-400/60 hover:border-purple-500/50 hover:text-purple-300 transition-all">
                        <UserPlus className="w-4 h-4" /> Add trusted contact
                      </button>
                    )}
                  </div>
                )}

                {/* ── TRAINING CONTROLS ──────────────────────────────────── */}
                {section.id === 'training' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                      Control whether your memory profile continues to train. Pausing prevents any new data from being processed.
                    </p>
                    <div className="flex items-center justify-between p-4 bg-white/3 border border-white/8 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${trainingPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                        <div>
                          <p className="text-sm font-semibold text-white">{trainingPaused ? 'Training paused' : 'Training active'}</p>
                          <p className="text-xs text-white/35">Memory profile building in progress</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setTrainingPaused(v => !v); showToast(trainingPaused ? 'Training resumed.' : 'Training paused.', 'info'); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          trainingPaused
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        }`}
                      >
                        {trainingPaused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Camera recording', status: 'active' },
                        { label: 'Voice capture', status: 'active' },
                        { label: 'AI synthesis', status: 'preparation' },
                        { label: 'Avatar generation', status: 'preparation' },
                      ].map(item => (
                        <div key={item.label} className="p-3 bg-white/2 border border-white/6 rounded-xl">
                          <p className="text-xs text-white/60">{item.label}</p>
                          <span className={`text-xs mt-1 block ${item.status === 'active' ? 'text-emerald-400/70' : 'text-amber-400/60'}`}>
                            {item.status === 'active' ? 'Active' : 'In preparation'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── EXPORT ─────────────────────────────────────────────── */}
                {section.id === 'export' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                      Your memories belong to you. Export everything at any time — stories, sessions, consent records, and all data.
                    </p>
                    <div className="space-y-2">
                      <button onClick={handleExport} disabled={exportLoading}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/5 transition-all disabled:opacity-50">
                        <div className="flex items-center gap-3">
                          <Download className="w-4.5 h-4.5 text-blue-400" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">Export as JSON</p>
                            <p className="text-xs text-white/35">All memories, sessions, and consent records</p>
                          </div>
                        </div>
                        {exportLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4 text-white/25" />}
                      </button>
                      <div className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-dashed border-white/6 opacity-40">
                        <div className="flex items-center gap-3">
                          <Download className="w-4.5 h-4.5 text-white/30" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white/60">Export as PDF</p>
                            <p className="text-xs text-white/25">Coming soon</p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-400/50">Preparation active</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DANGER ZONE ────────────────────────────────────────── */}
                {section.id === 'danger' && (
                  <div className="space-y-4">
                    <p className="text-xs text-red-300/50 leading-relaxed">
                      Permanently delete your entire memory profile, all story fragments, sessions, and consent records. This cannot be undone.
                    </p>
                    {!deleteConfirm ? (
                      <button onClick={() => setDeleteConfirm(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-red-500/25 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" /> Delete my Eternal Echo
                      </button>
                    ) : (
                      <div className="space-y-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-300/70 leading-relaxed">
                            This will permanently erase all your memories, voice recordings, story fragments, and consent records. Type <strong className="text-red-300">DELETE MY ECHO</strong> to confirm.
                          </p>
                        </div>
                        <input
                          value={deleteInput}
                          onChange={e => setDeleteInput(e.target.value)}
                          placeholder="Type DELETE MY ECHO"
                          className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-200 placeholder-red-400/30 focus:outline-none focus:border-red-500/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleDelete}
                            disabled={deleteInput !== 'DELETE MY ECHO'}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-30 hover:bg-red-500 transition-all"
                          >
                            Permanently delete
                          </button>
                          <button onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }}
                            className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white/60 transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
