import type { SpringOptions } from 'framer-motion'

export const reboundPreset: SpringOptions = {
  bounce: 10,
  stiffness: 140,
  damping: 8,
}

export const microdampingPreset: SpringOptions = {
  damping: 24,
}

export const microReboundPreset: SpringOptions = {
  stiffness: 300,
  damping: 20,
}
