import type {
  HTMLMotionProps,
  inertia,
  keyframes,
  Spring,
  Tween,
  motion,
} from 'framer-motion'

export interface BaseTransitionProps extends HTMLMotionProps<'div'> {
  in?: boolean
  onExited?: () => void
  duration?: number
  onEntered?: () => void
  appear?: boolean
  timeout?: {
    exit?: number
    enter?: number
  }

  animation?: {
    enter?: Tween | Spring | typeof keyframes | typeof inertia
    exit?: Tween | Spring | typeof keyframes | typeof inertia
  }
  /**
   * @default true
   */
  useAnimatePresence?: boolean

  as?: keyof typeof motion
}
