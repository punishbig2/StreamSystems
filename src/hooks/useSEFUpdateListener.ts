import { MOStatus } from "mobx/stores/moStore";
import { SEF_UPDATE_EVENT } from "signalR/signalRManager";

export const useSEFUpdateListener = (setStatus: (status: MOStatus) => void) => {
  const listener = () => {
    setStatus(MOStatus.Normal);
  };
  document.addEventListener(SEF_UPDATE_EVENT, listener);
  return () => {
    document.removeEventListener(SEF_UPDATE_EVENT, listener);
  };
};
