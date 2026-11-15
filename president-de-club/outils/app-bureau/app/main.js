const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('enable-gpu-rasterization');
function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 900, minHeight: 640,
    title: 'Président de Club', backgroundColor: '#0c1410',
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: false, backgroundThrottling: false }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}
const template = [
  { label: 'Président de Club', submenu: [{ role: 'about', label: 'À propos de Président de Club' }, { type: 'separator' }, { role: 'hide', label: 'Masquer' }, { role: 'hideOthers', label: 'Masquer les autres' }, { type: 'separator' }, { role: 'quit', label: 'Quitter' }] },
  { label: 'Édition', submenu: [{ role: 'undo', label: 'Annuler' }, { role: 'redo', label: 'Rétablir' }, { type: 'separator' }, { role: 'cut', label: 'Couper' }, { role: 'copy', label: 'Copier' }, { role: 'paste', label: 'Coller' }, { role: 'selectAll', label: 'Tout sélectionner' }] },
  { label: 'Affichage', submenu: [{ role: 'reload', label: 'Recharger' }, { type: 'separator' }, { role: 'resetZoom', label: 'Taille réelle' }, { role: 'zoomIn', label: 'Zoom avant' }, { role: 'zoomOut', label: 'Zoom arrière' }, { type: 'separator' }, { role: 'togglefullscreen', label: 'Plein écran' }] },
  { label: 'Fenêtre', submenu: [{ role: 'minimize', label: 'Réduire' }, { role: 'close', label: 'Fermer' }] }
];
app.whenReady().then(() => { Menu.setApplicationMenu(Menu.buildFromTemplate(template)); createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => app.quit());
