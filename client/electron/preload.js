const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('businessPosDesktop', {
  platform: process.platform,
});
