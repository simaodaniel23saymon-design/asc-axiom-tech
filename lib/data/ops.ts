export type TaskPriority = "High" | "Medium" | "Low";

export const dashboardSummary = [
  { label: "Operational health", value: "92%", delta: "+6.2% vs last month" },
  { label: "Active goals", value: "7", delta: "3 on track" },
  { label: "Milestones due", value: "4", delta: "2 in review" },
  { label: "Investor updates", value: "3", delta: "1 ready to send" },
];

export const tasks = [
  { title: "Finalize NZoCHAIN product narrative", owner: "Product", priority: "High", due: "Today" },
  { title: "Validate onboarding flow for enterprise pilots", owner: "Engineering", priority: "High", due: "Tomorrow" },
  { title: "Prepare investor memo for Q3 review", owner: "Strategy", priority: "Medium", due: "Friday" },
  { title: "Align security intelligence briefings", owner: "Operations", priority: "Low", due: "Next week" },
];

export const goals = [
  { title: "Make NZoCHAIN investor-ready", progress: 78, target: "Board and investor materials live" },
  { title: "Launch enterprise pilot layer", progress: 64, target: "3 pilot companies engaged" },
  { title: "Operationalize internal command center", progress: 82, target: "Weekly execution cadence active" },
  { title: "Build strategic narrative and content system", progress: 57, target: "Three messaging pillars validated" },
];

export const projects = [
  { name: "NZoCHAIN Platform", status: "In motion", owner: "Product & Engineering", milestone: "Investor-readiness sprint" },
  { name: "Investor Briefing Pack", status: "Review", owner: "Strategy", milestone: "Board pack finalization" },
  { name: "Security Intelligence Layer", status: "Planning", owner: "Research", milestone: "Threat model sign-off" },
  { name: "Operations Dashboard", status: "Live", owner: "Ops", milestone: "Weekly KPI review" },
];

export const roadmap = [
  { phase: "Q3", title: "Narrative and product validation", status: "In progress" },
  { phase: "Q4", title: "Pilot expansion and security proof points", status: "Planned" },
  { phase: "Q1", title: "Commercial readiness and partner pipeline", status: "Planned" },
];

export const teamMembers = [
  { name: "Afonso Costa", role: "CEO", focus: "Company direction and NZoCHAIN narrative" },
  { name: "Nuno Silva", role: "Product Lead", focus: "Product strategy and roadmap" },
  { name: "Anita Martins", role: "Engineering", focus: "Platform delivery and architecture" },
  { name: "Marta Dias", role: "Operations", focus: "Execution, reporting, investor comms" },
];

export const activities = [
  { time: "09:20", text: "Investor memo draft was updated with new NZoCHAIN framing." },
  { time: "11:45", text: "Engineering closed the onboarding issue backlog for pilot users." },
  { time: "14:10", text: "Procedures were reviewed for the weekly strategic operating review." },
  { time: "Today", text: "Board-ready narrative pack moved into final approval." },
];
