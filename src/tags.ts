import {MultiMap, sortByAlpha} from "./MultiMap.js";
import {ParseResult} from "./walk";
import url from "url";
import {LintError} from "./lint.js";
import {sortParseResults} from "./sort.js";
export interface TagLinting {
  spaces: boolean
  lowerCase: boolean
  camelHyphen: boolean
}
const nl = `\n`;
const dnl = `\n\n`;

export function lintTags(tagResults: MultiMap<ParseResult>, opts: TagLinting): MultiMap<LintError> {
  let err = new MultiMap<LintError>();
  const tags = tagResults.keys();

  for (const t of tags) {
    if (opts.camelHyphen) {
      if (t.includes('-')) {
        let without = t.replaceAll('-', '');
        if (tagResults.has(without)) {
          err.set(t, {msg: `Hypenated tag ${t} also exists in non-hypenated form: ${without}`, lint: 'camelHyphen'});
        }
      }
    }
  }
  return err;
}

function mapTag(parsed: ParseResult[], opts: TagLinting): [MultiMap<ParseResult>, MultiMap<LintError>] {
  let m = new MultiMap<ParseResult>();
  let warnings = new MultiMap<LintError>();

  for (const r of parsed) {
    let tags: string[] = r.data.keywords ? r.data.keywords : r.data.tags;

    if (tags === undefined) continue;

    try {
      for (const tag of tags) {
        m.set(tag.toLocaleLowerCase(), r);

        if (opts.spaces && tag.includes(' ')) {
          warnings.set(r.path, {msg: `Tag '${tag}' contains space`, lint: 'spaces'})
        }
        if (opts.lowerCase && tag.toLocaleLowerCase() === tag) {
          warnings.set(r.path, {msg: `Tag '${tag}' is lowercase`, lint: 'lowerCase'})
        }
      }
    } catch (err) {
      warnings.set(r.path, {msg: 'Tag error: ' + err, lint: 'parse'});
    }
  }
  return [m, warnings];
}

export type PageOpts = {
  title?: string,
  subSortField?: string
}

export type SortFn = (tags: MultiMap<ParseResult>) => string[];

export function makeTagHouseKeepingPage(tags: MultiMap<ParseResult>): string {
  let r = `# Tag housekeeping${dnl}`;

  const byFreq = new MultiMap<string>();

  for (const tag of tags.keys()) {
    const pages = tags.get(tag);
    let key = '?';
    if (pages) {
      if (pages.length < 5) key = '0' + pages.length.toString();
      else if (pages.length <= 10) key = '06-10';
      else if (pages.length <= 20) key = '11-20';
      else if (pages.length <= 30) key = '21-30';
      else if (pages.length <= 40) key = '31-40';
      else if (pages.length <= 50) key = '41-50';
      else if (pages.length <= 60) key = '51-60';
      else key = pages.length.toString();
    }
    byFreq.set(key, tag);
  }

  const byFreqSortedKeys = sortByAlpha(byFreq);


  for (const freqGroup of byFreqSortedKeys) {
    r += `## ${freqGroup}${nl}`;
    const tags = byFreq.get(freqGroup);
    for (const tag of tags!) {
      r += `${tag}, `;
    }
    r += dnl;
  }

  return r;
}

function makePage(tags: MultiMap<ParseResult>, sortFunc: SortFn, opts: PageOpts = {}): string {
  const sorted = sortFunc(tags);

  const title = opts.title;
  const subSortField = opts.subSortField;
  let r = '';

  if (title) r += `# ${title}${nl}`;
  for (const tag of sorted) {
    r += `[${tag}](#${tag}), `;
  }
  r += dnl;

  for (const tag of sorted) {
    r += `## ${tag}${nl}`;
    let pages = tags.get(tag)!;

    if (subSortField) {
      pages = sortParseResults(pages, subSortField);
    }

    for (const page of pages) {
      //url.pathToFileURL(page.path
      const uri = page.path.replaceAll(' ', '%20');
      r += ` - [${page.data.title}](${uri})${nl}`
    }
    r += nl;
  }
  return r;
}

export {mapTag, makePage};