import {LintError} from "./lint.js";
import {MultiMap} from "./MultiMap.js";
import {ParseResult} from "./walk.js";

export interface FrontMatterLinting {
  forbiddenKeys: string[]
}

export function lintFrontMatter(parsed:ParseResult[], opts:FrontMatterLinting):MultiMap<LintError> {
  let warnings = new MultiMap<LintError>();

  for (const r of parsed) {
    for (const forbidden of opts.forbiddenKeys) {
      if (r.data[forbidden] !== undefined) {
        warnings.set(r.path, {msg:`'${forbidden}' forbidden frontmatter key`, lint: 'forbiddenKeys'});
      }
    }
  }
  return warnings;
}