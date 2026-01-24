import { useAppStore } from '~/atoms/app'
import { isClientSide } from '~/utils/env'

export const useDetectPadOrMobile = () => {
  const pad = useAppStore((state) => state.viewport.pad)
  const mobile = useAppStore((state) => state.viewport.mobile)
  return pad || mobile
}

export const useDetectIsNarrowThanLaptop = () => {
  const hpad = useAppStore((state) => state.viewport.hpad)
  const padOrMobile = useDetectPadOrMobile()
  return padOrMobile || hpad
}

export const useIsOverFirstScreenHeight = () => {
  const position = useAppStore((state) => state.position)
  const viewportH = useAppStore((state) => state.viewport.h)

  if (!isClientSide()) return false
  const screenHeight = viewportH || window.innerHeight
  return position > screenHeight
}

export const useIsOverPostTitleHeight = () => {
  const position = useAppStore((state) => state.position)
  const viewportH = useAppStore((state) => state.viewport.h)

  if (!isClientSide()) return false
  const threshold = Math.min(126, (viewportH || window.screen.height) / 3)
  return position > threshold
}
