import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
})

export const ArrowLeft = (p: P) => <svg {...base(p)}><path d="M19 12H5m6-6-6 6 6 6" /></svg>
export const ArrowRight = (p: P) => <svg {...base(p)}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
export const Check = (p: P) => <svg {...base(p)}><path d="m4.5 12.5 5 5L19.5 7" /></svg>
export const Close = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const Menu = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
export const User = (p: P) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></svg>
export const Calendar = (p: P) => <svg {...base(p)}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4m8-4v4M3.5 10h17" /></svg>
export const Clock = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
export const Gravity = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>
export const Thermo = (p: P) => <svg {...base(p)}><path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" /><path d="M12 9v6" /></svg>
export const Route = (p: P) => <svg {...base(p)}><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18h5a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7h5" /></svg>
export const Rocket = (p: P) => <svg {...base(p)}><path d="M12 3c3.5 2 5.5 5.5 5.5 9.5L15 17H9l-2.5-4.5C6.5 8.5 8.5 5 12 3Z" /><circle cx="12" cy="10" r="1.7" /><path d="M9 17l-1.5 3.5M15 17l1.5 3.5M12 17v3" /></svg>
export const Shield = (p: P) => <svg {...base(p)}><path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
export const Window = (p: P) => <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="8" /><path d="M4 12h16M12 4v16" /></svg>
export const Seat = (p: P) => <svg {...base(p)}><path d="M7 4h6a2 2 0 0 1 2 2v6H7V6a2 2 0 0 1 2-2Z" /><path d="M5 13h12v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3Zm3 5v2m8-2v2" /></svg>
export const Card = (p: P) => <svg {...base(p)}><rect x="3" y="5.5" width="18" height="13" rx="3" /><path d="M3 10h18M7 15h4" /></svg>
export const Lock = (p: P) => <svg {...base(p)}><rect x="5" y="10.5" width="14" height="9.5" rx="3" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
export const Download = (p: P) => <svg {...base(p)}><path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19h14" /></svg>
export const Compare = (p: P) => <svg {...base(p)}><path d="M8 4v16M16 4v16M4 8h8M12 16h8" /></svg>
export const Filter = (p: P) => <svg {...base(p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
export const Sparkle = (p: P) => <svg {...base(p)}><path d="M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7Z" /></svg>
export const Alert = (p: P) => <svg {...base(p)}><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5m0 2.7v.1" /></svg>
export const Logout = (p: P) => <svg {...base(p)}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4m4-4H9" /></svg>
export const Signal = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="2" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4m8.4-8.4a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2m14.2-14.2a10 10 0 0 1 0 14.2" /></svg>
export const Plus = (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
export const Print = (p: P) => <svg {...base(p)}><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2" /><rect x="7" y="14" width="10" height="6" rx="1" /></svg>
export const Home = (p: P) => <svg {...base(p)}><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 10v9.5h11V10" /><path d="M10 19.5v-5h4v5" /></svg>
export const Scale = (p: P) => <svg {...base(p)}><rect x="4" y="5" width="16" height="15" rx="3.5" /><path d="M8.5 9.5a5 5 0 0 1 7 0" /><path d="m12 12.5 1.8-2.6" /></svg>
export const Users = (p: P) => <svg {...base(p)}><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 19.5c1-3.6 3.4-5 6.5-5s5.5 1.4 6.5 5" /><path d="M16 5.3a3.5 3.5 0 0 1 0 6.4m2.2 3.5c1.6.7 2.7 2 3.3 4.3" /></svg>
export const Search = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
export const Refresh = (p: P) => <svg {...base(p)}><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1" /><path d="M17.5 3.5v3.6h-3.6M6.5 20.5v-3.6h3.6" /></svg>
export const Ticket = (p: P) => <svg {...base(p)}><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" /><path d="M14 6v2.5m0 3v1m0 3V18" /></svg>
export const Gauge = (p: P) => <svg {...base(p)}><path d="M4.5 17a8.5 8.5 0 1 1 15 0" /><path d="m12 14 4-5" /><circle cx="12" cy="14.5" r="1.3" /></svg>
export const Coins = (p: P) => <svg {...base(p)}><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></svg>
export const Ban = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="m6 6 12 12" /></svg>
