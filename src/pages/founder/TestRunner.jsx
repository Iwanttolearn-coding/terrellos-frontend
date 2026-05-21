import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { notify } from '@/components/NotificationCenter';
import { isFounderEmail } from '@/lib/production';
import {
  CheckCircle, AlertTriangle, XCircle, RefreshCw, ShieldCheck, Zap,
  Download, Clock, Target, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const TEST_CATEGORIES = [
  { id: 'route_health', name: 'Route Health Check', critical: true },
  { id: 'page_load', name: 'Page Load Performance', critical: true },
  { id: 'auth_guard', name: 'Auth Guard Tests', critical: true },
  { id: 'founder_access', name: 'Founder Access Control', critical: true },
  { id: 'api_endpoints', name: 'API Endpoint Tests', critical: true },
  { id: 'github_sync', name: 'GitHub Sync Test', critical: false },
  { id: 'buildlog_write', name: 'BuildLog Write Test', critical: true },
  { id: 'patch_entity', name: 'Patch Entity Test', critical: true },
  { id: 'workflow_state', name: 'WorkflowState Test', critical: true },
  { id: 'rollback_metadata', name: 'Rollback Metadata Test', critical: false },
  { id: 'console_errors', name: 'Console Error Scan', critical: false },
  { id: 'backend_functions', name: 'Backend Function Response Test', critical: true },
  { id: 'env_variables', name: 'Environment Variable Check', critical: true },
  { id: 'payment_gates', name: 'Payment/Subscription Gate Test', critical: false },
  { id: 'ai_models', name: 'AI Model Assignment Check', critical: false },
];

function TestResultCard({ test, result }) {
  const status = result?.status || 'unknown';
  const statusConfig = {
    pass: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
    warn: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
    fail: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/25' },
  };

  const config = statusConfig[status] || statusConfig.pass;
  const Icon = config.icon;

  return (
    <div className={`rounded-lg p-3.5 border ${config.bg} ${config.border} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
          <span className="text-xs font-semibold text-foreground">{test.name}</span>
          {test.critical && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">CRITICAL</span>
          )}
        </div>
        <span className={`text-xs font-bold ${config.color} uppercase`}>{status}</span>
      </div>

      {result && (
        <div className="text-xs text-muted-foreground space-y-0.5 pl-6">
          {Array.isArray(result) ? (
            result.slice(0, 3).map((r, i) => (
              <div key={i} className="text-[10px]">
                {r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✕'}{' '}
                {r.name || r.endpoint || r.function || r.route || JSON.stringify(r).slice(0, 40)}
              </div>
            ))
          ) : (
            <div className="text-[10px]">
              {Object.entries(result)
                .slice(0, 2)
                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 30) : v}`)
                .join(' · ')}
            </div>
          )}
          {(Array.isArray(result) && result.length > 3) && (
            <div className="text-[10px] text-muted-foreground/60">+{result.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestRunner() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState(TEST_CATEGORIES.map(t => t.id));
  const [testResult, setTestResult] = useState(null);
  const [appName, setAppName] = useState('TerrellOS');
  const [branch, setBranch] = useState('main');

  useEffect(() => {
    Promise.resolve(loadUser()).then(u => setUser(u)).catch(() => {});
    setLoading(false);
  }, []);

  async function runTests() {
    setRunning(true);
    setTestResult(null);
    try {
      const res = await safeInvoke('runTestSuite', {
        appName,
        branch,
        selectedTests,
      });

      if (res.data?.error) {
        notify.error(res.data.error);
      } else {
        setTestResult(res.data);
        notify.success(`Tests complete: ${res.data.passed_count} PASS, ${res.data.warning_count} WARN, ${res.data.failed_count} FAIL`);
      }
    } catch (err) {
      notify.error(`Test run failed: ${err.message}`);
    }
    setRunning(false);
  }

  function toggleTest(testId) {
    if (selectedTests.includes(testId)) {
      setSelectedTests(selectedTests.filter(t => t !== testId));
    } else {
      setSelectedTests([...selectedTests, testId]);
    }
  }

  function exportReport() {
    if (!testResult) return;
    const lines = [
      `TerrellOS Test Report`,
      `Generated: ${new Date().toISOString()}`,
      `App: ${testResult.summary.app}`,
      `Branch: ${testResult.summary.branch}`,
      `Result: ${testResult.deployment_recommendation.toUpperCase()}`,
      `Pass: ${testResult.passed_count} · Warn: ${testResult.warning_count} · Fail: ${testResult.failed_count}`,
      `Pass Rate: ${testResult.summary.pass_rate}%`,
      `Duration: ${testResult.duration_ms}ms`,
      '',
      'RESULTS:',
      JSON.stringify(testResult.results, null, 2),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `terrellos-test-report-${Date.now()}.txt`;
    a.click();
  }

  if (user !== null && !resolveUserAccess(user?.email).founder) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Test Runner is restricted to founders only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Live Test Runner</h1>
            <p className="text-xs text-muted-foreground font-mono">Pre-deployment verification suite</p>
          </div>
        </div>
      </div>

      {/* Config section */}
      <div className="card-glass rounded-2xl p-5 border border-border mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">App Name</label>
            <input
              value={appName}
              onChange={e => setAppName(e.target.value)}
              className="w-full bg-input border border-border rounded-lg text-sm text-foreground px-3 py-2 font-mono focus:outline-none focus:border-primary/50"
              placeholder="TerrellOS"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Branch</label>
            <input
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg text-sm text-foreground px-3 py-2 font-mono focus:outline-none focus:border-primary/50"
              placeholder="main"
            />
          </div>
        </div>

        {/* Test selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase">Test Selection</label>
            <button
              onClick={() => setSelectedTests(selectedTests.length === TEST_CATEGORIES.length ? [] : TEST_CATEGORIES.map(t => t.id))}
              className="text-xs text-primary hover:text-primary/80"
            >
              {selectedTests.length === TEST_CATEGORIES.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TEST_CATEGORIES.map(test => (
              <label key={test.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTests.includes(test.id)}
                  onChange={() => toggleTest(test.id)}
                  className="w-4 h-4"
                />
                <span className="text-xs text-foreground flex-1">{test.name}</span>
                {test.critical && <span className="text-[10px] text-destructive font-bold">⚡</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={runTests}
            disabled={running || selectedTests.length === 0}
            className="flex-1 gap-2 gradient-purple-blue text-white border-0 h-11"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {running ? `Running Tests…` : `Run ${selectedTests.length} Tests`}
          </Button>
        </div>
      </div>

      {/* Results */}
      {testResult && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className={`rounded-xl p-5 border flex items-center justify-between ${
            testResult.deployment_recommendation === 'safe_to_deploy'
              ? 'bg-emerald-500/10 border-emerald-500/25'
              : testResult.deployment_recommendation === 'deploy_with_caution'
              ? 'bg-yellow-500/10 border-yellow-500/25'
              : 'bg-destructive/10 border-destructive/25'
          }`}>
            <div>
              <div className={`text-lg font-bold ${
                testResult.deployment_recommendation === 'safe_to_deploy' ? 'text-emerald-400' :
                testResult.deployment_recommendation === 'deploy_with_caution' ? 'text-yellow-400' : 'text-destructive'
              }`}>
                {testResult.deployment_recommendation === 'safe_to_deploy' ? '✓ Safe to Deploy' :
                 testResult.deployment_recommendation === 'deploy_with_caution' ? '⚠ Deploy with Caution' : '✕ Deployment Blocked'}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {testResult.passed_count} PASS · {testResult.warning_count} WARN · {testResult.failed_count} FAIL ({testResult.summary.pass_rate}% pass rate)
              </div>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              {testResult.duration_ms}ms
            </div>
          </div>

          {/* Test results grid */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3">Test Results</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {TEST_CATEGORIES.filter(t => selectedTests.includes(t.id)).map(test => (
                <TestResultCard
                  key={test.id}
                  test={test}
                  result={testResult.results?.[test.id]}
                />
              ))}
            </div>
          </div>

          {/* Export button */}
          <Button
            onClick={exportReport}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" /> Export Test Report
          </Button>
        </div>
      )}

      {!testResult && !running && (
        <div className="card-glass rounded-2xl p-12 border border-border text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No test results yet</p>
          <p className="text-xs text-muted-foreground mt-1">Select tests above and click "Run Tests" to begin</p>
        </div>
      )}
    </div>
  );
}