import { contextBridge, ipcMain } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcSend: (channel: string, data: any) => {
    // whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcMain.send(channel, data);
    }
  },
  ipcOn: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcMain.on(channel, (event, ...args) => func(...args));
    }
  },
});
