import { contextBridge, ipcRenderer } from "electron";

const api = {
  platform: process.platform as string,

  // Project
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
};

contextBridge.exposeInMainWorld("api", api);

export type ElectronAPI = typeof api;
