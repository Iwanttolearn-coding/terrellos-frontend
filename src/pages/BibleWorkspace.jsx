import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Loader2, Download, Save, ChevronDown, Sparkles, MessageSquare, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { notify } from '@/components/NotificationCenter';

const CONTENT_TYPES = [
  { key: 'sermon',        label: 'Sermon',          emoji: '🎤' },
  { key: 'devotional',    label: 'Devotional',       emoji: '🕊️' },
  { key: 'bible_study',   label: 'Bible Study',      emoji: '📖' },
  { key: 'discussion',    label: 'Discussion Guide',  emoji: '💬' },
  { key: 'theological',   label: 'Theological Analysis', emoji: '⛪' },
  { key: 'quiz',          label: 'Quiz',             emoji: '✅' },
];

const LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Español' },
];

export default function BibleWorkspace() {
  const [topic, setTopic] = useState('');
  const [scripture, setScripture] = useState('');
  const [contentType, setContentType] = useState('bible_study');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stage, setStage] = useState('');

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    setSaved(false);
    const ct = CONTENT_TYPES.find(c => c.key === contentType);
    const lang = language === 'es' ? 'in Spanish' : 'in English';

    try {
      setStage('Generating core content…');
      const systemPrompt = `You are an expert theologian and ministry teacher creating a professional ${ct.label} ${lang}. Format your output in clear Markdown with headers. Be thorough, spiritually grounded, and practical.`;

      const coreRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed ${ct.label} about: "${topic}". ${scripture ? `Key scripture: ${scripture}.` : ''} Include: introduction, main body with 3-5 points, application, and closing prayer/reflection. Format beautifully in Markdown.`,
        model: 'claude_sonnet_4_6',
        response_json_schema: null,
      });

      setStage('Generating supplemental content…');
      const suppRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the topic "${topic}" ${scripture ? `and scripture ${scripture}` : ''}, generate:\n1. **Discussion Questions** (5 questions)\n2. **Reflection Points** (3 personal applications)\n3. **Prayer Guide** (short closing prayer)\n${contentType === 'quiz' ? '4. **Quiz** (5 multiple choice questions with answers)' : ''}\nFormat in Markdown ${lang}.`,
      });

      const full = `${coreRes}\n\n---\n\n${suppRes}`;
      setResult(full);
      notify.success('Content generated!');
    } catch (err) {
      setResult(`> ⚠️ Generation failed: ${err.message}`);
      notify.error('Generation failed');
    } finally {
      setLoading(false);
      setStage('');
    }
  }

  async function handleSave() {
    if (!result) return;
    await base44.entities.Upload.create({
      file_name: `${contentType}: ${topic}`,
      file_url: '',
      file_type: 'document',
      description: JSON.stringify({ type: 'bible_content', content_type: contentType, topic, scripture, language, content: result }),
    });
    setSaved(true);
    notify.success('Study saved to vault!');
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center glow-purple flex-shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Bible Workspace</h1>
          <div className="text-xs text-muted-foreground font-mono">AI-powered theological study engine</div>
        </div>
      </div>

      {/* Input panel */}
      <div className="card-glass rounded-2xl p-5 mb-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Content type */}
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">Content Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.key}
                  onClick={() => setContentType(ct.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${contentType === ct.key ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-border/60 hover:text-foreground'}`}
                >
                  <span>{ct.emoji}</span> {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language + fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">Language</label>
              <div className="flex gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l.key}
                    onClick={() => setLanguage(l.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${language === l.key ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-border/60'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Topic / Title</label>
              <Input placeholder="e.g. The grace of God in difficult times…" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Key Scripture (optional)</label>
              <Input placeholder="e.g. John 3:16, Psalm 23" value={scripture} onChange={e => setScripture(e.target.value)} />
            </div>
          </div>
        </div>

        <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{stage || 'Generating…'}</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Generate {CONTENT_TYPES.find(c => c.key === contentType)?.label}</>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="card-glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground capitalize">{contentType.replace(/_/g, ' ')} — {topic}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saved}>
                <Save className="w-3.5 h-3.5 mr-1" />{saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
          <div className="p-5 prose prose-sm prose-invert max-w-none overflow-y-auto max-h-[60vh] scrollbar-dark
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3
            [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-5 [&_h2]:mb-2
            [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1.5
            [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:my-2
            [&_li]:text-muted-foreground [&_li]:my-1
            [&_strong]:text-foreground [&_blockquote]:border-l-primary/50 [&_blockquote]:text-muted-foreground
            [&_hr]:border-border">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}