/** Replace `{name}` placeholders in translated strings. */
export function formatMessage(
  template: string,
  values?: Record<string, string | number | undefined | null>
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = values[key];
    return v === undefined || v === null ? `{${key}}` : String(v);
  });
}
