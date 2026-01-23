import type { FC, PropsWithChildren } from 'react'

import { Divider } from '~/components/ui/Divider'

export const MFootNote: FC<PropsWithChildren> = (props) => {
  return (
    <div className="children:my-2 children:leading-6 children:text-base mt-4">
      <Divider />
      {props.children}
    </div>
  )
}
