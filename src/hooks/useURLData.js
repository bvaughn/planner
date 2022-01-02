import { useMemo, useSyncExternalStore } from "react";
import { parse, stringify } from "jsurl2";
import history from "history/browser";
import { saveSearchToHistory, subscribeToHistory } from "../utils/history";

function getSnapshot() {
  try {
    const search = history.location.search;
    if (search) {
      return search.substr(1);
    }
  } catch (error) {
    console.error(error);
  }
  return null;
}

function saveToLocation(data) {
  const stringified = stringify(data);

  // Nested apostrophes cause "jsurl2" to throw a parsing error:
  //   Error: Illegal escape code.
  // For now, we have to manually escape them.
  const escaped = stringified.replace(/\*"/g, "%27");

  saveSearchToHistory(escaped);
}

// Params defaultData and validateCallback should both be stable/memoized
export default function useURLData(defaultData) {
  const snapshotString = useSyncExternalStore(subscribeToHistory, getSnapshot);

  const data = useMemo(() => {
    if (snapshotString) {
      try {
        // See comment in saveToLocation()
        const unescaped = snapshotString.replace(/%27/g, '*"');
        const parsed = parse(unescaped);
        return parsed || defaultData;
      } catch (error) {
        console.error(error);
      } finally {
      }
    }
    return defaultData;
  }, [defaultData, snapshotString]);

  // No need to mirror in React state; just save to the location.
  // This will trigger a re-render via the useSyncExternalStore subscription.
  const setData = saveToLocation;

  return [data, setData];
}
