export function getNextID(tasks) {
  return tasks.reduce((curentID, task) => {
    if (task.id != null && task.id >= curentID) {
      curentID = task.id + 1;
    }
    return curentID;
  }, 0);
}

export function getOwnerName(task, team) {
  const owner = team[task.owner];
  const ownerName = owner?.name || task.owner || "Team";
  return ownerName.toLowerCase();
}
