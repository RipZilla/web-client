/* ==========================================================================
   Product categories
   --------------------------------------------------------------------------
   Pokémon is the only category with shipped tools. The rest are visible and
   clickable on purpose — selecting one re-themes the app and shows an
   in-development panel, so the roadmap is legible instead of hidden.

   To launch a category: flip `available` to true and give it tools.
   ========================================================================== */

export const CATEGORIES = [
  {
    id: 'pokemon',
    label: 'Pokémon',
    available: true,
    blurb: 'Break reports, card sets, and the Whatnot stream schedule.',
  },
  {
    id: 'nba',
    label: 'NBA',
    available: false,
    blurb: 'Basketball break reports and roster-aware card sets are being built now.',
  },
  {
    id: 'nfl',
    label: 'NFL',
    available: false,
    blurb: 'Football break reports and card set tooling are being built now.',
  },
  {
    id: 'bullion',
    label: 'Gold & Bullion',
    available: false,
    blurb: 'Spot-price tracking and bullion lot reporting are being built now.',
  },
]

export const DEFAULT_CATEGORY = 'pokemon'

const STORAGE_KEY = 'rz.category'

export function getCategory(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]
}

/** Remembered across reloads so the workspace opens where you left it. */
export function loadCategory() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && CATEGORIES.some(c => c.id === saved)) return saved
  } catch { /* ignore */ }
  return DEFAULT_CATEGORY
}

export function saveCategory(id) {
  try { window.localStorage.setItem(STORAGE_KEY, id) } catch { /* ignore */ }
}

/** Paint the theme by setting the attribute the CSS keys off. */
export function applyCategoryTheme(id) {
  document.documentElement.dataset.category = id
}
