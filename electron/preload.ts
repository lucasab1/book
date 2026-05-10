import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  openProjectFolder: () => ipcRenderer.invoke("open-project-folder"),
});
