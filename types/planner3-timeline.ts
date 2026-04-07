export type Planner3TimelineEvent = {
  id: string;
  title: string;
  why: string;
  how: string;
  when: string;
};

export type Planner3TimelineState = {
  events: Planner3TimelineEvent[];
};
