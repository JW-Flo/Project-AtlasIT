let counter = 0;

export function uuid(): string {
  counter++;
  return `demo-${counter.toString().padStart(6, "0")}`;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), (n * 17) % 60, 0, 0);
  return d.toISOString();
}

export function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600000).toISOString();
}

export function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60000).toISOString();
}

export function resetCounter(): void {
  counter = 0;
}
