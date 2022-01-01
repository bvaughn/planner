export const team = {
  bvaughn: {
    avatar: "https://avatars.githubusercontent.com/u/29597",
    name: "Brian",
  },
  team: {
    avatar: null,
    name: "Unclaimed",
  },
};

export const tasks = [];

let uidCounter = 0;

function createTask({
  dependency, // Task (id) that blocks this one
  duration, // Number of months
  id = uidCounter++,
  isOngoing = false,
  name,
  owner = "team",
  start, // Index of month (0-based)
}) {
  const task = {
    duration,
    id,
    name,
    owner,
    start,
  };

  if (isOngoing) {
    task.isOngoing = true;
  }

  if (dependency) {
    task.dependency = dependency;
  }

  tasks.push(task);
}

createTask({
  id: "example",
  name: "Design API",
  start: 0,
  duration: 2.5,
  owner: "bvaughn",
});
createTask({
  name: "Write API documentation",
  start: 2,
  duration: 1,
  owner: "susan",
  dependency: "example",
});
createTask({
  name: "Support product team integration",
  start: 2.5,
  duration: 2,
  owner: "bvaughn",
  dependency: "example",
  isOngoing: true,
});
createTask({
  name: "Finish project carryover",
  start: 0,
  duration: 2,
  owner: "susan",
});
createTask({
  name: "GitHub issue support",
  start: 2,
  duration: 1,
  isOngoing: true,
  owner: "team",
});
