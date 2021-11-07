# md-index

Markdown text file linter and tag aggregator. Just developed for my own needs.

# Install

Assuming Nodejs is installed:

`npm install -g @clinth/md-index`

To update

`npm update -g @clinth/md-index`

# Usage

`md-index [path]`

Provide the base path for your folder of Markdown files, eg:

`md-index c:\onedrive\documents`

Errors will be printed out, and two files produced at the provided base path (tags-alpha.md and tags-freq.md). The two files list tags (sorted alphanumerically or by frequency of usage) and the files that contain tags.

# Config

Create `md-index.json` to contain settings:

```json
{
    "tags": {
        "spaces": true,
        "lowerCase": true,
        "camelHyphen": true
    },
    "frontMatter": {
        "forbiddenKeys": ["keywords"]
    }
}
```

# Linting

## Tags

If the following options are true:

`spaces`: spaces are not allowed in tag names

`lowerCase`: tags are not allowed to be completely lowercased

`camelHyphen`: ambiguity of hyphen usage is not allowed. Eg: _One-Two_ and _OneTwo_ 


## Front matter

`forbiddenKeys`: An array of keys that are not allowed to exist in front matter

# Develop

Install dependencies:

`npm install`

To compile TS and run with a given base path:

`npm run develop [path]`

eg:

`npm run develop c:\onedrive\documents\`
