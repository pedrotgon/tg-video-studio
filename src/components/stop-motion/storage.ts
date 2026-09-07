import { parseProject, Project } from './model';
const DB = 'tg-stop-motion';
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Não foi possível abrir o armazenamento do dispositivo.'));
  });
}
export async function saveProject(project: Project): Promise<void> {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    transaction.objectStore('projects').put(project, 'current');
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(new Error('Não foi possível salvar. Baixe o projeto para guardar uma cópia.'));
  }); } finally { db.close(); }
}
export async function loadProject(): Promise<Project | null> {
  const db = await database();
  try { const value = await new Promise<unknown>((resolve, reject) => {
    const request = db.transaction('projects').objectStore('projects').get('current');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  }); return value ? parseProject(value) : null; } finally { db.close(); }
}
