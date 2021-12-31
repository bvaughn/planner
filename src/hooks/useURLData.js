import { useMemo, useSyncExternalStore } from "react";
import history from "history/browser";
import { saveSearchToHistory, subscribeToHistory } from "../utils/history";

function getSnapshot() {
  try {
    const search = history.location.search;
    if (search) {
      return window.atob(search.substr(1));
    }
  } catch (error) {
    console.error(error);
  }
  return null;
}

function saveToLocation(data) {
  const string = JSON.stringify(data);
  const encoded = window.btoa(string);

  saveSearchToHistory(encoded);
}

// Params defaultData and validateCallback should both be stable/memoized
export default function useURLData(defaultData) {
  const snapshot = useSyncExternalStore(subscribeToHistory, getSnapshot);

  const data = useMemo(() => {
    try {
      const parsed = JSON.parse(snapshot);
      return parsed || defaultData;
    } catch (error) {
      console.error(error);
    } finally {
    }
    return defaultData;
  }, [defaultData, snapshot]);

  // No need to mirror in React state; just save to the location.
  // This will trigger a re-render via the useSyncExternalStore subscription.
  const setData = saveToLocation;

  return [data, setData];
}
