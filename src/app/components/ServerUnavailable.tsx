import { RefreshCcw, ServerCrash } from "lucide-react";
import { useServerStatus } from "../hooks/useServerStatus";

export default function ServerUnavailable() {
  const { status, lastErrorMessage } = useServerStatus();

  if (status === "connected") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <ServerCrash className="text-red-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white">Server not available</h1>
        <p className="mt-3 text-slate-300">
          The app cannot reach the central LAN server. Please make sure the server machine is online
          and the API base URL is correct.
        </p>
        {lastErrorMessage ? (
          <p className="mt-4 rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
            Error: {lastErrorMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"
        >
          <RefreshCcw size={18} />
          Retry connection
        </button>
      </div>
    </div>
  );
}
