/* ══════════════════════════════════════════════════════════════════════════
   Le contrôle des repères de date — `npm test`.

   POURQUOI CE TEST EXISTE (21/09/2026). L'assistant a répondu « demain, mercredi
   16 septembre » à une question posée le lundi 21 : il n'avait aucun repère de
   date, donc « demain » sortait de son entraînement. Le remède est la fonction
   `REPERES_DATE` de la Edge Function — et ce qui se casse en silence, ici, c'est
   le FUSEAU. Un décalage de quelques heures ne se voit pas sur une réponse, sauf
   le soir : à 21 h UTC, La Réunion est déjà au lendemain.

   Ce que ce test verrouille :
     1. le fuseau de l'île (UTC+4), y compris quand le jour change en route ;
     2. les bascules de mois et d'année, qui font dire « demain » de travers ;
     3. la forme machine `AAAA-MM-JJ`, zéro-paddée (c'est ce que `check-agent`
        compare à sa propre horloge) ;
     4. la présence des repères dans le PROMPT, et leur place avant la liste des
        commerces — un test de plus serait inutile si le prompt ne les portait pas.

   Les valeurs attendues ne sont PAS recopiées depuis Intl : elles viennent de
   l'horloge du système (`date -u`, `TZ=Indian/Reunion date`), puis sont figées
   ici. Comparer Intl à Intl ne prouverait rien.

   Le code testé est EXTRAIT du fichier de la fonction : c'est celui qu'on colle
   dans Supabase, pas une copie qui pourrait diverger.
   ══════════════════════════════════════════════════════════════════════════ */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
// Le fichier de la fonction est du TypeScript : pour exécuter SON code, on lui
// retire ses annotations avec le compilateur du projet (déjà dans
// `devDependencies`), au lieu de recopier le helper dans le test.
import ts from 'typescript'

const ici = dirname(fileURLToPath(import.meta.url))
const FICHIER = join(ici, '..', 'supabase', 'functions', 'chat', 'index.ts')
const source = readFileSync(FICHIER, 'utf8')

/** Extrait `REPERES_DATE` du fichier de la fonction, et le rend exécutable. */
function chargerReperes() {
  const debut = source.indexOf('const FUSEAU')
  assert.ok(debut > 0, 'on doit trouver le fuseau dans la fonction')
  // La fin du bloc est la première accolade en colonne 0 après le helper : à
  // l'intérieur, toutes les accolades sont indentées.
  const fin = source.indexOf('\n}\n', debut)
  assert.ok(fin > debut, 'on doit trouver la fin du helper de date')
  const code = source
    .slice(debut, fin + 2)
    // `Deno` n'existe pas dans Node : on remplace la seule ligne qui l'utilise.
    // Le fuseau testé est celui du défaut, et c'est bien lui qu'on veut vérifier.
    .replace(/^const FUSEAU = .*$/m, "const FUSEAU = 'Indian/Reunion'")
  assert.ok(!code.includes('Deno'), 'aucun autre usage de Deno dans le helper')
  const js = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  return new Function(`${js}\nreturn REPERES_DATE`)()
}

const REPERES_DATE = chargerReperes()
const reperes = (iso) => REPERES_DATE(new Date(iso))

test('le 21/09/2026 à La Réunion — le jour de la question mal répondue', () => {
  const r = reperes('2026-09-21T05:52:00Z')
  assert.equal(r.aujourdhui, 'lundi 21 septembre 2026')
  assert.equal(r.iso, '2026-09-21')
  assert.equal(r.heure, '09:52')
  assert.equal(r.hier, 'dimanche 20 septembre 2026')
  assert.equal(r.demain, 'mardi 22 septembre 2026')
  assert.equal(r.apresDemain, 'mercredi 23 septembre 2026')
})

