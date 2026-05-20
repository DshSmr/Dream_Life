import { messages as enMessages } from "@/lib/i18n/messages/en";

export type Locale = "en" | "ru" | "fi";

/** Widen literal strings so locale catalogs can use different translations. */
export type WidenStrings<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: WidenStrings<T[K]> }
    : never;

export type Messages = WidenStrings<typeof enMessages>;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6];

type Join<K extends string, P extends string> = P extends "" ? K : `${K}.${P}`;

/** Depth-limited dot paths — avoids TS2589 on large message trees. */
type DotNestedKeys<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T & string]: Join<K, DotNestedKeys<T[K], Prev[D]>>;
      }[keyof T & string]
    : "";

export type TranslationKey = DotNestedKeys<typeof enMessages>;
