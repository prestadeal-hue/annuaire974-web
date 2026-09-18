// Contrôle avant commit : aucun secret ne doit être indexé.
// Dans l'esprit du check-secrets.sh du dépôt voice-kit.
// Usage : node scripts/check-secrets.mjs
import { execSync } from 'node:child_process'

const PATTERNS = [
  { name: 'clé privée', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'clé secrète Supabase', re: /sb_secret_[A-Za-z0-9_-]+/ },
  { name: 'JWT legacy Supabase', re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { name: 'token de bot', re: /\b[0-9]{8,10}:[A-Za-z0-9_-]{30,}\b/ },
  { name: 'clé API générique', re: /(?:api[_-]?key|secret|password|passwd|token)\s*[:=]\s*['"][^'"]{16,}['"]/i },
]

let indexed
try {
  indexed = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
} catch {
  console.error('⛔ Pas dans un dépôt git — lance ce script depuis la racine du projet.')
  process.exit(1)
}

const badFiles = indexed.filter((f) => {
  const base = f.split('/').pop() ?? f
  return (
    // .env, .env.local, .env.production… mais PAS .env.example (sans valeur réelle)
    (base.startsWith('.env') && base !== '.env.example') ||
    base.endsWith('.pem') ||
    base.endsWith('.key')
  )
})
if (badFiles.length > 0) {
  console.error('⛔ Fichiers interdits indexés :', badFiles.join(', '))
  process.exit(1)
}

let clean = true
for (const file of indexed) {
  let content
  try {      // `stdio` bouche les erreurs des deux essais : un fichier encore dans
      // l'index (nouveau, pas commité) est normal, et un contrôle qui affiche
      // « fatal: » avant de dire « PROPRE » fait douter de son propre verdict.
      content = execSync(`git show HEAD:${JSON.stringify(file)} 2>/dev/null || git cat-file -p HEAD:${JSON.stringify(file)}`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
  } catch {
    // fichier pas encore commité — on regarde le contenu indexé via l'index
    try {
      content = execSync(`git cat-file -p :${JSON.stringify(file)}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
    } catch {
      continue
    }
  }
  for (const { name, re } of PATTERNS) {
    if (re.test(content)) {
      console.error(`⛔ ${name} détecté dans : ${file}`)
      clean = false
    }
  }
}

if (clean) {
  console.log(`✅ PROPRE — ${indexed.length} fichiers indexés, aucun secret détecté. On peut commiter.`)
} else {
  console.error('⛔ Corrige avant de committer (voir .gitignore à règle inversée).')
  process.exit(1)
}
