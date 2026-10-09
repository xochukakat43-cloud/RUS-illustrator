const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Vector Studio — AI Illustrator',
    backgroundColor: '#141414',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  setupApplicationMenu();

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Native File Operations
ipcMain.handle('file:open-dialog', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Открыть векторный проект',
    properties: ['openFile'],
    filters: [
      { name: 'Все поддерживаемые файлы', extensions: ['json', 'ai.json', 'svg'] },
      { name: 'Проект Vector Studio (.json)', extensions: ['json', 'ai.json'] },
      { name: 'Векторная графика SVG (.svg)', extensions: ['svg'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  return { filePath, fileName, content };
});

ipcMain.handle('file:save-dialog', async (event, { content, defaultName, extension = 'ai.json' }) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Сохранить векторный проект',
    defaultPath: defaultName || `untitled.${extension}`,
    filters: [
      { name: 'Проект Vector Studio (.ai.json)', extensions: ['ai.json', 'json'] },
      { name: 'Все файлы', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  await fs.promises.writeFile(result.filePath, content, 'utf-8');
  return { filePath: result.filePath, fileName: path.basename(result.filePath) };
});

ipcMain.handle('file:export-dialog', async (event, { base64Data, defaultName, extension = 'png' }) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Экспортировать изображение',
    defaultPath: defaultName || `export.${extension}`,
    filters: [
      { name: extension.toUpperCase(), extensions: [extension] },
      { name: 'Все файлы', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  if (extension === 'png') {
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    await fs.promises.writeFile(result.filePath, buffer);
  } else {
    await fs.promises.writeFile(result.filePath, base64Data, 'utf-8');
  }

  return { filePath: result.filePath, fileName: path.basename(result.filePath) };
});

function setupApplicationMenu() {
  const template = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Новый документ',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:action', 'new'),
        },
        {
          label: 'Открыть проект...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:action', 'open'),
        },
        { type: 'separator' },
        {
          label: 'Сохранить на диск',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:action', 'save'),
        },
        {
          label: 'Экспортировать...',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:action', 'export'),
        },
        { type: 'separator' },
        { label: 'Выход', role: 'quit' },
      ],
    },
    {
      label: 'Правка',
      submenu: [
        {
          label: 'Отменить',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow?.webContents.send('menu:action', 'undo'),
        },
        {
          label: 'Повторить',
          accelerator: 'CmdOrCtrl+Y',
          click: () => mainWindow?.webContents.send('menu:action', 'redo'),
        },
        { type: 'separator' },
        { label: 'Вырезать', role: 'cut' },
        { label: 'Копировать', role: 'copy' },
        { label: 'Вставить', role: 'paste' },
        { label: 'Выделить все', role: 'selectAll' },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Линейки',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.send('menu:action', 'toggle-rulers'),
        },
        {
          label: 'Умные направляющие',
          accelerator: 'CmdOrCtrl+U',
          click: () => mainWindow?.webContents.send('menu:action', 'toggle-smart-guides'),
        },
        {
          label: 'Направляющие линии',
          accelerator: 'CmdOrCtrl+;',
          click: () => mainWindow?.webContents.send('menu:action', 'toggle-guides'),
        },
        {
          label: 'Сетка документа',
          accelerator: "CmdOrCtrl+'",
          click: () => mainWindow?.webContents.send('menu:action', 'toggle-grid'),
        },
        { type: 'separator' },
        {
          label: 'Вписать артборд в экран',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu:action', 'fit-artboard'),
        },
        {
          label: 'Увеличить масштаб',
          accelerator: 'CmdOrCtrl+=',
          click: () => mainWindow?.webContents.send('menu:action', 'zoom-in'),
        },
        {
          label: 'Уменьшить масштаб',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu:action', 'zoom-out'),
        },
        { type: 'separator' },
        { label: 'Полноэкранный режим', role: 'togglefullscreen' },
        { label: 'Инструменты разработчика', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Справка',
      submenu: [
        {
          label: 'О программе Vector Studio',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'О программе',
              message: 'Vector Studio (AI Illustrator)',
              detail: 'Профессиональный векторный графический редактор нового поколения.\nВерсия: 1.0.0 (Desktop Edition)',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
