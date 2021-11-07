import {MultiMap} from "./MultiMap.js";
import { ParseResult} from "./walk";
import url from "url";
import {LintError} from "./lint.js";

export interface TagLinting {
  spaces:boolean
  lowerCase:boolean
  camelHyphen:boolean
}

export function lintTags(tagResults:MultiMap<ParseResult>, opts:TagLinting):MultiMap<LintError> {
  let err= new MultiMap<LintError>();
  const tags = tagResults.keys();

  for (const t of tags) {
    if (opts.camelHyphen) {
      if (t.includes('-')) {
        let without = t.replaceAll('-', '');
        if (tagResults.has(without)) {
          err.set(t, {msg:`Hypenated tag ${t} also exists in non-hypenated form: ${without}`, lint: 'camelHyphen'});
        }
      }
    }
  }
  return err;
}

function mapTag(parsed:ParseResult[], opts:TagLinting ):[MultiMap<ParseResult>,MultiMap<LintError>] {
  let m = new MultiMap<ParseResult>();
  let warnings = new MultiMap<LintError>();

  for (const r of parsed) {
    let tags:string[] = r.data.keywords ? r.data.keywords : r.data.tags;
    
    if (tags === undefined) continue;

    try {
      for (const tag of tags) {
        m.set(tag.toLocaleLowerCase(), r);

        if (opts.spaces && tag.includes(' ')) {
          warnings.set(r.path, {msg:`Tag '${tag}' contains space`, lint: 'spaces'})
        }
        if (opts.lowerCase && tag.toLocaleLowerCase() === tag) {
          warnings.set(r.path, {msg:`Tag '${tag}' is lowercase`, lint: 'lowerCase'})
        }
      }
    } catch (err) {
      warnings.set(r.path, {msg:'Tag error: ' + err, lint:'parse'});
    }
  }
  return [m,warnings];
}

function makePage(tags:MultiMap<ParseResult>, sortFunc: (tags:MultiMap<ParseResult>)=>string[]):string {
  const sorted = sortFunc(tags);

  let r= '';
  for (const tag of sorted) {
    r += tag +', ';
  }
  r += '\n\n';

  for (const tag of sorted) {
    r += `## ${tag}\n`;
    let pages = tags.get(tag)!;
    for (const page of pages) {
      //url.pathToFileURL(page.path
      const uri = page.path.replaceAll(' ', '%20');
      r+= ` - [${page.data.title}](${uri})\n`
    }
    r +='\n';
  }
  return r;
}

export {mapTag, makePage};