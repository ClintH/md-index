import * as grayMatter from "gray-matter";
import * as fs from "fs";
import * as path from "path";

interface WalkOpts {
  ext:string[]
}

async function* walk(dir:string, opts:WalkOpts = {ext:[]}):AsyncGenerator<string> {
  for await (const d of await fs.promises.opendir(dir)) {
      const entry = path.join(dir, d.name);
      if (d.isDirectory()) {
        yield* walk(entry, opts);
      }
      if (!d.isFile()) continue;

      let ext = path.extname(entry);
      if (opts.ext.includes(ext))
        yield entry;
      //else console.log(`Ignored extension ${ext} (${entry}`);
  }
}

interface ParseError {
  msg:string,
  path:string
}

interface ParseResult {
  path:string,
  data:any,
  excerpt:string|undefined,
  content:string
}
interface GatherResult {
  parsed: ParseResult[]
  errors: ParseError[];
}

async function gather(dir:string):Promise<GatherResult> {
  const result:GatherResult = {
    parsed: [],
    errors: []
  }
  const opts = {ext:['.md', '.markdown']}

  for await (const entry of walk(dir, opts)) {
    try {
      const text = await fs.promises.readFile(entry);
      const grayResult = grayMatter.default(text);
      const r = {
        path: path.relative(dir,entry),
        content: grayResult.content,
        excerpt: grayResult.excerpt,
        data: grayResult.data
      }
      result.parsed.push(r)
    } catch (e) {
      if (e instanceof Error)
        result.errors.push({msg:e.message, path: entry});
      else
        result.errors.push({msg:e as string, path: entry});
    }
  }
  return result;
} 
export {gather, GatherResult,ParseError, ParseResult,WalkOpts};