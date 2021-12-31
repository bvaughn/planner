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
  length, // Number of monthhs
  month,
  name,
  owner = "team",
}) {
  const task = {
    id,
    month,
    length,
    name,
    owner,
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
  month: 0,
  length: 2.5,
  owner: "bvaughn",
});
createTask({
  name: "Write API documentation",
  month: 2,
  length: 1,
  owner: "susan",
  dependency: "example",
});
createTask({
  name: "Support product team integration",
  month: 2.5,
  length: 2,
  owner: "bvaughn",
  dependency: "example",
  isOngoing: true,
});
createTask({
  name: "Finish project carryover",
  month: 0,
  length: 2,
  owner: "susan",
});
createTask({
  name: "GitHub issue support",
  month: 2,
  length: 1,
  isOngoing: true,
  owner: "team",
});
