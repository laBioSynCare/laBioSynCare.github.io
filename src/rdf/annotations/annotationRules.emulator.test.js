// The Firestore rules for annotations, executed (GB-03).
//
//     make firestore-rules-test
//
// Runs only under the Firestore emulator, which `firebase emulators:exec` starts
// and announces through FIRESTORE_EMULATOR_HOST; elsewhere the suite is skipped.
// The point is what a file read cannot show: that a signed-out reader gets no
// account ID from any query the rules allow, that only a note's author can
// publish, change or withdraw its public copy, and that the store's own writes,
// the legacy move included, pass the rules they were written for.

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteApp, initializeApp } from 'firebase/app'
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

// The store refreshes the signed-in user's token before a signed write; the
// emulator's mock tokens need no refresh.
vi.mock('../../firebase/client.js', () => ({
  isFirebaseConfigured: () => true,
  requireFirebaseClient: async () => ({ auth: { currentUser: null } }),
}))

const { AnnotationStore, LEGACY_ANNOTATION_COLLECTION, PUBLIC_ANNOTATION_COLLECTION } =
  await import('./AnnotationStore.js')
const { authorKeyFor } = await import('./annotationRdf.js')

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST
const PROJECT = process.env.GCLOUD_PROJECT || 'demo-sstim'
const TARGET = 'https://w3id.org/sstim#Preset'

const apps = []
function client(name, token) {
  const app = initializeApp({ projectId: PROJECT }, `${name}-${apps.length}`)
  apps.push(app)
  const db = getFirestore(app)
  const [host, port] = EMULATOR.split(':')
  connectFirestoreEmulator(db, host, Number(port), token ? { mockUserToken: token } : undefined)
  return db
}

async function denied(promise) {
  await expect(promise).rejects.toMatchObject({ code: 'permission-denied' })
}

// Writes as the database owner, which the rules do not apply to: the state an
// old client left behind.
async function seedLegacy(id, fields) {
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { stringValue: v }])) }
  const url = `http://${EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents/${LEGACY_ANNOTATION_COLLECTION}?documentId=${id}`
  const response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`seeding ${id}: ${response.status} ${await response.text()}`)
}

