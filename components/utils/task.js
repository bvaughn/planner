export function getNextID(tasks) {
  return tasks.reduce((curentID, task) => {
    if (task.id != null && task.id >= curentID) {
      curentID = task.id + 1;
    }
    return curentID;
  }, 0);
}

export function getOwnerNames(task, team) {
  if (!Array.isArray(task.owner)) {
    return getOwnerName(task.owner, team);
  }

  if (task.owner.length === 0) {
    return "";
  }

  const ownersNames = task.owner.map((ownerKey) =>
    getOwnerName(ownerKey, team)
  );
  switch (ownersNames.length) {
    case 1:
      return ownersNames[0];
    case 2:
      return ownersNames.join(" and ");
    default:
      const lastName = ownersNames.pop();
      return `${ownersNames.join(", ")}, and ${lastName}`;
  }
}

function getOwnerName(ownerKey, team) {
  const owner = team[ownerKey];
  const ownerName = owner?.name || ownerKey || "Team";
  return ownerName.toLowerCase();
}

export function getPrimaryOwnerName(task, team) {
  const primaryOwnerKey = Array.isArray(task.owner)
    ? task.owner[0]
    : task.owner;

  return getOwnerName(primaryOwnerKey, team);
}
