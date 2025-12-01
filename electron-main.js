"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
// Detectar se está em modo desenvolvimento
const isDev = (process.env.NODE_ENV === 'development' || process.defaultApp || (typeof electron_1.app !== 'undefined' && !electron_1.app.isPackaged));
let mainWindow = null;
const createWindow = () => {
    // Create the browser window but keep it hidden until ready-to-show
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets/icon.png'),
    });
    // Em desenvolvimento o Vite está configurado para rodar na porta 5000 (script `dev:client`).
    // Ajuste aqui se você mudou a porta do Vite.
    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5000';
    const startUrl = isDev ? devUrl : `file://${path.join(__dirname, 'dist/public/index.html')}`;
    // Log para debug
    console.log('[electron] isDev=', isDev);
    console.log('[electron] process.env.ELECTRON_START_URL=', process.env.ELECTRON_START_URL);
    console.log('[electron] devUrl=', devUrl);
    console.log('[electron] startUrl=', startUrl);
    // Tenta carregar o startUrl e adiciona listeners de diagnóstico
    mainWindow.loadURL(startUrl).catch((err) => {
        console.error('[electron] loadURL failed:', err);
    });
    mainWindow.webContents.once('did-finish-load', async () => {
        console.log('[electron] did-finish-load', startUrl);
        try {
            const url = mainWindow?.webContents.getURL();
            console.log('[electron] renderer URL:', url);
            const snippet = await mainWindow?.webContents.executeJavaScript('document.documentElement.innerHTML.slice(0,1000)');
            console.log('[electron] renderer DOM snippet:', snippet);
        }
        catch (e) {
            console.error('[electron] error reading renderer DOM:', e);
        }
    });
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('[electron] did-fail-load', { errorCode, errorDescription, validatedURL });
        try {
            mainWindow?.loadURL(`data:text/html,<h2>Falha ao carregar a aplicação</h2><pre>${errorDescription}</pre>`);
        }
        catch (e) {
            console.error('[electron] erro ao carregar pagina de erro', e);
        }
    });
    mainWindow.webContents.on('dom-ready', () => {
        console.log('[electron] dom-ready');
    });
    // Pipe renderer console messages to main process logs
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[renderer console] [level:${level}] ${message} (line:${line}) source:${sourceId}`);
    });
    // Detect render process crashes or termination
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        console.error('[electron] render-process-gone', details);
    });
    mainWindow.on('unresponsive', () => {
        console.error('[electron] window unresponsive');
    });
    mainWindow.on('closed', () => {
        console.error('[electron] window crashed');
    });
    // Abrir DevTools sempre (para diagnóstico em dev local)
    try {
        mainWindow.webContents.openDevTools({ mode: 'right' });
    }
    catch (e) {
        console.error('[electron] openDevTools failed', e);
    }
    // Mostrar janela quando estiver pronta
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// Create application menu
const createMenu = () => {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Sair',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    },
                },
            ],
        },
        {
            label: 'Editar',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
            ],
        },
        {
            label: 'Visualizar',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
};
electron_1.app.on('ready', createMenu);
