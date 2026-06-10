export const languages = ['th', 'en', 'cn', 'mm', 'ja'] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = 'th';

export const namespaces = ['translation'];
