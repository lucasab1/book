import { Project, Chapter } from "./types";

const PROJECTS_KEY = "bookmoth_projects";
const API_KEY_KEY = "bookmoth_api_key";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.push(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function saveChapter(projectId: string, chapter: Chapter): void {
  const project = getProject(projectId);
  if (!project) return;
  const idx = project.chapters.findIndex((c) => c.id === chapter.id);
  if (idx >= 0) {
    project.chapters[idx] = { ...chapter, updatedAt: new Date().toISOString() };
  } else {
    project.chapters.push(chapter);
  }
  saveProject(project);
}

export function deleteChapter(projectId: string, chapterId: string): void {
  const project = getProject(projectId);
  if (!project) return;
  project.chapters = project.chapters.filter((c) => c.id !== chapterId);
  saveProject(project);
}

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_KEY) || "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
