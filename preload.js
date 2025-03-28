const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', // This name will be available on window.electronAPI in the renderer process
  {
    // Example: Expose a function to send a message and receive a response
    // We'll define specific channels based on our needs (db, ocr, fs)
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

    // Example: If you need to receive messages pushed from main to renderer
    // on: (channel, listener) => {
    //   ipcRenderer.on(channel, (event, ...args) => listener(...args));
    // },
    // off: (channel, listener) => {
    //   ipcRenderer.removeListener(channel, listener);
    // }

    // --- Define specific API functions based on PLAN.md ---

    // Database operations
    getProjects: () => ipcRenderer.invoke('db:getProjects'),
    addProject: (name) => ipcRenderer.invoke('db:addProject', name),
    getExpenses: (projectId) => ipcRenderer.invoke('db:getExpenses', projectId),
    addExpense: (expenseData) => ipcRenderer.invoke('db:addExpense', expenseData),
    // Add other DB operations as needed (delete, update)

    // OCR operations
    processImageForOCR: (imagePath) => ipcRenderer.invoke('ocr:processImage', imagePath),

    // File System operations
    saveImage: (imageData) => ipcRenderer.invoke('fs:saveImage', imageData), // imageData could be base64 or buffer
    // Add other FS operations if needed (e.g., deleting an image)
  }
);

console.log('preload.js loaded and contextBridge executed.');