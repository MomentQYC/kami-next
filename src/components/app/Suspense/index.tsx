import type { FC, PropsWithChildren } from 'react'
import { Suspense as ReactSuspense } from 'react'

export const Suspense: FC<PropsWithChildren> = (props) => {
  return <ReactSuspense fallback={null}>{props.children}</ReactSuspense>
}
