export const siteConfig = {
  description:
    "Portfolio-first digital playground for code, games, music, and personal experiments.",
  domain: "qwiosky.lol",
  email: "tristinsiM@gmail.com",
  location: "Singapore",
  name: "Tristin Sim",
  tagline:
    "A whimsical portfolio evolving into a realtime multiplayer web app on Next.js and Supabase.",
} as const;

export const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/games", label: "Games" },
] as const;

export const featuredProjects = [
  {
    cta: "Open the game lab",
    href: "/games/imposter",
    kind: "Realtime Game",
    summary:
      "A Jackbox-style browser party game built for phones and laptops with rooms, prompts, voting, and Supabase Realtime.",
    tags: ["Next.js", "Supabase Realtime", "Vercel"],
    title: "Imposter",
  },
  {
    cta: "See portfolio work",
    href: "/projects",
    kind: "Portfolio Build",
    summary:
      "This site itself is being rebuilt as a scalable app shell so the portfolio stays front-and-center while new features ship over time.",
    tags: ["App Router", "TypeScript", "Tailwind"],
    title: "Portfolio Platform",
  },
  {
    cta: "Read more",
    href: "/projects",
    kind: "Creative Tech",
    summary:
      "Rainmeter widgets, application-security coursework, and full-stack prototypes shaped the vibe and the technical direction here.",
    tags: ["Frontend", "Security", "Design"],
    title: "Systems With Personality",
  },
] as const;

export const portfolioProjects = [
  {
    kind: "Web App",
    summary:
      "A full-stack collaboration project built with product thinking, modern UI, and room for future private demos and walkthroughs.",
    tags: ["Cloud", "GenAI", "Full stack"],
    title: "Lynkistry",
  },
  {
    kind: "Security",
    summary:
      "Authentication-heavy coursework with 2FA, anti-CSRF, XSS protection, and careful handling of sensitive data flows.",
    tags: ["OWASP", "2FA", "App security"],
    title: "Bookworms Online",
  },
  {
    kind: "Desktop Personalization",
    summary:
      "A Rainmeter computer-monitoring asset with animated character states and a playful presentation layer.",
    tags: ["UI", "Rainmeter", "Creative coding"],
    title: "Computer Performance Display",
  },
  {
    kind: "Music",
    summary:
      "Live performance work, pedalboard experimentation, and gear setups that feed back into the portfolio's personality.",
    tags: ["Guitar", "Live", "Performance"],
    title: "Keith + Live Sets",
  },
] as const;

export const skillGroups = [
  {
    items: ["Next.js", "TypeScript", "React", "Tailwind CSS", "Supabase", "SQL"],
    title: "Build",
  },
  {
    items: ["Product thinking", "Security basics", "Realtime UX", "System design"],
    title: "Shape",
  },
  {
    items: ["Music", "Crochet", "Custom wallpapers", "Playful interfaces"],
    title: "Style",
  },
] as const;

export const roadmapPhases = [
  {
    items: [
      "Portfolio shell",
      "Auth",
      "Create and join room",
      "Lobby",
      "One Imposter round",
      "Voting",
      "Results",
      "Leaderboard",
    ],
    title: "Phase 1",
  },
  {
    items: [
      "Friend system",
      "Match history",
      "Multiple games",
      "Better host controls",
      "Categories and topics",
      "UI polish and motion",
    ],
    title: "Phase 2",
  },
  {
    items: [
      "Optional home-server integrations",
      "Secure file access UI",
      "Media dashboard links",
      "Private authenticated tools",
    ],
    title: "Phase 3",
  },
] as const;
