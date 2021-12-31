import { useCallback, useLayoutEffect, useState } from "react";

function saveToLocation(data) {
  const string = JSON.stringify(data);
  const encoded = window.btoa(string);
  window.location.hash = `encoded=${encoded}`;
}

export function useURLData(initialData, validateCallback) {
  const [data, setData] = useState(initialData);

  const setDataWrapper = (newData) => {
    if (validateCallback(newData)) {
      saveToLocation(newData);
      setData(newData);
    }
  };

  useLayoutEffect(() => {
    function parseDataFromLocation() {
      try {
        let hash = window.location.hash;
        hash = hash.substring(1); // Remove leading "#"

        const params = new URLSearchParams(hash);
        if (params.has("encoded")) {
          const encoded = params.get("encoded");
          const decoded = window.atob(encoded);
          const parsed = JSON.parse(decoded);

          if (validateCallback(parsed)) {
            setDataWrapper(parsed);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    // Initialize on-load.
    parseDataFromLocation();

    window.addEventListener("hashchange", parseDataFromLocation);

    return () => {
      window.removeEventListener("hashchange", parseDataFromLocation);
    };
  }, []);

  return [data, setDataWrapper];
}
