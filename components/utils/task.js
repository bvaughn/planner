export function getOwnerName(task, team) {
  const owner = team[task.owner];
  const ownerName = owner?.name || task.owner || "Team";
  return ownerName.toLowerCase();
}
