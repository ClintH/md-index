import {ParseResult} from "./walk";

export const sortParseResults = (d: ParseResult[], field: string) => {
  return [...d].sort((a, b) => {
    // @ts-ignore
    const av = a.data[field] as string;
    // @ts-ignore
    const bv = b.data[field] as string;
    if (av === bv) return 0;
    if (av > bv) return 1;
    return -1;
  });
}