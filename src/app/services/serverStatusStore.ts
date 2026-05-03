export type ServerStatus = "connected" | "disconnected";

type Listener = () => void;

interface ServerState {
  status: ServerStatus;
  lastErrorMessage: string | null;
}

const state: ServerState = {
  status: "connected",
  lastErrorMessage: null,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const serverStatusStore = {
  getSnapshot: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  markConnected: () => {
    if (state.status !== "connected" || state.lastErrorMessage) {
      state.status = "connected";
      state.lastErrorMessage = null;
      emit();
    }
  },
  markDisconnected: (message: string) => {
    if (state.status !== "disconnected" || state.lastErrorMessage !== message) {
      state.status = "disconnected";
      state.lastErrorMessage = message;
      emit();
    }
  },
};
