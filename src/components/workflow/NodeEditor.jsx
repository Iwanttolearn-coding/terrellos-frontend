import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NodeEditor({ node, onUpdate, onClose }) {
  const [config, setConfig] = useState(node.config || {});

  const handleSave = () => {
    onUpdate({ ...node, config });
    onClose();
  };

  const renderConfigForm = () => {
    switch (node.type) {
      case 'memory_vault':
        return (
          <>
            <Input
              label="Memory Title"
              placeholder="e.g., Family Story"
              value={config.memory_title || ''}
              onChange={e => setConfig({ ...config, memory_title: e.target.value })}
            />
            <Input
              label="Emotion Tag"
              placeholder="e.g., joy, grief"
              value={config.emotion || ''}
              onChange={e => setConfig({ ...config, emotion: e.target.value })}
            />
          </>
        );
      case 'voice_lab':
        return (
          <Input
            label="Action"
            placeholder="transcribe"
            value={config.action || ''}
            onChange={e => setConfig({ ...config, action: e.target.value })}
          />
        );
      case 'bible_engine':
        return (
          <Input
            label="Query"
            placeholder="e.g., hope, faith"
            value={config.query || ''}
            onChange={e => setConfig({ ...config, query: e.target.value })}
          />
        );
      case 'condition':
        return (
          <>
            <Input
              label="Field Name"
              placeholder="e.g., memory_saved"
              value={config.field || ''}
              onChange={e => setConfig({ ...config, field: e.target.value })}
            />
            <select
              className="w-full px-2 py-1 rounded border border-border bg-background text-sm"
              value={config.operator || 'equals'}
              onChange={e => setConfig({ ...config, operator: e.target.value })}
            >
              <option>equals</option>
              <option>not_equals</option>
              <option>contains</option>
              <option>exists</option>
            </select>
          </>
        );
      case 'delay':
        return (
          <Input
            label="Delay (ms)"
            type="number"
            placeholder="1000"
            value={config.delay_ms || ''}
            onChange={e => setConfig({ ...config, delay_ms: parseInt(e.target.value) })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-bold text-foreground">{node.label}</h3>
          <p className="text-xs text-muted-foreground">{node.id}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {renderConfigForm()}
      </div>

      <div className="p-4 border-t border-border">
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="w-4 h-4" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}