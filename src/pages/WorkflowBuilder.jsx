import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Save, Play, Trash2, Settings, LinkIcon, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify } from '@/components/NotificationCenter';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import NodePalette from '@/components/workflow/NodePalette';
import NodeEditor from '@/components/workflow/NodeEditor';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    setLoading(true);
    const data = await base44.entities.Workflow.list('-updated_date', 20);
    setWorkflows(data);
    setLoading(false);
  }

  function createNewWorkflow() {
    const newWorkflow = { name: 'Untitled Workflow', nodes: [], edges: [], status: 'draft', trigger_type: 'manual' };
    setSelectedWorkflow(null);
    setNodes([]);
    setEdges([]);
  }

  function addNode(nodeType) {
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      label: nodeType.replace(/_/g, ' '),
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
      config: {},
    };
    setNodes([...nodes, newNode]);
  }

  function deleteNode(nodeId) {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
  }

  function connectNodes(sourceId, targetId) {
    if (sourceId === targetId) return;
    const edge = { id: `edge-${Date.now()}`, source: sourceId, target: targetId };
    setEdges([...edges, edge]);
  }

  async function saveWorkflow() {
    if (!selectedWorkflow && !nodes.length) {
      notify.error('Add nodes to your workflow first');
      return;
    }

    const workflowData = {
      name: selectedWorkflow?.name || document.querySelector('input')?.value || 'Untitled',
      nodes,
      edges,
      status: selectedWorkflow?.status || 'draft',
      trigger_type: selectedWorkflow?.trigger_type || 'manual',
    };

    try {
      if (selectedWorkflow?.id) {
        await base44.entities.Workflow.update(selectedWorkflow.id, workflowData);
        notify.success('Workflow updated');
      } else {
        const created = await base44.entities.Workflow.create(workflowData);
        setSelectedWorkflow(created);
        notify.success('Workflow created');
      }
      await loadWorkflows();
    } catch (err) {
      notify.error(err.message);
    }
  }

  async function executeWorkflow() {
    if (!selectedWorkflow?.id) {
      notify.error('Save workflow first');
      return;
    }

    setExecuting(true);
    try {
      const result = await safeInvoke('executeWorkflow', {
        workflow_id: selectedWorkflow.id,
        input_data: {},
      });
      notify.success(`Workflow executed: ${result.data.success ? 'Success' : 'Failed'}`);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Workflow Builder</h1>
        <p className="text-xs text-muted-foreground mt-1">Chain AI tools into automated sequences</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-64 border border-border rounded-2xl bg-card/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <Button onClick={createNewWorkflow} className="w-full gap-2 mb-3">
              <Plus className="w-4 h-4" /> New Workflow
            </Button>
            <Input placeholder="Workflow name" defaultValue={selectedWorkflow?.name} />
          </div>

          <NodePalette onAddNode={addNode} />

          {/* Workflows list */}
          <div className="flex-1 overflow-y-auto p-4 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground mb-3 uppercase">Recent Workflows</div>
            {workflows.map(wf => (
              <button
                key={wf.id}
                onClick={() => {
                  setSelectedWorkflow(wf);
                  setNodes(wf.nodes || []);
                  setEdges(wf.edges || []);
                }}
                className={`w-full text-left p-2 rounded-lg mb-2 text-sm transition-all ${
                  selectedWorkflow?.id === wf.id ? 'bg-primary/20 text-primary' : 'hover:bg-secondary/40'
                }`}
              >
                {wf.name}
                <div className="text-xs text-muted-foreground">{wf.nodes?.length || 0} nodes</div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 border border-border rounded-2xl bg-card/30 overflow-hidden">
          {nodes.length > 0 ? (
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onSelectNode={node => {
                setSelectedNode(node);
                setShowNodeEditor(true);
              }}
              onDeleteNode={deleteNode}
              onConnect={connectNodes}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-muted-foreground mb-2">No nodes yet</div>
                <p className="text-xs text-muted-foreground max-w-xs">Add nodes from the palette on the left to start building</p>
              </div>
            </div>
          )}
        </div>

        {/* Node Editor */}
        {showNodeEditor && selectedNode && (
          <div className="w-64 border border-border rounded-2xl bg-card/50 flex flex-col overflow-hidden">
            <NodeEditor
              node={selectedNode}
              onUpdate={updatedNode => {
                setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
                setSelectedNode(updatedNode);
              }}
              onClose={() => setShowNodeEditor(false)}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex gap-2 justify-end">
        <Button variant="outline" onClick={loadWorkflows}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
        <Button onClick={saveWorkflow} className="gap-2">
          <Save className="w-4 h-4" /> Save Workflow
        </Button>
        <Button onClick={executeWorkflow} disabled={executing || !selectedWorkflow?.id} className="gap-2">
          <Play className="w-4 h-4" /> {executing ? 'Running…' : 'Execute'}
        </Button>
      </div>
    </div>
  );
}