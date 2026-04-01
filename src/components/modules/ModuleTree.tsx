"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleTask } from "@/types/database";

interface ModuleTreeProps {
  tasks: ModuleTask[];
  selectedIds?: Set<string>;
  onToggle?: (id: string, task: ModuleTask) => void;
  selectable?: boolean;
}

interface TreeNode extends ModuleTask {
  children: TreeNode[];
}

function buildTree(tasks: ModuleTask[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const t of tasks) map.set(t.id, { ...t, children: [] });

  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function TreeNodeComponent({
  node,
  selectedIds,
  onToggle,
  selectable,
  depth = 0,
}: {
  node: TreeNode;
  selectedIds?: Set<string>;
  onToggle?: (id: string, task: ModuleTask) => void;
  selectable?: boolean;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedIds?.has(node.id);

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-1 py-1 px-2 rounded hover:bg-slate-50 group",
          isSelected && "bg-blue-50"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-slate-600"
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {selectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle?.(node.id, node)}
            className="mt-0.5 flex-shrink-0 rounded"
          />
        )}

        <div className="min-w-0 flex-1">
          <span className="text-xs text-slate-400 mr-1">{node.task_number}</span>
          <span className={cn("text-sm", depth === 0 && "font-medium")}>{node.name}</span>
          {node.section && depth === 0 && (
            <span className="ml-2 text-xs text-slate-400">{node.section}</span>
          )}
        </div>
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              selectable={selectable}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ModuleTree({ tasks, selectedIds, onToggle, selectable = false }: ModuleTreeProps) {
  const tree = buildTree(tasks);

  return (
    <div className="border rounded-md overflow-auto max-h-[500px]">
      {tree.map((root) => (
        <TreeNodeComponent
          key={root.id}
          node={root}
          selectedIds={selectedIds}
          onToggle={onToggle}
          selectable={selectable}
        />
      ))}
      {tree.length === 0 && (
        <p className="text-sm text-slate-400 p-4 text-center">Nenhuma tarefa encontrada.</p>
      )}
    </div>
  );
}
