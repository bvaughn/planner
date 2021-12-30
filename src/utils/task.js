export function getOwnerName(task, owners) {
  const owner = owners[task.owner];
  const ownerName = owner?.name || task.owner || "Team";
  return ownerName.toLowerCase();
}
