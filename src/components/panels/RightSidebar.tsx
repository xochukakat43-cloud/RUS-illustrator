import React, { useState } from 'react';
import { Sliders, Layers, Combine, AlignCenter, Settings } from 'lucide-react';
import type { Editor } from '../../core/Editor';
import type {
  ActiveStyle,
  ArtboardConfig,
  DirectSelectionInfo,
  LayerNode,
  SelectionInfo,
} from '../../core/types';
import { PropertiesPanel } from './PropertiesPanel';
import { PathfinderPanel } from './PathfinderPanel';
import { AlignPanel } from './AlignPanel';
import { LayersPanel } from './LayersPanel';
import { ArtboardPanel } from './ArtboardPanel';

interface RightSidebarProps {
  editor: Editor | null;
  selection: SelectionInfo;
  directSelection: DirectSelectionInfo;
  activeStyle: ActiveStyle;
  layers: LayerNode[];
  artboard: ArtboardConfig;
  onUpdateArtboard: (config: Partial<ArtboardConfig>) => void;
  onOpenColorPicker: (type: 'fill' | 'stroke') => void;
}

type TabKey = 'properties' | 'pathfinder' | 'align' | 'layers' | 'artboard';

export const RightSidebar: React.FC<RightSidebarProps> = ({
  editor,
  selection,
  directSelection,
  activeStyle,
  layers,
  artboard,
  onUpdateArtboard,
  onOpenColorPicker,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('properties');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'properties', label: 'Свойства', icon: <Sliders size={15} /> },
    { key: 'pathfinder', label: 'Pathfinder', icon: <Combine size={15} /> },
    { key: 'align', label: 'Выравнивание', icon: <AlignCenter size={15} /> },
    { key: 'layers', label: 'Слои', icon: <Layers size={15} /> },
    { key: 'artboard', label: 'Артборд', icon: <Settings size={15} /> },
  ];

  return (
    <aside className="w-80 bg-ai-panel border-l border-ai-border flex flex-col z-20 select-none shadow-md shrink-0">
      {/* Top Tab Bar */}
      <div className="flex border-b border-ai-border bg-ai-header px-1 pt-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            title={t.label}
            className={`flex-1 py-2 px-1 text-[11px] font-medium flex items-center justify-center gap-1 rounded-t border-t border-x transition-colors ${
              activeTab === t.key
                ? 'bg-ai-panel border-ai-border text-ai-textLight border-b-ai-panel'
                : 'border-transparent text-ai-textMuted hover:text-ai-textLight hover:bg-ai-hover/50'
            }`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-5">
        {activeTab === 'properties' && (
          <PropertiesPanel
            editor={editor}
            selection={selection}
            directSelection={directSelection}
            activeStyle={activeStyle}
            onOpenColorPicker={onOpenColorPicker}
          />
        )}

        {activeTab === 'pathfinder' && (
          <PathfinderPanel editor={editor} selection={selection} />
        )}

        {activeTab === 'align' && (
          <AlignPanel editor={editor} selection={selection} />
        )}

        {activeTab === 'layers' && (
          <LayersPanel editor={editor} layers={layers} selection={selection} />
        )}

        {activeTab === 'artboard' && (
          <ArtboardPanel
            editor={editor}
            artboard={artboard}
            onUpdateArtboard={onUpdateArtboard}
          />
        )}
      </div>
    </aside>
  );
};
