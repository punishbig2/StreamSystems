import {ExecSound} from 'interfaces/user';

export const addSound = (sound: ExecSound) => {
  return new Promise((resolve: () => void, reject: () => void) => {
    const request: IDBOpenDBRequest = indexedDB.open('sounds', 1);
    request.onerror = () => {
      reject();
    };
    request.onsuccess = () => {
      const db: IDBDatabase = request.result;
      const tx: IDBTransaction = db.transaction('list', 'readwrite');
      const list: IDBObjectStore = tx.objectStore('list');
      const _request: IDBRequest<IDBValidKey> = list.add(sound);
      _request.onsuccess = resolve;
      _request.onerror = reject;
    };
    request.onupgradeneeded = (event: any) => {
      const {result} = event.currentTarget;
      result.createObjectStore('list', {keyPath: 'name'});
    };
  });
};

export const getSoundsList = async (): Promise<ExecSound[]> => {
  return new Promise((resolve: (sounds: ExecSound[]) => void, reject: () => void) => {
    const request: IDBOpenDBRequest = indexedDB.open('sounds', 1);
    request.onerror = () => {
      reject();
    };
    request.onsuccess = () => {
      const db: IDBDatabase = request.result;
      const tx: IDBTransaction = db.transaction('list', 'readwrite');
      const list: IDBObjectStore = tx.objectStore('list');
      const keysRequest: IDBRequest<IDBValidKey[]> = list.getAllKeys();
      keysRequest.onsuccess = () => {
        const keys: IDBValidKey[] = keysRequest.result;
        Promise.all(
          keys.map((key: IDBValidKey): Promise<ExecSound> => {
            return new Promise((resolve: (sound: ExecSound) => void, reject) => {
              const finalRequest: IDBRequest<any | undefined> = list.get(key);
              finalRequest.onerror = reject;
              finalRequest.onsuccess = () => {
                resolve(finalRequest.result);
              };
            });
          }),
        ).then((sounds: ExecSound[]) => {
          resolve(sounds);
        });
      };
      keysRequest.onerror = reject;
    };
    request.onupgradeneeded = (event: any) => {
      const {result} = event.currentTarget;
      result.createObjectStore('list', {keyPath: 'name'});
    };
  });
};

export const getSound = async (name: string): Promise<ExecSound> => {
  return new Promise((resolve: (sound: ExecSound) => void, reject: () => void) => {
    const request: IDBOpenDBRequest = indexedDB.open('sounds', 1);
    request.onerror = () => {
      reject();
    };
    request.onsuccess = () => {
      const db: IDBDatabase = request.result;
      const tx: IDBTransaction = db.transaction('list', 'readwrite');
      const list: IDBObjectStore = tx.objectStore('list');
      const fileRequest: IDBRequest<ExecSound> = list.get(name);
      fileRequest.onsuccess = () => {
        resolve(fileRequest.result);
      };
      fileRequest.onerror = reject;
    };
    request.onupgradeneeded = (event: any) => {
      const {result} = event.currentTarget;
      result.createObjectStore('list', {keyPath: 'name'});
    };
  });
};
