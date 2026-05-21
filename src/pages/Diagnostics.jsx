import { loadUser, resolveUserAccess } from '@/lib/resolveUserAccess';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { testBackendConnection } from '@/lib/backendApi';
import { Activity, Play, CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';

const CHECK_ITEMS = [
  { key: 'auth', label: 'Frontend Auth', description: 'Verify user is authenticated and session is valid' },
  { key: 'backend', label: 'Backend API', description: 'Test connection to active Python backend endpoint' },
  { key: 'upload', label: 'File Uploads', description: 'Verify upload service is reachable' },
  { key: 'database', label: 'Database Writes', description: 'Write a test record to DiagnosticsReport entity' },
  { key: 'permissions', label: 'Permissions', description: 'Verify entity read/write access for current user' },
];

function StatusIcon({ status }) {
  if (!status) return <Clock className="w-5 h-5 text-muted-foreground" />;
  if (status === 'pass') return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  if (status === 'fail') return <XCircle className="w-5 h-5 text-destructive" />;
  return <Clock className="w-5 h-5 text-muted-foreground" />;
}

export default function Diagnostics() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [runningKey, setRunningKey] = useState(null);
  const [pastReports, setPastReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    base44.entities.DiagnosticsReport.list('-created_date', 10)
      .then(r => { setPastReports(r); setLoadingReports(false); });
  }, []);

  const runCheck = async (key) => {
    setResults(r => ({ ...r, [key]: { status: null, message: 'Running…', running: true } }));
    setRunningKey(key);

    let status = 'pass';
    let message = '';

    if (key === 'auth') {
      const user = await Promise.resolve(loadUser());
      if (user && user.email) {
        message = `Authenticated as ${user.email}`;
      } else {
        status = 'fail';
        message = 'Not authenticated or session expired';
      }
    }

    if (key === 'backend') {
      const result = await testBackendConnection();
      status = result.success ? 'pass' : 'fail';
      message = result.success ? `Connected (${result.duration_ms}ms)` : result.message || 'Connection failed';
    }

    if (key === 'upload') {
      // Try creating a tiny text blob
      const blob = new Blob(['diagnostics-test'], { type: 'text/plain' });
      const file = new File([blob], 'diag-test.txt', { type: 'text/plain' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (file_url) {
        message = 'Upload service reachable';
      } else {
        status = 'fail';
        message = 'Upload returned no URL';
      }
    }

    if (key === 'database') {
      const record = await base44.entities.DiagnosticsReport.create({
        run_at: new Date().toISOString(),
        overall_status: 'healthy',
        database_status: 'pass',
        database_message: 'Test write',
      });
      if (record && record.id) {
        message = `Write OK — ID: ${record.id.slice(0, 8)}`;
      } else {
        status = 'fail';
        message = 'Write returned no record';
      }
    }

    if (key === 'permissions') {
      const projects = await base44.entities.Project.list('created_date', 1);
      const test = await base44.entities.Project.create({ name: '__diag_test__', status: 'archived' });
      await base44.entities.Project.delete(test.id);
      message = `Read/write/delete permissions OK`;
    }

    setResults(r => ({ ...r, [key]: { status, message, running: false } }));
    setRunningKey(null);
    return { key, status, message };
  };

  const runAll = async () => {
    setRunning(true);
    setResults({});
    const checks = {};
    for (const item of CHECK_ITEMS) {
      const r = await runCheck(item.key);
      checks[r.key] = r;
    }

    // Save report
    const overall = Object.values(checks).every(c => c.status === 'pass') ? 'healthy'
      : Object.values(checks).some(c => c.status === 'fail') ? 'critical' : 'degraded';

    await base44.entities.DiagnosticsReport.create({
      run_at: new Date().toISOString(),
      overall_status: overall,
      auth_status: checks.auth?.status || 'skip',
      auth_message: checks.auth?.message || '',
      backend_status: checks.backend?.status || 'skip',
      backend_message: checks.backend?.message || '',
      upload_status: checks.upload?.status || 'skip',
      upload_message: checks.upload?.message || '',
      database_status: checks.database?.status || 'skip',
      database_message: checks.database?.message || '',
      permissions_status: checks.permissions?.status || 'skip',
      permissions_message: checks.permissions?.message || '',
    });

    const reports = await base44.entities.DiagnosticsReport.list('-created_date', 10);
    setPastReports(reports);
    setRunning(false);
  };

  const allPassed = CHECK_ITEMS.every(i => results[i.key]?.status === 'pass');
  const anyFailed = CHECK_ITEMS.some(i => results[i.key]?.status === 'fail');
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <PageHeader
        title="Diagnostics"
        subtitle="System health checks for TerrellOS AI Builder"
        action={
          <Button onClick={runAll} disabled={running}
            className="gradient-purple-blue text-white font-semibold rounded-xl px-6">
            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {running ? 'Running…' : 'Run All Checks'}
          </Button>
        }
      />

      {hasResults && (
        <div className={`rounded-2xl border p-4 mb-6 text-sm font-medium flex items-center gap-3
          ${allPassed ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
          : anyFailed ? 'border-destructive/30 bg-destructive/5 text-destructive'
          : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'}`}>
          {allPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {allPassed ? 'All systems healthy' : anyFailed ? 'One or more checks failed' : 'Diagnostics in progress…'}
        </div>
      )}

      {/* Check items */}
      <div className="card-glass rounded-2xl p-6 mb-6">
        <div className="space-y-3">
          {CHECK_ITEMS.map(item => {
            const r = results[item.key];
            const isRunning = runningKey === item.key || r?.running;
            return (
              <div key={item.key} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors duration-150">
                {isRunning
                  ? <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                  : <StatusIcon status={r?.status} />
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{r?.message || item.description}</div>
                </div>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => runCheck(item.key)}
                  disabled={running || !!runningKey}
                  className="text-muted-foreground hover:text-primary text-xs flex-shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Run
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past reports */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Past Diagnostic Reports</h2>
        {loadingReports ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-secondary/30 animate-pulse" />)}</div>
        ) : pastReports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No diagnostic reports yet. Run your first check.</p>
        ) : (
          <div className="space-y-2">
            {pastReports.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 text-sm">
                <StatusBadge status={r.overall_status} />
                <span className="text-muted-foreground text-xs font-mono flex-1">
                  {r.run_at ? format(new Date(r.run_at), 'MMM d, yyyy HH:mm') : '—'}
                </span>
                <div className="flex gap-1.5">
                  {['auth','backend','upload','database','permissions'].map(k => (
                    <span key={k} className={`w-2 h-2 rounded-full ${r[`${k}_status`] === 'pass' ? 'bg-emerald-400' : r[`${k}_status`] === 'fail' ? 'bg-destructive' : 'bg-muted-foreground'}`}
                      title={`${k}: ${r[`${k}_status`]}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}