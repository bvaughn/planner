export const tasks = [
  {
    id: 1,
    start: "2022-01-01",
    stop: "2022-03-15",
    name: "Planner JS",
    owner: "planner",
  },
  {
    start: "2022-01-15",
    stop: "2022-05-30",
    name: "Plan and share your next project in minutes",
    isOngoing: true,
    owner: "team",
  },
  {
    start: "2022-02-01",
    stop: "2022-05-01",
    name: "Lightweight ightweight planning tool",
    dependency: 1,
    owner: "planner",
  },
];

export const team = {
  planner: {
    name: "Planner JS",
    color: "#543e5b",
    avatar: "/avatar.png",
  },
  team: {
    name: "Your team",
    color: "#22223B",
  },
};

export const defaultData = { tasks, team };