describe.skipIf(!EMULATOR)('annotation rules under the Firestore emulator (GB-03)', () => {
  let alice
  let bob
  let reader
  let aliceStore
  let bobStore

  beforeAll(() => {
    alice = client('alice', { user_id: 'alice', email: 'alice@example.org', name: 'Alice Liddell' })
    // An account whose name is its email's local part, as accounts created before
    // 2026-10-07 without a name ended up with.
    bob = client('bob', { user_id: 'bob', email: 'bob@example.org', name: 'bob' })
    reader = client('reader', null)
    aliceStore = new AnnotationStore('alice', alice)
    bobStore = new AnnotationStore('bob', bob)
  })

  beforeEach(async () => {
    await fetch(`http://${EMULATOR}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' })
  })

  afterAll(async () => {
    await Promise.all(apps.map((app) => deleteApp(app)))
  })

  const publicCopies = (db) =>
    getDocs(query(collection(db, PUBLIC_ANNOTATION_COLLECTION), where('targetIri', '==', TARGET)))

  it('a public note reaches a signed-out reader with no account ID and no name', async () => {
    const id = await aliceStore.add({ annotatesNode: TARGET, annotationText: 'Seen by all.', visibility: 'public' })
    const copies = await publicCopies(reader)
    expect(copies.docs.map((d) => d.id)).toEqual([id])
    const data = copies.docs[0].data()
    expect(Object.keys(data).sort()).toEqual(['annotationText', 'annotationType', 'authorKey', 'authorName', 'createdAt', 'targetIri', 'updatedAt'])
    expect(data.authorName).toBe('')
    expect(JSON.stringify(data)).not.toContain('alice')
    expect(data.authorKey).toMatch(/^[0-9a-f]{64}$/)
  })

  it('a reader cannot tell that two anonymous notes share an author', async () => {
    await aliceStore.add({ annotatesNode: TARGET, annotationText: 'One.', visibility: 'public' })
    await aliceStore.add({ annotatesNode: TARGET, annotationText: 'Two.', visibility: 'public' })
    const keys = (await publicCopies(reader)).docs.map((d) => d.data().authorKey)
    expect(new Set(keys).size).toBe(2)
  })

  it('a signed note carries the account name, and only by the author’s choice', async () => {
    await aliceStore.add({
      annotatesNode: TARGET, annotationText: 'Signed.', visibility: 'public', showName: true, authorName: 'Alice Liddell',
    })
    const [copy] = (await publicCopies(reader)).docs
    expect(copy.data().authorName).toBe('Alice Liddell')

    // A name other than the account's is refused.
    await denied(aliceStore.add({
      annotatesNode: TARGET, annotationText: 'Spoofed.', visibility: 'public', showName: true, authorName: 'Mallory',
    }))
    // So is the email address's local part, even when it is the account's name.
    await denied(bobStore.add({
      annotatesNode: TARGET, annotationText: 'Signed bob.', visibility: 'public', showName: true, authorName: 'bob',
    }))
  })

  it('a private note has no public copy, and nobody else can read it', async () => {
    const id = await aliceStore.add({ annotatesNode: TARGET, annotationText: 'Mine.', visibility: 'private' })
    expect((await publicCopies(reader)).size).toBe(0)
    await denied(getDoc(doc(reader, 'users', 'alice', 'annotations', id)))
    await denied(getDoc(doc(bob, 'users', 'alice', 'annotations', id)))
    expect((await getDoc(doc(alice, 'users', 'alice', 'annotations', id))).data().annotationText).toBe('Mine.')
  })

  it('a note that was never public can still be edited and deleted', async () => {
    // Both writes also delete a public copy that does not exist.
    const id = await aliceStore.add({ annotatesNode: TARGET, annotationText: 'Draft.', visibility: 'private' })
    await aliceStore.update(id, { annotationText: 'Redrafted.', visibility: 'private' })
    expect((await getDoc(doc(alice, 'users', 'alice', 'annotations', id))).data().annotationText).toBe('Redrafted.')
    await aliceStore.remove(id)
    expect((await getDoc(doc(alice, 'users', 'alice', 'annotations', id))).exists()).toBe(false)
  })

  it('a public copy is refused unless it matches its author’s public record', async () => {
    const own = doc(alice, 'users', 'alice', 'annotations', 'n1')
    const copy = doc(alice, PUBLIC_ANNOTATION_COLLECTION, 'n1')
    const record = { targetIri: TARGET, annotationType: 'commenting', annotationText: 'Text.', visibility: 'public', showName: false }
    const shown = {
      targetIri: TARGET, annotationType: 'commenting', annotationText: 'Text.', authorName: '',
      authorKey: await authorKeyFor('alice', 'n1'),
    }

    // With an account ID in it.
    let batch = writeBatch(alice)
    batch.set(own, record)
    batch.set(copy, { ...shown, userId: 'alice' })
    await denied(batch.commit())
    // For a record that is private.
    batch = writeBatch(alice)
    batch.set(own, { ...record, visibility: 'private' })
    batch.set(copy, shown)
    await denied(batch.commit())
    // With text the record does not hold.
    batch = writeBatch(alice)
    batch.set(own, record)
    batch.set(copy, { ...shown, annotationText: 'Other text.' })
    await denied(batch.commit())
    // Signed though the record says unsigned.
    batch = writeBatch(alice)
    batch.set(own, record)
    batch.set(copy, { ...shown, authorName: 'Alice Liddell' })
    await denied(batch.commit())
    // With no record at all.
    await denied(setDoc(copy, shown))
    // With a key that is not this author's.
    batch = writeBatch(alice)
    batch.set(own, record)
    batch.set(copy, { ...shown, authorKey: await authorKeyFor('bob', 'n1') })
    await denied(batch.commit())
    // The control: the same copy, correct in every field, passes.
    batch = writeBatch(alice)
    batch.set(own, record)
    batch.set(copy, shown)
    await batch.commit()
  })

  it('only the author can change or withdraw a public copy', async () => {
    const id = await aliceStore.add({ annotatesNode: TARGET, annotationText: 'Alice’s.', visibility: 'public' })
    const copyAsBob = doc(bob, PUBLIC_ANNOTATION_COLLECTION, id)
    const defaced = {
      targetIri: TARGET, annotationType: 'commenting', annotationText: 'Defaced.', authorName: '',
      authorKey: await authorKeyFor('bob', id),
    }
    await denied(setDoc(copyAsBob, defaced))
    await denied(writeBatch(bob).delete(copyAsBob).commit())
    // Bob holding a record under the same id proves nothing about Alice's copy.
    await setDoc(doc(bob, 'users', 'bob', 'annotations', id), {
      targetIri: TARGET, annotationType: 'commenting', annotationText: 'Defaced.', visibility: 'public', showName: false,
    })
    await denied(setDoc(copyAsBob, defaced))
    await denied(writeBatch(bob).delete(copyAsBob).commit())
    expect((await getDoc(doc(reader, PUBLIC_ANNOTATION_COLLECTION, id))).data().annotationText).toBe('Alice’s.')
  })

  it('making a note private withdraws its copy, and deleting removes both', async () => {
    const id = await aliceStore.add({ annotatesNode: TARGET, annotationText: 'For now.', visibility: 'public' })
    await aliceStore.update(id, { annotationText: 'For now.', visibility: 'private' })
    expect((await publicCopies(reader)).size).toBe(0)
    await aliceStore.update(id, { annotationText: 'Again.', visibility: 'public', showName: true, authorName: 'Alice Liddell' })
    expect((await publicCopies(reader)).docs[0].data()).toMatchObject({ annotationText: 'Again.', authorName: 'Alice Liddell' })
    // Edited while public, and unsigned again.
    await aliceStore.update(id, { annotationText: 'Edited.', visibility: 'public', showName: false, authorName: 'Alice Liddell' })
    expect((await publicCopies(reader)).docs[0].data()).toMatchObject({ annotationText: 'Edited.', authorName: '' })
    await aliceStore.remove(id)
    expect((await publicCopies(reader)).size).toBe(0)
    expect((await getDoc(doc(alice, 'users', 'alice', 'annotations', id))).exists()).toBe(false)
  })

  it('an owner’s legacy documents move to the new shape, public ones unsigned', async () => {
    const legacy = {
      userId: 'alice', userDisplayName: 'alice', targetIri: TARGET, annotationType: 'commenting', annotationText: 'Old.',
    }
    await seedLegacy('legacy-private', { ...legacy, visibility: 'private' })
    await seedLegacy('legacy-public', { ...legacy, visibility: 'public' })
    await seedLegacy('legacy-bob', { ...legacy, userId: 'bob', visibility: 'private' })

    // A fresh store, as on the owner's next visit.
    expect(await new AnnotationStore('alice', alice).migrateLegacy()).toBe(2)
    for (const id of ['legacy-private', 'legacy-public']) {
      const own = await getDoc(doc(alice, 'users', 'alice', 'annotations', id))
      expect(own.data()).toMatchObject({ annotationText: 'Old.', showName: false })
      expect(own.data()).not.toHaveProperty('userId')
    }
    const copies = await publicCopies(reader)
    expect(copies.docs.map((d) => d.id)).toEqual(['legacy-public'])
    expect(copies.docs[0].data().authorName).toBe('')
    // Alice's legacy documents are gone; Bob's is untouched and not hers to read.
    expect((await getDocs(query(collection(alice, LEGACY_ANNOTATION_COLLECTION), where('userId', '==', 'alice')))).size).toBe(0)
    await denied(getDoc(doc(alice, LEGACY_ANNOTATION_COLLECTION, 'legacy-bob')))
  })

  it('an own record holds only its fields', async () => {
    const own = doc(alice, 'users', 'alice', 'annotations', 'x')
    const record = { targetIri: TARGET, annotationType: 'commenting', annotationText: 'Text.', visibility: 'private', showName: false }
    await denied(setDoc(own, { ...record, userId: 'alice' }))
    await denied(setDoc(own, { ...record, visibility: 'friends' }))
    await denied(setDoc(own, { ...record, annotationText: '' }))
    await setDoc(own, { ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  })
})
