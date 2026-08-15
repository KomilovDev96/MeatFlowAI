export function displayName(person: { firstName?: string | null; lastName?: string | null } | null | undefined) {
  if (!person) return '';
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
}

export function formatNumber(value: string | number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('ru-RU', options).format(Number(value));
}

export function formatThousands(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  const [intPart, decPart] = `${value}`.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

export function parseThousands(value: string | undefined): number {
  if (!value) return 0;
  return Number(value.replace(/\s/g, ''));
}
