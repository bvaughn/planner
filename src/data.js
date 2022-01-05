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
  id = uidCounter++,
  isOngoing = false,
  name,
  owner = "team",
  start,
  stop,
}) {
  const task = {
    id,
    name,
    owner,
    start,
    stop,
  };

  // These fields are added conditionally so they don't show up in the editable text input.

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
  start: "2022-01-01",
  stop: "2022-03-15",
  owner: "bvaughn",
});
createTask({
  name: "Write API documentation",
  start: "2022-03-01",
  stop: "2022-05-01",
  duration: 1,
  owner: "susan",
  dependency: "example",
});
createTask({
  name: "Support product team integration",
  start: "2022-03-15",
  stop: "2022-05-15",
  duration: 2,
  owner: "bvaughn",
  dependency: "example",
  isOngoing: true,
});
createTask({
  name: "Finish project carryover",
  start: "2022-01-01",
  stop: "2022-03-01",
  duration: 2,
  owner: "susan",
});
createTask({
  name: "GitHub issue support",
  start: "2022-03-01",
  stop: "2022-04-01",
  isOngoing: true,
  owner: "team",
});
