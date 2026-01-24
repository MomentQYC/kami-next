import type { FC } from 'react'
import { memo, useRef } from 'react'

import { CustomLogo, DefaultLogo } from '~/components/common/Logo'
import { useKamiConfig } from '~/hooks/app/use-initial-data'

const Loader: FC = memo(() => {
  const ref = useRef<HTMLDivElement>(null)
  const {
    site: { splashScreenLogo, logoSvg },
  } = useKamiConfig()

  const logoContent = splashScreenLogo || logoSvg

  const renderLogo = () => {
    if (logoContent) {
      return (
        <div
          className="animation"
          style={{ height: '150px' }}
          onAnimationEnd={(e) => {
            ref.current?.remove()
            ;(e.target as any)?.remove()
          }}
          dangerouslySetInnerHTML={{ __html: logoContent }}
        />
      )
    }
    return (
      <DefaultLogo
        className="animation"
        height="150px"
        onAnimationEnd={(e) => {
          ref.current?.remove()
          ;(e.target as any)?.remove()
        }}
      />
    )
  }

  return (
    <>
      <div className="loader" ref={ref} />
      <div className="loader-logo">{renderLogo()}</div>
    </>
  )
})

export default Loader
