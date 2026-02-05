import { useState } from 'react';
import { FiChevronRight, FiChevronDown, FiFolder } from 'react-icons/fi';
import type { FileInfo } from '../../types';

interface FileTreeProps {
  files: FileInfo[];
}

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
}

export function FileTree({ files }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // 파일 목록을 트리 구조로 변환
  const buildTree = (fileList: FileInfo[]): TreeNode[] => {
    const tree: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();

    for (const file of fileList) {
      const parts = file.path.split(/[/\\]/);
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (isFile) {
          // 파일 노드 추가
          const parentPath = parts.slice(0, -1).join('/');
          const parent = parentPath ? folderMap.get(parentPath) : null;

          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push({
              name: part,
              path: file.path,
              type: 'file',
            });
          } else {
            tree.push({
              name: part,
              path: file.path,
              type: 'file',
            });
          }
        } else {
          // 폴더 노드 추가 또는 참조
          if (!folderMap.has(currentPath)) {
            const node: TreeNode = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: [],
            };
            folderMap.set(currentPath, node);

            const parentPath = parts.slice(0, i).join('/');
            const parent = parentPath ? folderMap.get(parentPath) : null;

            if (parent) {
              if (!parent.children) parent.children = [];
              parent.children.push(node);
            } else if (i === 0) {
              tree.push(node);
            }
          }
        }
      }
    }

    return tree;
  };

  const tree = buildTree(files);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = level * 16;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded transition-colors text-left"
            style={{ paddingLeft: `${paddingLeft + 8}px` }}
          >
            {isExpanded ? (
              <FiChevronDown className="text-gray-400 text-xs" />
            ) : (
              <FiChevronRight className="text-gray-400 text-xs" />
            )}
            <FiFolder className="text-yellow-500" />
            <span className="text-sm text-gray-700 truncate">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className="px-2 py-1 hover:bg-gray-100 rounded transition-colors cursor-pointer text-sm text-gray-600 truncate"
        style={{ paddingLeft: `${paddingLeft + 24}px` }}
        title={node.path}
      >
        {node.name}
      </div>
    );
  };

  if (files.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        파일이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {tree.map((node) => renderNode(node))}
    </div>
  );
}
