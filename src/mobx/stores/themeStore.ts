import { action, computed, observable } from "mobx";

export class ThemeStore {
  @observable theme: "dark" | "light" = "dark";
  @observable localFontFamily: string;
  @observable localFontSize: string;

  constructor() {
    this.theme = "dark";
    this.localFontFamily = "Default";
    this.localFontSize = "normal";
  }

  @computed
  public get fontSize(): number {
    switch (this.localFontSize) {
      case "smaller":
        return 10;
      case "small":
        return 12;
      case "normal":
        return 15;
      case "medium":
        return 16;
      case "large":
        return 18;
      case "larger":
        return 20;
      case "huge":
        return 22;
      default:
        return 15;
    }
  }

  @computed
  public get fontFamily(): string {
    if (this.localFontFamily === "Default") {
      return "sans-serif";
    } else {
      return this.localFontFamily;
    }
  }

  @action.bound
  public setTheme(theme: "dark" | "light"): void {
    this.theme = theme;
  }

  @action.bound
  public setFontSize(fontSize: string): void {
    this.localFontSize = fontSize;
  }

  @action.bound
  public setFontFamily(fontFamily: string): void {
    this.localFontFamily = fontFamily;
  }
}

export const themeStore = new ThemeStore();
