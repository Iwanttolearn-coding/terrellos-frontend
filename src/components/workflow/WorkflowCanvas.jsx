import { useRef, useEffect, useState } from 'react';
import { Trash2, Settings } from 'lucide-react';

export default function WorkflowCanvas({ nodes, edges, onSelectNode, onDeleteNode, onConnect }) {
  const canvasRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [positions, setPositions] = useState({});

  useEffect(() => {
    // Initialize positions
    const newPositions = {};
    nodes.forEach((n, i) => {
      newPositions[n.id] = n.position || { x: 100 + i * 200, y: 100 };
    });
    setPositions(newPositions);
  }, [nodes]);

  const handleNodeMouseDown = (e, nodeId) => {
    e.preventDefault();
    setDraggingNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (!draggingNode) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPositions(prev => ({
        ...prev,
        [draggingNode]: { x: Math.max(0, x - 60), y: Math.max(0, y - 20) },
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full relative bg-gradient-to-br from-background to-secondary/20 overflow-auto"
    >
      {/* Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {edges.map(edge => {
          const source = positions[edge.source];
          const target = positions[edge.target];
          if (!source || !target) return null;
          return (
            <line
              key={edge.id}
              x1={source.x + 60}
              y1={source.y + 20}
              x2={target.x + 60}
              y2={target.y + 20}
              stroke="hsl(265 80% 60%)"
              strokeWidth="2"
              opacity="0.6"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const pos = positions[node.id] || { x: 0, y: 0 };
        return (
          <div
            key={node.id}
            onMouseDown={e => handleNodeMouseDown(e, node.id)}
            onClick={() => onSelectNode(node)}
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              cursor: draggingNode === node.id ? 'grabbing' : 'grab',
            }}
            className="w-32 bg-card border border-primary/40 rounded-xl p-3 shadow-lg hover:border-primary/70 transition-all cursor-move"
          >
            <div className="text-xs font-bold text-foreground mb-2 truncate">{node.label}</div>
            <div className="text-[10px] text-muted-foreground mb-2">{node.type}</div>
            <div className="flex gap-1">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                className="flex-1 p-1 rounded bg-primary/20 hover:bg-primary/30 text-[10px]"
              >
                <Settings className="w-3 h-3" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="flex-1 p-1 rounded bg-destructive/20 hover:bg-destructive/30 text-[10px]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}