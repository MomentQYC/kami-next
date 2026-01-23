import type { FC, PropsWithChildren } from 'react'

import { useDetectPadOrMobile } from '~/hooks/ui/use-viewport'

export const withDesktopOnly =
  <P extends {}>(Component: FC<P>): FC<PropsWithChildren<P>> =>
  ({ children, ...props }) => {
    const isDesktop = !useDetectPadOrMobile()

    if (!isDesktop) {
      return null
    }
    // @ts-ignore
    return <Component {...props}>{children}</Component>
  }
