#!/usr/bin/env node
import {mapTag,makePage, lintTags, TagLinting} from './tags.js';
import {gather} from './walk.js';
import { fileURLToPath } from 'url';
import {MultiMap, sortByAlpha,sortBySize} from './MultiMap.js';
import * as fs from 'fs';
import * as path from 'path';

import {LintError} from './lint.js';
import {FrontMatterLinting, lintFrontMatter} from './frontmatter.js';

let v = '?';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '../package.json');
if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath).toString('utf8'));
    if (pkg.version) v = pkg.version;
  } catch (e) { }
}

const header = `md-index (v${v})`;
console.log(header);
console.log('-'.repeat(header.length));

interface Config {
  frontMatter:FrontMatterLinting
  tags:TagLinting
}

if (process.argv.length != 3) {
  console.log('Error: Expected base path for Markdown folder to be given.');
  console.log('   eg: node md-index "c:\\my folder\\"');
  process.exit(1);
}

const basePath = process.argv[2];;
if (!fs.existsSync(basePath)) {
  console.log('Error: Provided base path does not exist: ' + basePath);
  process.exit(1);
}

let config:Config|undefined = undefined;
if (fs.existsSync('md-index.json')) {
  try {
    config = JSON.parse(fs.readFileSync('md-index.json').toString('utf8')) as Config;
  } catch (e) {
    console.log('Error reading md-index.json: ' + e);
    process.exit(1);
  }
}

if (config == undefined) config = {
  tags: {spaces:true, lowerCase:true, camelHyphen:true},
  frontMatter: {forbiddenKeys:['keywords']}
}

const errors = new MultiMap<LintError>();

console.log('Processing: ' + basePath);
const result = await gather(basePath);
if (result.errors.length) {
  for (const e of result.errors) {
    errors.set(e.path, {msg:`Parsing error: ${e.msg}`, lint: 'parse'});
  }
}

errors.merge(lintFrontMatter(result.parsed, config.frontMatter));

const [tags,tagWarnings] = mapTag(result.parsed, config.tags);
errors.merge(tagWarnings);

const tagLintResults = lintTags(tags, config.tags);

function listWithTag(tag:string):string {
  const results = tags.get(tag);
  if (results === undefined) return '';
  const files = results.map(r=>r.path);
  return files.join(', ');
}

function showTagErrors(tagErrors:MultiMap<LintError>) {
  if (tagErrors.isEmpty()) return;
  console.log('Tag Errors');
  const tags = tagErrors.keys();
  for (const tag of tags) {
    const errors = tagErrors.get(tag);
    if (errors === undefined) continue;
    console.log(` ${tag}`);
    for (const msg of errors) {
      console.log(`    ${msg.msg} (${msg.lint})`);
    }
    console.log(` Files with tag: ` + listWithTag(tag));
  }
  console.log();
}

function showErrors(errors:MultiMap<LintError>) {
  if (errors.isEmpty()) return;

  console.log('Errors');
  const files = errors.keysAndCounts();
  for (const f of files) {
    console.log(`${f[0]} (${f[1]})`);
    const msgs = errors.get(f[0]);
    if (msgs === undefined) continue;
    for (const msg of msgs) {
      console.log(`  ${msg.msg} (${msg.lint})`);
    }
  }
}

showErrors(errors);
showTagErrors(tagLintResults);



fs.writeFileSync(path.join(basePath,'tags-alpha.md'), makePage(tags, sortByAlpha));
fs.writeFileSync(path.join(basePath,'tags-freq.md'), makePage(tags, sortBySize));

console.log('Done.');
/*
console.log('Tags');
for (const t of tags.keys()) {
  console.log(t + ' (' + tags.count(t) + ')')
  let list = tags.get(t);
  if (list === undefined) continue;
  for (const l of list) {
    console.log(' - ' + l.path)
  }
}

*/