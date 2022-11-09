export interface TimezoneInfo {
  text: string;
}

declare global {
  namespace Intl {
    function supportedValuesOf(key: string): any;
  }
}

const iannaTimeZones = Intl.supportedValuesOf("timeZone");

export default iannaTimeZones
  .sort((a: string, b: string) => a.localeCompare(b))
  .map((text: string) => ({ text } as TimezoneInfo));
