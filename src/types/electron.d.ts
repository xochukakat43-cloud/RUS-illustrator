export interface ElectronAPI {
  isElectron: boolean;
  openFileDialog: () => Promise<{ filePath: string; fileName: string; content: string } | null>;
  saveFileDialog: (params: { content: string; defaultName?: string; extension?: string }) => Promise<{ filePath: string; fileName: string } | null>;
  exportFileDialog: (params: { base64Data: string; defaultName?: string; extension?: string }) => Promise<{ filePath: string; fileName: string } | null>;
  onMenuAction: (callback: (action: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
