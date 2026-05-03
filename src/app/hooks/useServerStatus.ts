import { useSyncExternalStore } from "react";
import { serverStatusStore } from "../services/serverStatusStore";

export function useServerStatus() {
  return useSyncExternalStore(
    serverStatusStore.subscribe,
    serverStatusStore.getSnapshot,
    serverStatusStore.getSnapshot
  );
}
