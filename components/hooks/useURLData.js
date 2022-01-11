import { useEffect, useMemo, useSyncExternalStore } from "react";
import history from "history/browser";
import { saveSearchToHistory, subscribeToHistory } from "../utils/history";
import { parse, stringify } from "../utils/url";

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

  saveSearchToHistory(stringified);
}

const OG_IMAGE_PROPERTIES = ["og:image", "twitter:image"];
const OG_URL_PROPERTIES = ["og:url", "twitter:url"];

function saveToOpenGraph(stringified) {
  if (stringified === null) {
    return;
  }

  const url = `${window.location.protocol}//${window.location.host}/api/ogimage/?data=${stringified}`;

  OG_IMAGE_PROPERTIES.forEach((name) => {
    const meta = document.head.querySelector(`[property="${name}"]`);
    if (meta) {
      meta.setAttribute("content", url);
    }
  });

  OG_URL_PROPERTIES.forEach((name) => {
    const meta = document.head.querySelector(`[property="${name}"]`);
    if (meta) {
      meta.setAttribute("content", window.location.href);
    }
  });
}

// Params defaultData and validateCallback should both be stable/memoized
export default function useURLData(defaultData) {
  const snapshotString = useSyncExternalStore(subscribeToHistory, getSnapshot);

  const data = useMemo(() => {
    if (snapshotString) {
      try {
        const parsed = parse(snapshotString);

        // Parsed value should be an object.
        // If it's still a string then parsing was unsuccessful.
        if (typeof parsed !== "string") {
          return parsed || defaultData;
        }
      } catch (error) {
        console.error(error);
      }
    }
    return defaultData;
  }, [defaultData, snapshotString]);

  // Update the og:image to match chart data.
  useEffect(() => {
    const stringToSAve = snapshotString || stringify(defaultData);
    saveToOpenGraph(stringToSAve);
  }, [defaultData, snapshotString]);

  // No need to mirror in React state; just save to the location.
  // This will trigger a re-render via the useSyncExternalStore subscription.
  const setData = saveToLocation;

  return [data, setData];
}
