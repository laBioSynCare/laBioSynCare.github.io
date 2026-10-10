import { error } from '@sveltejs/kit'
import { MANUAL_IDS, getManualChapter } from '../../../ui/manual/chapters.js'

export function entries() {
  return MANUAL_IDS.map(chapter => ({ chapter }))
}

export function load({ params }) {
  const chapter = getManualChapter(params.chapter)
  if (!chapter) error(404, 'Manual chapter not found')
  return { chapter }
}
