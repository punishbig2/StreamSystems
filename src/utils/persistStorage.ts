import { WorkareaStore } from "mobx/stores/workareaStore";
import { User } from "types/user";

const persistKey = "__PERSISTED_STATE__";

export class PersistStorage<T> {
  private user: User | null = null;
  private pendingOperation: number = setTimeout(() => null, 0);

  public async persist(value: { [key: string]: any }): Promise<void> {
    localStorage.setItem(persistKey, JSON.stringify(value));
  }

  public async read(user: User): Promise<WorkareaStore> {
    this.user = user;
    const savedTxt = localStorage.getItem(persistKey);
    if (savedTxt !== null) {
      const rawObject = JSON.parse(savedTxt);
      // Initialize
      return WorkareaStore.fromJson(rawObject);
    } else {
      return new WorkareaStore();
    }
  }

  public getCCYGroup(): string {
    /*const { workarea: root } = this.data;
    if (!root) return "LATAM";
    const {
      workarea: { workarea },
    } = this.data;
    if (!workarea) return "LATAM";
    const { preferences } = workarea;
    if (!preferences) return "LATAM";
    const { ccyGroup } = preferences;
    if (!ccyGroup) return "LATAM";
    if (ccyGroup.trim() === "") return "LATAM";
    return ccyGroup;*/
    return "";
  }
}
