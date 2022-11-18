import { ExecSound } from 'types/user';

const onDBUpgradeNeeded = (event: any): void => {
  const { result } = event.currentTarget;
  result.createObjectStore('list', { keyPath: 'name' });
};

const openDatabase = (onSuccess: (db: IDBDatabase) => void, onError: () => void): void => {
  const request: IDBOpenDBRequest = indexedDB.open('sounds', 1);
  request.onerror = onError;
  request.onsuccess = () => {
    onSuccess(request.result);
  };
  request.onupgradeneeded = onDBUpgradeNeeded;
};

export const addSound = (sound: ExecSound): Promise<void> => {
  return new Promise<void>((resolve: () => void, reject: () => void) => {
    openDatabase((db: IDBDatabase) => {
      const tx: IDBTransaction = db.transaction('list', 'readwrite');
      const list: IDBObjectStore = tx.objectStore('list');
      const request: IDBRequest<IDBValidKey> = list.add(sound);
      request.onsuccess = resolve;
      request.onerror = reject;
    }, reject);
  });
};

export const getSoundsList = async (): Promise<ExecSound[]> => {
  return new Promise((resolve: (sounds: ExecSound[]) => void, reject: () => void) => {
    openDatabase((db: IDBDatabase) => {
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
          })
        ).then((sounds: ExecSound[]) => {
          resolve(sounds);
        });
      };
      keysRequest.onerror = reject;
    }, reject);
  });
};

export const getSound = async (name: string): Promise<ExecSound> => {
  return new Promise((resolve: (sound: ExecSound) => void, reject: () => void) => {
    openDatabase((db: IDBDatabase) => {
      const tx: IDBTransaction = db.transaction('list', 'readwrite');
      const list: IDBObjectStore = tx.objectStore('list');
      const fileRequest: IDBRequest<ExecSound> = list.get(name);
      fileRequest.onsuccess = () => {
        resolve(fileRequest.result);
      };
      fileRequest.onerror = reject;
    }, reject);
  });
};

export const deleteSound = async (name: string): Promise<void> => {
  return new Promise((resolve: () => void, reject: () => void) => {
    openDatabase((db: IDBDatabase) => {
      const tx: IDBTransaction = db.transaction('list', 'readwrite');
      const list: IDBObjectStore = tx.objectStore('list');
      const deleteRequest: IDBRequest<undefined> = list.delete(name);
      deleteRequest.onsuccess = () => {
        resolve();
      };
      deleteRequest.onerror = reject;
    }, reject);
  });
};
