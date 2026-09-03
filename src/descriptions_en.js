// English descriptions for cost modules and behavioral metrics

// Source interpret() figures from the model (see descriptions.js for rationale)
// so the UI text never drifts from computeCosts().
import {
  getMetricValue,
  alphaFromSafety,
  K_SIGMOID_DEFAULT_MULT,
  LEADER_SILENCE_FREQ_MULT,
} from "./logic.js";

export const COST_DESCRIPTIONS_EN = {
  errors: {
    title: "Error Concealment",
    what: "Employees who fear consequences hide errors instead of reporting them. The longer an error stays hidden, the more expensive it becomes to fix, on average 3.5x more than with immediate detection.",
    mechanism: "Blame culture (72% in low-PS teams vs 2% in high-PS) teaches employees survival strategies: 'better hide the problem than risk punishment'. This is tactical silence, a conscious cost-benefit calculation of speaking up (Adamska 2016). Errors accumulate, and when they finally surface, repair costs are multiples higher.",
    example: "A manager of one supermarket-chain location hid a mistake out of fear, ordering 100 instead of 10 pallets of sour cream. Baggage from a previous employer: 'deal with it yourself, or face punishment' (anonymous case from manuscript §12.1).",
    tceConnection: "When people don't report errors voluntarily, the company must build expensive control systems (audits, inspections, approval layers). Less trust = more expensive monitoring.",
    interpret: (params, value) => `In your company (${params.employees} employees, safety: ${params.safety}) error concealment costs ${Math.round(value / 1000)}k PLN/year, or ${Math.round(value / params.employees)} PLN per employee. The model includes 4 problem categories, critical errors have higher late-detection multipliers (up to 6x).`,
  },
  innovation: {
    title: "Innovation Loss",
    what: "When people are afraid to speak, they stay silent with their ideas. 52% of employees in low-PS teams don't share improvement ideas. Add risk aversion (70% in the low group), which blocks even the ideas that do surface.",
    mechanism: "Innovation requires two things: submitting an idea and the courage to implement it. Low PS blocks both channels. The company loses access to its people's ideas, and they know the processes, customers, and bottlenecks best.",
    example: "Groupon case from the report: failure to listen to an employee's idea could have blocked a 5-10x volume increase. One unspoken idea = potential millions lost.",
    tceConnection: "Employees know the processes, customers, and bottlenecks better than anyone, but when they stay silent, that knowledge is frozen. The company pays for knowledge (salaries) but doesn't use it.",
    interpret: (params, value) => `With revenue of ${Math.round(params.revenue / 1e6)}M PLN we estimate innovation potential at ${Math.round(params.revenue * 0.03 / 1e6)}M PLN/year. At safety ${params.safety} you lose ${Math.round(value / 1e6 * 100) / 100}M PLN, because ideas don't reach decision-makers.`,
  },
  turnover: {
    title: "Excess Turnover",
    what: "Team stability in low-PS companies: 59%, vs 85% in high-PS. Each departure costs 6-9 months of salary (recruitment, onboarding, lost productivity, knowledge drain). Turnover benchmark: GUS 2024 – Poland 14.8% / SHRM 2024 – USA 19%.",
    mechanism: "People don't leave companies, they leave toxic cultures. When psychological safety is low, the best leave first (they have options). Those who stay are the ones afraid of change. That's reverse selection.",
    example: "In a 100-person team, the difference between 59% and 85% stability is ~26 extra departures per year. At average salary 120k PLN and 75% turnover cost = 2.3M PLN/year.",
    tceConnection: "Hirschman (1970): when people can't speak up (voice), they leave (exit). The best leave first, they have options. Every departure means lost knowledge, relationships, and onboarding investment.",
    interpret: (params, value) => `Your company (${params.employees} people, avg salary ${Math.round(params.avgSalary / 1000)}k PLN) loses an estimated ${Math.round(value / 1000)}k PLN/year to excess turnover. That's ${Math.round(value / params.avgSalary)} extra departures above natural churn.`,
  },
  burnout: {
    title: "Burnout / Presenteeism",
    what: "51% of employees in low-PS teams experience burnout vs ~8% in high-PS. A burned-out employee loses ~25% productivity, physically present but mentally absent (presenteeism).",
    mechanism: "Constant stress, fear of mistakes, lack of support, sense of meaninglessness, this is the recipe for burnout. Burned-out employees produce less, generate more errors, get sick more often, and pull down team morale.",
    example: "Ipsos study: in the low-PS group 51% report burnout symptoms. This isn't about 'weak individuals', it's a systemic organizational culture problem.",
    tceConnection: "Burned-out employees make worse decisions, produce more errors, and generate additional costs across the organization. This isn't an individual problem, it's a systemic cost of toxic culture.",
    interpret: (params, value) => `With ${params.employees} employees at safety ${params.safety} we estimate ${Math.round(params.employees * 0.51 * (1 - params.safety / 100))} people experiencing burnout. Cost of lost productivity: ${Math.round(value / 1000)}k PLN/year.`,
  },
  passivity: {
    title: "Passivity & Silos",
    what: "59% of low-PS employees adopt a 'not my business' attitude. Additionally, 35% believe that reporting improvements = being an informer. This is a double brake: people see problems but consciously stay silent.",
    mechanism: "Passivity is classic 'being silenced' (Adamska 2016), learned helplessness, a product of organizational socialization. When you experience several times that your suggestions are ignored or punished, you learn not to react automatically, below the threshold of awareness. Silos form naturally: 'my lane, not my problem'. The company loses thousands of micro-improvements daily.",
    example: "Each of 2,000 employees sees ~1 improvement every 20 workdays. With 59% passivity the company loses access to ~14,000 improvements per year. Even if each is worth only 500 PLN, that's 7M PLN of untapped potential.",
    tceConnection: "Passivity is a rational response: after being ignored a few times, people learn not to bother. 'Not my problem' is a defense mechanism, not laziness. The company loses thousands of micro-improvements daily.",
    interpret: (params, value) => `In your company (${params.employees} people) we estimate ${Math.round(params.employees * 0.05 * 230)} potential improvements/year. At safety ${params.safety} you lose access to most of them. Cost: ${Math.round(value / 1000)}k PLN/year.`,
  },
  help: {
    title: "Help-Seeking Deficit",
    what: "Comfort asking for help: 21% in low-PS vs 99% in high-PS. When people are afraid to ask for help, they make preventable errors, waste time solving problems alone, and don't learn from others.",
    mechanism: "Asking for help requires admitting ignorance, and in a blame culture that's seen as weakness. Effect: people spend hours on problems a colleague could solve in minutes. Errors that could have been caught pass through.",
    example: "A new employee doesn't know how to handle a customer complaint. In high-PS culture they ask a colleague and resolve it in 5 minutes. In low-PS, they search alone for 2 hours, make an error, customer leaves.",
    tceConnection: "When people fear admitting ignorance, they don't ask for help, wasting hours on problems a colleague could solve in minutes. Experienced employees' knowledge doesn't flow to the rest of the team.",
    interpret: (params, value) => `At safety ${params.safety} the comfort of asking for help in your company is ~${Math.round(getMetricValue("helpComfort", params.safety, K_SIGMOID_DEFAULT_MULT) * 100)}%. Estimated cost of preventable errors: ${Math.round(value / 1000)}k PLN/year.`,
  },
  leader: {
    title: "Leader Silence",
    what: "Leaders stay silent too, and it costs the most. One anonymised leader-silence episode in the Fundacja Nowe Przestrzenie 2026 report was self-estimated by the board-member respondent at 400,000 – 800,000 PLN (n=1, illustrative use only).",
    mechanism: "Leaders have greater context and see strategic problems. When they stay silent due to lack of PS (e.g. in their relationship with the board), consequences affect the entire organization. Decisions are made without critical information.",
    example: "'I realized it was me who didn't feel safe and stayed silent. I did a hard financial calculation: that one silence episode cost our company 400,000 – 800,000 PLN.' (quote from the Fundacja Nowe Przestrzenie 2026 report; anonymised in UI marketing copy, full attribution retained in the academic track).",
    tceConnection: "A leader who stays silent toward the board = critical strategic information never reaches the top. One blocked decision can cost the company hundreds of thousands.",
    interpret: (params, value) => `Your company has ${params.leaders} leaders. At safety ${params.safety} we estimate ${(params.leaders * getMetricValue("destructiveFear", params.safety, K_SIGMOID_DEFAULT_MULT) * LEADER_SILENCE_FREQ_MULT).toFixed(1)} silence episodes/year. Cost: ${Math.round(value / 1000)}k PLN/year.`,
  },
  compliance: {
    title: "Procedure Blindness",
    what: "Procedure knowledge: 39% in low-PS vs 79% in high-PS. People who don't feel safe don't ask about procedures, they fear appearing incompetent. Effect: they break rules unknowingly.",
    mechanism: "Compliance requires people to know the rules and apply them. When PS is low, people don't ask about procedures, don't report violations, don't actively participate in training. This creates regulatory and financial risk.",
    example: "An employee doesn't know how to properly archive customer data. In high-PS they ask. In low-PS, they do it 'by eye', risking GDPR fines, data loss, or customer complaints.",
    tceConnection: "Procedures only work when people ask about them and apply them. With low PS nobody asks, because they fear looking incompetent. Result: rules are broken not out of malice, but out of fear.",
    interpret: (params, value) => `With revenue ${Math.round(params.revenue / 1e6)}M PLN and safety ${params.safety}, we estimate compliance risk at ${Math.round(value / 1000)}k PLN/year. That's ${(value / params.revenue * 100).toFixed(3)}% of revenue at risk from unknown procedures.`,
  },
  hierarchy: {
    title: "Hierarchy Information Loss",
    what: "Williamson (1967): Effective Control = alpha^n. Each management layer filters information flowing upward. With 5 layers and low PS, only 5% of critical information reaches decision-makers. Bad news is filtered more aggressively than good news (MUM effect, Rosen & Tesser 1970).",
    mechanism: "Information must pass through successive 'gates' (managers). At each gate some information is filtered, consciously (fear of reaction) or unconsciously (simplification, prioritization). Low PS drastically lowers 'alpha' (fidelity rate) at each gate, and the effect compounds exponentially.",
    example: "A line worker sees a quality risk. They tell the shift manager. The manager judges 'it's not that serious' and doesn't escalate. Information disappears at layer 2 of 5. Strategic decision is made without key data.",
    tceConnection: "Each management layer is a filter, some information is lost along the way. With 5 layers and low PS, only 5% of bad news reaches the top. Executives make decisions based on a picture 3-6x more optimistic than reality.",
    interpret: (params, value) => `Your company has ${params.hierarchyLevels || 5} management layers. At safety ${params.safety} alpha = ${alphaFromSafety(params.safety).toFixed(2)} per layer. Cost of decisions made without complete information: ${Math.round(value / 1000)}k PLN/year.`,
  },
  governance: {
    title: "Governance Overhead (TCE)",
    what: "Williamson (1975, 1996): Large organizations with many layers pay a 'bureaucratic tax', coordination, monitoring and administration costs that grow with size and hierarchy depth. High PS allows replacing costly monitoring with trust.",
    mechanism: "Selective intervention puzzle (Williamson): a large firm cannot simply replicate small-firm efficiency, because hierarchy automatically weakens incentives and requires replacing them with costly control systems. But high PS partially compensates, trust reduces the need for formal oversight.",
    example: "A 50-person firm: the manager knows everyone, sees problems directly. A 2,000-person firm: needs reporting systems, audits, compliance, HR, all 'governance overhead'. With low PS overhead grows further, because people don't voluntarily communicate problems.",
    tceConnection: "The bigger the company, the more coordination, reporting, and control it needs. High PS lets you replace some of that oversight with trust, people report problems voluntarily. Low PS = more expensive overhead.",
    interpret: (params, value) => `Governance penalty for your company (${params.employees} people, ${params.hierarchyLevels || 5} layers): ${value > 0 ? Math.round(value / 1000) + 'k PLN/year overhead beyond a small-firm baseline' : 'minimal, high safety compensates'}. Raising PS allows replacing monitoring with trust.`,
  },
  learningDeficit: {
    title: "Organizational Learning Deficit",
    what: "A clear minority of low-PS organizations actually practice double-loop learning (Argyris 1977), questioning systemic assumptions rather than just correcting individual errors.",
    mechanism: "Silence blocks questioning the status quo. Single-loop learning = repeating the same mistakes. Double-loop requires open discussion of assumptions, which is impossible without psychological safety.",
    example: "A manufacturing company implements 'lean' but nobody questions flawed KPIs, because 'it was management's idea'. Result: superficial improvements, actual stagnation.",
    tceConnection: "The organization repeats the same mistakes because nobody questions assumptions. Single-loop = we fix execution. Double-loop = we ask 'are we doing the right thing?' Without PS there's no double-loop.",
  },
  knowledgeLoss: {
    title: "Knowledge Spiral Blockage (Nonaka)",
    what: "The model adopts an author prior of up to 40% blocked knowledge transfer at low PS. Nonaka and Takeuchi (1995) support the SECI mechanism, not this numeric value.",
    mechanism: "Nonaka & Takeuchi (1995): The SECI spiral (Socialization → Externalization → Combination → Internalization) requires trust at the S and E stages. Silence blocks socialization (observation, mentoring) and externalization (articulating hidden knowledge).",
    example: "An experienced engineer retires. Nobody learned their diagnostic methods because 'there was no time' (in reality: there was no safety to ask).",
    tceConnection: "Practical knowledge (how to fix a machine, how to handle a difficult client) lives in people's heads. When they stay silent, that knowledge doesn't flow, it leaves with them to retirement or to a competitor. The company starts from scratch.",
  },
  agencyOverhead: {
    title: "Agency Costs (monitoring + bonding)",
    what: "The model adopts an author prior of monitoring cost reaching 8% of payroll at low PS. Jensen and Meckling (1976) support the principal-agent mechanism, not this numeric value.",
    mechanism: "Jensen & Meckling (1976): The principal-agent problem, when the agent (employee) has information and the principal (board) doesn't, moral hazard arises. Low PS amplifies information asymmetry → monitoring costs (oversight, audits, reports) and bonding costs (signaling loyalty) increase.",
    example: "A company installs GPS in company cars, cameras in the office, keyloggers, because 'we don't trust employees'. Cost: 200k PLN/year + loss of morale.",
    tceConnection: "When a company doesn't trust its employees, it must control them: audits, reports, surveillance systems. That costs money. High PS lets you reduce monitoring, people report problems themselves because they feel safe.",
  },
};

