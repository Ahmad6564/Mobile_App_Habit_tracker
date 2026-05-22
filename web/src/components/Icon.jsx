// Lightweight SVG line-icon set. Stroke uses currentColor so they inherit theme.
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  habit: (
    <>
      <path d="M12 2l2.39 6.96H22l-6 4.37 2.3 7.1L12 16.9 5.7 20.43 8 13.33 2 8.96h7.61L12 2z" />
    </>
  ),
  task: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 11l3 3 5-6" />
      <path d="M3 8h18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  community: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.2" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M14 20c0-2 2-3.5 4-3.5s3 1.5 3 3" />
    </>
  ),
  chat: (
    <>
      <path d="M21 12c0 4.4-4 8-9 8a9.7 9.7 0 0 1-4-.8L3 21l1.6-4A7.8 7.8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </>
  ),
  nutrition: (
    <>
      <path d="M12 2C9 5 8 9 9 13c1 4 5 5 7 4 0 3-1 5-4 5-4 0-7-3-8-7" />
      <path d="M12 2c2 3 4 4 7 4-1 3-3 4-4 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 3h16l-2-3z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.2 11l7.6-4M8.2 13l7.6 4" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12l5 5L20 7" />,
  close: <path d="M6 6l12 12M18 6l-12 12" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  // Habit category icons
  run: (
    <>
      <circle cx="13" cy="4" r="2" />
      <path d="M6 19l3-4 3 1 2-3 3 2 3-1" />
      <path d="M9 15l-2-3 4-3 3 2 2 4" />
    </>
  ),
  meditate: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
      <path d="M3 15c2-1 4-1 5 0M16 15c1-1 3-1 5 0" />
    </>
  ),
  water: (
    <>
      <path d="M12 3s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v17H6a2 2 0 0 0-2 2V5z" />
      <path d="M19 18H6" />
    </>
  ),
  stretch: (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M6 9l6 2 6-2M12 11v10M9 21l3-4 3 4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" />
      <path d="M9 11l2 2 4-4" />
    </>
  ),
  gym: (
    <>
      <path d="M3 9h2v6H3zM19 9h2v6h-2zM5 12h14M7 7h2v10H7zM15 7h2v10h-2z" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4" r="2" />
      <path d="M11 22l1-7 3-4-3-3-3 3 1 4-3 7" />
    </>
  ),
  sleep: (
    <>
      <path d="M3 12a9 9 0 1 0 18 0M5 16h4v-3l4-4H6" />
    </>
  ),
  journal: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </>
  ),
  code: (
    <>
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 1 1-10 0V4z" />
      <path d="M5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3M10 14v3h4v-3M8 21h8" />
    </>
  ),
  refer: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M17 8v6M14 11h6" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3c1 3-2 5-2 8a3 3 0 0 0 3 3 3 3 0 0 0 3-3c0-2-2-4-1-6 3 2 5 5 5 9a8 8 0 1 1-16 0c0-4 4-7 8-11z" />
    </>
  )
};

export const HABIT_ICONS = [
  "spark", "run", "meditate", "water", "book", "stretch", "shield",
  "gym", "walk", "sleep", "journal", "code", "flame", "trophy"
];

function Icon({ name, size = 20, className = "", title }) {
  const content = paths[name] || paths.spark;
  return (
    <svg
      {...base}
      width={size}
      height={size}
      className={`icon ${className}`}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
    >
      {content}
    </svg>
  );
}

export default Icon;
