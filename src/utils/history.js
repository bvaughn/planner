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

export function saveSearchToHistory(search) {
  if (history.location.search === `?${search}`) {
    // Don't push a new History entry if the search string hasn't changed.
    return;
  }

  const currentIndex = getCurrentIndex();

  // Saving a new URL always throws away history after the current state.
  maxIndex = currentIndex + 1;

  history.push({ search }, { index: currentIndex + 1 });

  // History API events aren't dispatched when JS changes the history,
  // so we use our own event type to signal a re-render is needed.
  window.dispatchEvent(new Event(CUSTOM_CHANGE_EVENT_TYPE));
}

export function subscribeToHistory(callback) {
  return history.listen(callback);
}