export const METRIC_DESCRIPTIONS_EN = {
  blameRate: {
    title: "Blame Culture",
    what: "Percentage of employees whose errors are used against them. In low-PS teams: 72%, in high-PS: just 2%.",
    impact: "When errors are punished, people learn to hide them. This doesn't eliminate errors, it just makes them invisible until they become very costly.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Your company (${(yours * 100).toFixed(1)}%) is ABOVE the Polish average (${(pl * 100).toFixed(1)}%), blame culture is stronger than average. This requires urgent intervention.`
      : `Your company (${(yours * 100).toFixed(1)}%) is below the Polish average (${(pl * 100).toFixed(1)}%), blame culture is weaker than average. Good result, but every percent matters.`,
  },
  errorFear: {
    title: "Error Concealment",
    what: "Percentage of employees hiding errors out of fear of consequences. 72% in low-PS, 5% in high-PS.",
    impact: "Hidden errors accumulate and escalate. One small error hidden today = a major crisis in a month. Repair costs grow exponentially with time.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Your company (${(yours * 100).toFixed(1)}%) conceals more errors than the Polish average (${(pl * 100).toFixed(1)}%). This is one of the most costly metrics, every hidden error is a potential time bomb.`
      : `Your company (${(yours * 100).toFixed(1)}%) conceals fewer errors than the Polish average (${(pl * 100).toFixed(1)}%). Good, but the target is below 10%.`,
  },
  teamStability: {
    title: "Team Stability",
    what: "Percentage of employees staying with the company. 59% in low-PS vs 85% in high-PS. Higher value = less turnover, less recruitment cost.",
    impact: "Each departure costs 6-9 months of salary. But the real cost is the loss of knowledge, client relationships and team morale. The best leave first.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Your stability (${(yours * 100).toFixed(1)}%) is higher than the Polish average (${(pl * 100).toFixed(1)}%). Teams are stable, that's the foundation of efficiency.`
      : `Your stability (${(yours * 100).toFixed(1)}%) is lower than the Polish average (${(pl * 100).toFixed(1)}%). High turnover signals a culture problem, people 'vote with their feet'.`,
  },
  helpComfort: {
    title: "Comfort Asking for Help",
    what: "Percentage of employees comfortable asking for help. 21% in low-PS vs 99% in high-PS.",
    impact: "No comfort = struggling alone with problems, wasting time, making preventable errors. It also blocks knowledge transfer in the organization.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Comfort asking for help (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). People aren't afraid to admit ignorance, this accelerates problem-solving.`
      : `Comfort asking for help (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). People prefer wasting hours to asking a colleague for 5 minutes of help.`,
  },
  burnoutRate: {
    title: "Burnout Rate",
    what: "Percentage of employees with burnout symptoms. 51% in low-PS vs 8% in high-PS. Burnout isn't laziness, it's nervous system exhaustion.",
    impact: "A burned-out employee loses ~25% productivity, gets sick more often, makes more errors and lowers the entire team's morale. This is a domino effect.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Burnout rate (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). Every ${Math.round(100 / (yours * 100))} employees is burned out, this is an alarm.`
      : `Burnout rate (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). Good baseline, but target is staying below 15%.`,
  },
  ideaSilence: {
    title: "Idea Silence",
    what: "Percentage of employees not sharing ideas. 52% in low-PS vs 10% in high-PS.",
    impact: "Every unspoken idea is a missed opportunity. Frontline employees see things invisible from the management level, but stay silent.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Idea silence (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). More than half your people have ideas, but keep them to themselves.`
      : `Idea silence (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). Ideas are flowing, this drives innovation.`,
  },
  passivity: {
    title: "Passivity ('Not My Concern')",
    what: "Percentage of employees with a 'not my business' attitude. 59% in low-PS vs 8% in high-PS.",
    impact: "Passivity is learned helplessness. People see problems, broken processes, unhappy customers, waste, but stay silent, because 'why stick your neck out'.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Passivity (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). Most people walk past problems, this costs thousands of micro-losses daily.`
      : `Passivity (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). People engage beyond their scope, a hallmark of the best organizations.`,
  },
  riskAversion: {
    title: "Risk Aversion",
    what: "Percentage of employees avoiding risk. 70% in low-PS vs 15% in high-PS. Without risk, there's no innovation.",
    impact: "Risk aversion = status quo. A company where nobody experiments slowly loses competitiveness. Markets reward courage, not caution.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Risk aversion (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). People play it safe, the company stands still.`
      : `Risk aversion (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). People try new things, this is the engine of growth.`,
  },
  procedureUse: {
    title: "Procedure Knowledge",
    what: "Percentage of employees knowing procedures. 39% in low-PS vs 79% in high-PS. Higher value = less compliance risk.",
    impact: "When people don't know procedures, they break them unknowingly. This is regulatory risk (fines, audits), but also operational risk (errors, accidents, complaints).",
    interpret: (safety, yours, pl) => yours > pl
      ? `Procedure knowledge (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). People know the rules and feel safe asking about them.`
      : `Procedure knowledge (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). People are afraid to ask about procedures, compliance risk grows.`,
  },
  snitchPerc: {
    title: "Improvement = Informing",
    what: "Percentage of employees who see reporting improvements as informing. 55% in low-PS vs 10% in high-PS.",
    impact: "When reporting problems = being a snitch, nobody reports. Problems grow, processes degrade, and the culture of silence becomes entrenched.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Informer effect (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). People are afraid to report problems, they'll be seen as informers.`
      : `Informer effect (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). Reporting problems is seen positively, as it should be.`,
  },
  workJoy: {
    title: "Great Place to Work",
    what: "Percentage of employees declaring work satisfaction. 19% in low-PS vs 70% in high-PS.",
    impact: "Satisfied employees are more productive, creative and loyal. This isn't a 'soft' metric, it's a direct driver of business results.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Satisfaction (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). People enjoy working here, this is a talent magnet and retention foundation.`
      : `Satisfaction (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). Few people enjoy working here, this is a warning signal.`,
  },
  destructiveFear: {
    title: "Destructive Anxiety",
    what: "Percentage of employees experiencing destructive fear at work. 74% in low-PS vs 19% in high-PS.",
    impact: "Destructive fear paralyzes. People don't think creatively, don't make decisions, don't communicate openly. A brain in survival mode doesn't innovate.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Destructive anxiety (${(yours * 100).toFixed(1)}%) above Polish average (${(pl * 100).toFixed(1)}%). Most people are working in survival mode, this kills productivity and innovation.`
      : `Destructive anxiety (${(yours * 100).toFixed(1)}%) below Polish average (${(pl * 100).toFixed(1)}%). People feel safe, they can focus their energy on work, not self-defense.`,
  },
};

