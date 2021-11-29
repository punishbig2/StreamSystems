import { API } from "API";
import { WorkareaStore } from "mobx/stores/workareaStore";
import { User } from "types/user";

export class PersistStorage {
  private readonly user: User | null = null;
  private pendingOperation = setTimeout(() => null, 0);

  constructor(user: User) {
    this.user = user;
  }

  public async persist(value: { [key: string]: any }): Promise<void> {
    const { user } = this;
    clearTimeout(this.pendingOperation);
    this.pendingOperation = setTimeout((): void => {
      API.saveUserProfile({
        workspace: JSON.stringify(value),
        useremail: user!.email,
      });
    }, 400);
  }

  public async read(): Promise<WorkareaStore> {
    const { user } = this;
    const data: any = await API.getUserProfile(user!.email);
    if (data.length === 0) return new WorkareaStore();
    try {
      if (typeof data[0].workspace !== "string") return new WorkareaStore();
      const workarea = JSON.parse(data[0].workspace);
      // Initialize
      return WorkareaStore.fromJson(workarea);
    } catch {
      return new WorkareaStore();
    }
  }
}
