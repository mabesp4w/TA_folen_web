export function waktuToDate(value: string): Date | null {
  const match = /^(\d{1,2})[.:]?(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}
