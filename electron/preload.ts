import { contextBridge, ipcRenderer } from "electron";

const api = {
  platform: process.platform as string,

  // Project management
  projectGetPath: () => ipcRenderer.invoke("project:getPath"),
  projectGetRecents: () => ipcRenderer.invoke("project:getRecents"),
  projectPickFolder: () => ipcRenderer.invoke("project:pickFolder"),
  projectCreate: (folderPath: string, meta: { title: string; genre: string; synopsis: string }) =>
    ipcRenderer.invoke("project:create", folderPath, meta),
  projectOpen: (folderPath: string) => ipcRenderer.invoke("project:open", folderPath),
  projectOpenFolder: () => ipcRenderer.invoke("project:openFolder"),
  projectOpenTerminal: () => ipcRenderer.invoke("project:openTerminal"),
  projectGet: () => ipcRenderer.invoke("project:get"),
  projectSet: (data: object) => ipcRenderer.invoke("project:set", data),

  // Chapters
  chaptersList: () => ipcRenderer.invoke("chapters:list"),
  chaptersGet: (slug: string) => ipcRenderer.invoke("chapters:get", slug),
  chaptersCreate: (data: { title: string; brief?: string }) => ipcRenderer.invoke("chapters:create", data),
  chaptersSave: (slug: string, content: string, meta?: Record<string, string>) =>
    ipcRenderer.invoke("chapters:save", slug, content, meta),
  chaptersDelete: (slug: string) => ipcRenderer.invoke("chapters:delete", slug),

  // Knowledge base
  kbList: () => ipcRenderer.invoke("kb:list"),
  kbGet: (kbPath: string) => ipcRenderer.invoke("kb:get", kbPath),
  kbSave: (kbPath: string, content: string) => ipcRenderer.invoke("kb:save", kbPath, content),
  kbDelete: (kbPath: string) => ipcRenderer.invoke("kb:delete", kbPath),
  kbCreate: (kbPath: string, name: string) => ipcRenderer.invoke("kb:create", kbPath, name),

  // Entities
  entitiesList: (type?: string) => ipcRenderer.invoke("entities:list", type),
  entitiesGet: (id: string) => ipcRenderer.invoke("entities:get", id),
  entitiesSave: (entity: object) => ipcRenderer.invoke("entities:save", entity),
  entitiesDelete: (id: string) => ipcRenderer.invoke("entities:delete", id),

  // Relationships
  relationshipsList: (entityId?: string) => ipcRenderer.invoke("relationships:list", entityId),
  relationshipsCreate: (rel: object) => ipcRenderer.invoke("relationships:create", rel),
  relationshipsDelete: (id: string) => ipcRenderer.invoke("relationships:delete", id),

  // Assets
  assetsList: (entityId?: string) => ipcRenderer.invoke("assets:list", entityId),
  assetsSave: (meta: object, buffer: ArrayBuffer, filename: string, subdir: string) =>
    ipcRenderer.invoke("assets:save", meta, buffer, filename, subdir),
  assetsDelete: (id: string) => ipcRenderer.invoke("assets:delete", id),

  // Providers
  providersGet: () => ipcRenderer.invoke("providers:get"),
  providersSet: (config: object) => ipcRenderer.invoke("providers:set", config),
  providersCheck: (providerId: string) => ipcRenderer.invoke("providers:check", providerId),

  // Import
  importPickFiles: (filters: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke("import:pickFiles", filters),
  importChapters: (filePaths: string[]) => ipcRenderer.invoke("import:chapters", filePaths),
  importAssets: (filePaths: string[]) => ipcRenderer.invoke("import:assets", filePaths),

  // Claude Code (legacy single-provider)
  claudeRun: (message: string) => ipcRenderer.invoke("claude:run", message),
  claudeCheckInstalled: () => ipcRenderer.invoke("claude:checkInstalled"),
  claudeOnChunk: (cb: (text: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, text: string) => cb(text);
    ipcRenderer.on("claude:chunk", handler);
    return () => ipcRenderer.removeListener("claude:chunk", handler);
  },

  // Multi-provider AI runner
  aiRun: (provider: string, message: string) => ipcRenderer.invoke("ai:run", provider, message),
  aiCheckInstalled: () => ipcRenderer.invoke("ai:checkInstalled"),
  aiOnChunk: (cb: (text: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, text: string) => cb(text);
    ipcRenderer.on("ai:chunk", handler);
    return () => ipcRenderer.removeListener("ai:chunk", handler);
  },
  aiOnStart: (cb: (data: { pid: number }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { pid: number }) => cb(data);
    ipcRenderer.on("ai:start", handler);
    return () => ipcRenderer.removeListener("ai:start", handler);
  },
  aiSendInput: (pid: number, text: string) => ipcRenderer.send("ai:input", { pid, text }),
};

contextBridge.exposeInMainWorld("api", api);

export type ElectronAPI = typeof api;