export const REDUCTION_TIPS_EN = [
  {
    num: 1,
    title: "Start with leaders, model openly admitting mistakes",
    desc: "A leader who publicly says 'I was wrong, here's what I learned' changes culture faster than any training program. People mirror the behavior of high-status individuals.",
    source: "Edmondson (1999), anonymised case from the Fundacja Nowe Przestrzenie 2026 report",
    impact: "high",
    modules: ["leader", "errors", "help"],
  },
  {
    num: 2,
    title: "Introduce blameless postmortems, analyze errors without blame",
    desc: "After every incident: 'what happened and why?' instead of 'who's at fault?'. Document lessons, not culprits. Google, Etsy and Netflix do this systematically.",
    source: "Edmondson (1999), Adamska (2016) tactical silence",
    impact: "high",
    modules: ["errors", "compliance", "passivity"],
  },
  {
    num: 3,
    title: "Flatten the hierarchy where possible",
    desc: "Every management layer filters 40-50% of bad news. Reducing from 6 to 4 layers doubles the information reaching decision-makers. Consider wider span of control and team empowerment.",
    source: "Williamson (1967), Nichols (1962), Likert (1961)",
    impact: "high",
    modules: ["hierarchy", "governance", "innovation"],
  },
  {
    num: 4,
    title: "Create safe reporting channels (skip-level meetings, anonymous surveys)",
    desc: "People need alternative routes to get information through. Skip-level 1:1s, anonymous pulse surveys every 2 weeks, 'office hours' with leadership, each channel bypasses filtering layers.",
    source: "Detert & Edmondson (2011), Morrison (2023)",
    impact: "high",
    modules: ["hierarchy", "leader", "passivity"],
  },
  {
    num: 5,
    title: "Reward reporting problems, not just success",
    desc: "Publicly recognize people who report errors, risks and concerns, even when they're wrong. 'Thank you for raising this' shifts perception from 'snitching' to 'accountability'.",
    source: "Ipsos Report 2026 (35% improvement = snitching)",
    impact: "medium",
    modules: ["passivity", "errors", "help"],
  },
  {
    num: 6,
    title: "Measure psychological safety regularly and respond",
    desc: "Edmondson questionnaire (7 scales), quarterly surveys, results at team level (not individual). Key: publish results AND an action plan. Surveying without follow-up makes things worse.",
    source: "Edmondson (1999), Nowe Przestrzenie Foundation",
    impact: "medium",
    modules: ["burnout", "passivity", "compliance"],
  },
  {
    num: 7,
    title: "Train leaders in active listening and asking questions",
    desc: "Instead of 'any questions?' (no one answers) ask 'what could go wrong with this plan?' or 'what don't we know?'. Opening questions > closing questions. After asking: wait 10 seconds.",
    source: "Edmondson (1999), Edmondson & Bransby (2023)",
    impact: "medium",
    modules: ["leader", "innovation", "help"],
  },
  {
    num: 8,
    title: "Build cross-functional teams, break down silos & widen autonomy",
    desc: "Passivity ('not my problem') thrives in silos. Mixed teams (ops + dev + business) naturally force information sharing. Cross-department rotation helps. Research shows greater employee autonomy reduces silence (Adamska 2015). Warning: breaking silence doesn't always produce constructive voice, it can also generate destructive voice (Maynes & Podsakoff 2014). Interventions must combine opening channels with building a culture of constructive feedback.",
    source: "Morrison & Milliken (2000), Adamska (2015), Maynes & Podsakoff (2014)",
    impact: "medium",
    modules: ["passivity", "innovation", "governance"],
  },
  {
    num: 9,
    title: "Reframe errors, from 'failure' to 'data'",
    desc: "Language matters. 'Experiment failed' → 'experiment returned data'. 'Who's at fault?' → 'what can we change in the process?'. Changing language changes culture faster than changing procedures.",
    source: "Edmondson (1999), Sherf, Parke, Isaakyan (2021)",
    impact: "medium",
    modules: ["errors", "burnout", "help"],
  },
  {
    num: 10,
    title: "Monitor the 'base of the pyramid', weak signals are your early warning system",
    desc: "Bird's pyramid: for every 1 catastrophe there are 600 minor signals. If you don't see small problems, it doesn't mean they don't exist. It means people are silent. Zero reports = alarm, not success.",
    source: "Bird (1974) Management Guide to Loss Control, Institute Press (ICA study from 1969)",
    impact: "high",
    modules: ["errors", "compliance", "passivity"],
  },
];
