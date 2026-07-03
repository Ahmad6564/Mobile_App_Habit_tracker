const pad = (n: number): string => String(n).padStart(2, "0");

/** Format a Date as "YYYY-MM-DD" in local time */
export const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Today's date string "YYYY-MM-DD" in local time */
export const today = (): string => fmtDate(new Date());

/** Parse a "YYYY-MM-DD" string into a local midnight Date */
export const parseDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Number of days in a given month (month is 0-indexed, same as JS Date) */
export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();
