import history from "history/browser";

const CUSTOM_CHANGE_EVENT_TYPE = "sync-external-store-changed";

// Max index is an in-memory value,
// because it shouldn't change as we step backwards in history-
// only as we push new items to history.
let maxIndex = getCurrentIndex();

export function getCurrentIndex() {
  return history.location.state?.index || 0;
}

export function getMaxIndex() {
  return maxIndex;
}

export function saveSearchToHistory(newSearch) {
  let prevSearch = history.location.search;
  if (prevSearch) {
    // Remove the leading "?"
    prevSearch = prevSearch.substr(1);

    // Nested apostrophes are auto escaped by the "history" library,
    // e.g. "jsurl2" serializes `team's` to `team*"s` which "history" converts to `team*%22s`.
    // We need to manually undo this conversion before comparing new search strings to current ones.
    prevSearch = prevSearch.replace(/\*%22/g, '*"');

    // Don't push a new History entry if the search string hasn't changed.
    if (prevSearch === newSearch) {
      return;
    }
  }

  const currentIndex = getCurrentIndex();

  // Saving a new URL always throws away history after the current state.
  maxIndex = currentIndex + 1;

  history.push({ search: newSearch }, { index: currentIndex + 1 });

  // History API events aren't dispatched when JS changes the history,
  // so we use our own event type to signal a re-render is needed.
  window.dispatchEvent(new Event(CUSTOM_CHANGE_EVENT_TYPE));
}

export function subscribeToHistory(callback) {
  return history.listen(callback);
}
