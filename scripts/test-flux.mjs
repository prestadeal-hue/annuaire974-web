/* ══════════════════════════════════════════════════════════════════════════
   Le contrôle du lecteur de flux — `npm test`.

   Ce qu'on vérifie ici ne se voit pas à l'œil nu : ce sont les découpages
   traîtres. Un paquet réseau qui coupe un morceau en deux, deux morceaux qui
   arrivent collés, un accent à cheval sur deux paquets, une ligne parasite au
   milieu, une fin de flux sans nouvelle ligne. Autant de cas qui, mal traités,
   donnent une réponse tronquée sans que personne ne comprenne pourquoi.

   On ne teste que `lireFlux` : ni React, ni réseau, ni Supabase — juste des
   octets qui entrent, des événements qui sortent.
   ══════════════════════════════════════════════════════════════════════════ */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lireFlux } from '../src/lib/flux.ts'

const encodeur = new TextEncoder()

/** Un flux à partir de morceaux déjà découpés (chaîne = encodée en UTF-8). */
function flux(morceaux) {
  return new ReadableStream({
    start(controleur) {
      for (const morceau of morceaux) {
        controleur.enqueue(typeof morceau === 'string' ? encodeur.encode(morceau) : morceau)
      }
      controleur.close()
    },
  })
}

async function collecter(morceaux) {
  const vus = []
  for await (const evt of lireFlux(flux(morceaux))) vus.push(evt)
  return vus
}

const delta = (text) => `data: ${JSON.stringify({ type: 'delta', text })}\n\n`

test('les morceaux arrivent dans l’ordre, puis la fin', async () => {
  const vus = await collecter([
    delta('Bonjour ! '),
    delta('Pour un plombier '),
    delta('à Saint-Denis, appelle-le.'),
    `data: ${JSON.stringify({ type: 'fin', fiches: 24, web: 4 })}\n\n`,
  ])

  assert.deepEqual(vus, [
    { type: 'delta', text: 'Bonjour ! ' },
    { type: 'delta', text: 'Pour un plombier ' },
    { type: 'delta', text: 'à Saint-Denis, appelle-le.' },
    { type: 'fin', fiches: 24, web: 4 },
  ])
})

test('un événement coupé en deux paquets n’est pas perdu', async () => {
  // Coupé au pire endroit : au milieu du nom de l'événement.
  const vus = await collecter([
    'data: {"type":"del',
    'ta","text":"Bon"}\n\ndata: {"type":"delta","text":"jour"}\n\nda',
    'ta: {"type":"fin","fiches":3,"web":0}\n\n',
  ])

  assert.deepEqual(vus, [
    { type: 'delta', text: 'Bon' },
    { type: 'delta', text: 'jour' },
    { type: 'fin', fiches: 3, web: 0 },
  ])
})

test('deux événements collés dans un même paquet sont tous les deux vus', async () => {
  const vus = await collecter([delta('a') + delta('b') + delta('c')])
  assert.deepEqual(vus.map((e) => e.text), ['a', 'b', 'c'])
})

test('un accent à cheval sur deux paquets reste lisible', async () => {
  // « Réunion » : on coupe les OCTETS au milieu du « é » (0xC3 0xA9).
  const charge = encodeur.encode(delta('Réunion'))
  const coupe = charge.findIndex((octet, i) => octet === 0xc3 && charge[i + 1] === 0xa9)
  assert.ok(coupe > 0, 'le « é » est bien présent en UTF-8')

  const vus = await collecter([charge.slice(0, coupe + 1), charge.slice(coupe + 1)])
  assert.deepEqual(vus, [{ type: 'delta', text: 'Réunion' }])
})

test('les lignes qui ne disent rien sont sautées, pas fatales', async () => {
  const vus = await collecter([
    ': keep-alive\n\n',
    'event: ping\n\n',
    'data:\n\n',
    'data: [DONE]\n\n',
    'data: {ceci nest pas du json\n\n',
    'data: {"type":"inconnu","text":"ignoré"}\n\n',
    delta('seul ceci compte'),
  ])

  assert.deepEqual(vus, [{ type: 'delta', text: 'seul ceci compte' }])
})

test('un flux qui s’arrête sans nouvelle ligne finale rend quand même son dernier morceau', async () => {
  const vus = await collecter([delta('début'), 'data: {"type":"delta","text":"fin sans retour ligne"}'])
  assert.deepEqual(vus.map((e) => e.text), ['début', 'fin sans retour ligne'])
})

test('une erreur du serveur porte son message — et reste valable sans message', async () => {
  const vus = await collecter([
    delta('à moitié'),
    'data: {"type":"erreur","message":"L\'assistant s\'est interrompu en route."}\n\n',
  ])
  assert.deepEqual(vus, [
    { type: 'delta', text: 'à moitié' },
    { type: 'erreur', message: "L'assistant s'est interrompu en route." },
  ])

  const sansMessage = await collecter(['data: {"type":"erreur"}\n\n'])
  assert.deepEqual(sansMessage, [{ type: 'erreur', message: undefined }])
})

test('s’arrêter en cours de route relâche la connexion', async () => {
  let annule = false
  const sansFin = new ReadableStream({
    start(controleur) {
      controleur.enqueue(encodeur.encode(delta('le visiteur a changé d’avis')))
      // Le flux reste ouvert : c'est exactement le cas d'une réponse en cours.
    },
    cancel() {
      annule = true
    },
  })

  for await (const _ of lireFlux(sansFin)) break

  assert.equal(annule, true, 'le lecteur doit être annulé quand on cesse de lire')
})