test('le soir à Paris, il est déjà demain à La Réunion', () => {
  // 21 h 30 UTC le 20 = 01 h 30 le 21 à La Réunion (UTC+4). Un calcul en UTC
  // aurait dit « dimanche 20 », et l'assistant aurait vieilli d'un jour.
  const r = reperes('2026-09-20T21:30:00Z')
  assert.equal(r.aujourdhui, 'lundi 21 septembre 2026')
  assert.equal(r.iso, '2026-09-21')
  assert.equal(r.heure, '01:30')
})

test('la bascule de mois passe par le lendemain, pas par aujourd’hui', () => {
  // 00 h 30 le 1er octobre à La Réunion : « hier » est encore en septembre.
  const r = reperes('2026-09-30T20:30:00Z')
  assert.equal(r.aujourdhui, 'jeudi 1 octobre 2026')
  assert.equal(r.hier, 'mercredi 30 septembre 2026')
  assert.equal(r.demain, 'vendredi 2 octobre 2026')
})

test('la bascule d’année est au bon endroit', () => {
  const r = reperes('2026-12-31T21:00:00Z')
  assert.equal(r.aujourdhui, 'vendredi 1 janvier 2027')
  assert.equal(r.hier, 'jeudi 31 décembre 2026')
  assert.equal(r.demain, 'samedi 2 janvier 2027')
  assert.equal(r.iso, '2027-01-01')
})

test('la forme machine est zéro-paddée', () => {
  // Sans zéro, « 2026-1-5 » ne se compare pas à la date d'un contrôle, et
  // `check-agent` crierait à tort.
  const r = reperes('2026-01-05T02:00:00Z')
  assert.equal(r.iso, '2026-01-05')
  assert.equal(r.aujourdhui, 'lundi 5 janvier 2026')
})

test('la date est calculée avec l’horloge donnée, jamais avec celle du poste', () => {
  // Le même instant, trois fois : la valeur ne doit pas dépendre du fuseau de la
  // machine (le test tourne sur un serveur en UTC, mais rien ne le garantit).
  const instant = '2026-09-21T05:52:00Z'
  const un = reperes(instant)
  const deux = REPERES_DATE(new Date(instant))
  assert.equal(un.aujourdhui, deux.aujourdhui)
  assert.equal(un.heure, deux.heure)
})

test('la fonction demande l’heure de La Réunion', () => {
  assert.match(source, /FUSEAU = Deno\.env\.get\('FUSEAU'\) \?\? 'Indian\/Reunion'/)
})

test('les repères de date partent dans le prompt, avant les commerces', () => {
  assert.match(source, /RÉPÈRES DE DATE/, 'le prompt doit porter les repères')
  assert.match(source, /Une seule lecture de l'horloge pour tout l'appel/)
  const iDate = source.indexOf('RÉPÈRES DE DATE')
  const iCommerces = source.indexOf('COMMERCES ET PRESTATAIRES DE LA RÉUNION (${nombre})')
  assert.ok(iDate > 0 && iCommerces > 0, 'les deux blocs doivent être là')
  assert.ok(iDate < iCommerces, 'la date se lit avant la liste')
})

test('la règle « une date ne s’invente pas » est écrite noir sur blanc', () => {
  assert.match(source, /UNE DATE NE S'INVENTE PAS/)
})

test('le GET publie la date (c’est ce que compare check-agent)', () => {
  assert.match(source, /date: reperes\.iso/)
})

test('les résultats web portent leur date de publication', () => {
  // Sans elle, le modèle devine QUAND l'article a été écrit et remet au présent
  // une actualité passée : « la ruée, c'est demain » pour une sortie de la
  // semaine dernière (30 ans de Pokémon, extension sortie le 16-17/09).
  assert.match(source, /publishedDate/)
  assert.match(source, /publié le \$\{quand\}/)
  assert.match(source, /jourPublication\(r\.publishedDate\)/)
})

test('le prompt interdit de remettre au futur ce qui est passé', () => {
  assert.match(source, /ne présente JAMAIS comme à venir ce qui est déjà passé/)
})
