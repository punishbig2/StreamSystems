import { action, observable } from "mobx";

const getTheme = (): "dark" | "light" => {
  const cached: string | null = localStorage.getItem("theme");
  if (cached === null) {
    return "dark";
  } else {
    return cached as "dark" | "light";
  }
};

export class ThemeStore {
  @observable theme: "dark" | "light" = "dark";

  constructor() {
    this.theme = getTheme();
  }

  @action.bound
  public setTheme(theme: "dark" | "light") {
    this.theme = theme;
  }
}

export const themeStore = new ThemeStore();
