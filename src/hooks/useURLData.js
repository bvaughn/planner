import { useMemo, useSyncExternalStore } from "react";

function getSnapshot() {
  // Return the current hash, minus the leading "#"
  return window.location.hash.substring(1);
}

function saveToHash(data) {
  const string = JSON.stringify(data);
  const encoded = window.btoa(string);

  window.location.hash = `encoded=${encoded}`;
}

function subscribe(callback) {
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
  };
}

// Params defaultData and validateCallback should both be stable/memoized
export default function useURLData(defaultData) {
  const hash = useSyncExternalStore(subscribe, getSnapshot);

  const data = useMemo(() => {
    try {
      const params = new URLSearchParams(hash);
      if (params.has("encoded")) {
        const encoded = params.get("encoded");
        const decoded = window.atob(encoded);
        return JSON.parse(decoded);
      }
    } catch (error) {
      console.error(error);
    }
    return defaultData;
  }, [hash, defaultData]);

  // No need to mirror in React state; just save to the hash.
  // This will trigger a re-render via the useSyncExternalStore subscription.
  const setData = saveToHash;

  return [data, setData];
}
