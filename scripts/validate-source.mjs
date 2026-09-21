import { readdir, readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

const root = join(process.cwd(), 'src')
const sourceExtensions = new Set(['.js', '.jsx'])
const badPatterns = [
  { pattern: /\\</g, message: 'escaped < found (often caused by corrupted JSX serialization)' },
  { pattern: /\\>/g, message: 'escaped > found (often caused by corrupted JSX serialization)' },
  { pattern: /\\`/g, message: 'escaped backtick found outside a string/template context' },
]

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (sourceExtensions.has(extname(entry.name))) files.push(path)
  }
  return files
}

const files = await walk(root)
const problems = []
for (const file of files) {
  const text = await readFile(file, 'utf8')
  for (const { pattern, message } of badPatterns) {
    if (pattern.test(text)) problems.push(`${file}: ${message}`)
  }
}

if (problems.length) {
  console.error('Source validation failed:')
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}

console.log(`Source validation passed (${files.length} JS/JSX files checked).`)
