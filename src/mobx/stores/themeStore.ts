import { action, computed, makeObservable, observable } from 'mobx';

export class ThemeStore {
  public theme: 'dark' | 'light' = 'dark';
  public localFontFamily: string;
  public localFontSize: string;

  constructor() {
    this.theme = 'dark';
    this.localFontFamily = 'Default';
    this.localFontSize = 'normal';

    makeObservable(this, {
      theme: observable,
      localFontFamily: observable,
      localFontSize: observable,
      fontSize: computed,
      fontFamily: computed,
      setTheme: action.bound,
      setFontSize: action.bound,
      setFontFamily: action.bound,
    });
  }

  public get fontSize(): number {
    switch (this.localFontSize) {
      case 'smaller':
        return 10;
      case 'small':
        return 12;
      case 'normal':
        return 15;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      case 'larger':
        return 20;
      case 'huge':
        return 22;
      default:
        return 15;
    }
  }

  public get fontFamily(): string {
    if (this.localFontFamily === 'Default') {
      return 'sans-serif';
    } else {
      return this.localFontFamily;
    }
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this.theme = theme;
  }

  public setFontSize(fontSize: string): void {
    this.localFontSize = fontSize;
  }

  public setFontFamily(fontFamily: string): void {
    this.localFontFamily = fontFamily;
  }
}

export const themeStore = new ThemeStore();
