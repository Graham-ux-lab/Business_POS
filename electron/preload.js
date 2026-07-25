const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  printReceipt: (data) => {
    // Custom print handling
    window.print();
  }
});
