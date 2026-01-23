import merge from 'lodash-es/merge'
import Head from 'next/head'
import type { NextSeoProps, OpenGraph } from 'next-seo/pages'
import { generateNextSeo } from 'next-seo/pages'
import type { FC } from 'react'
import { memo } from 'react'

import { useInitialData } from '~/hooks/app/use-initial-data'
import { useRandomImage } from '~/hooks/app/use-kami-theme'

type SEOProps = {
  title: string
  description?: string
  openGraph?: { type?: 'website' | 'article' } & OpenGraph
  image?: string
  canUseRandomImage?: boolean
} & NextSeoProps

export const Seo: FC<SEOProps> = memo((props) => {
  const {
    title,
    description,
    openGraph,
    image,
    canUseRandomImage = true,
    ...rest
  } = props

  const {
    url: { webUrl },
    seo,
    user,
  } = useInitialData()
  const nextTitle = `${title} - ${seo.title}`

  const [randomImage] = useRandomImage()

  const seoProps: NextSeoProps = {
    title,
    titleTemplate: `%s - ${seo.title}`,
    openGraph: merge(
      {
        profile: {
          username: user.name || user.username,
        },
        type: 'article',
        locale: 'zh-cn',
        siteName: seo.title || '',
        description: description || seo.description || user.introduce || '',
        article: {
          authors: [user.name],
        },
        title: nextTitle,
        images:
          image || canUseRandomImage
            ? [
                {
                  url: image || randomImage,
                  alt: `${title} - ${seo.title}`,
                },
              ]
            : void 0,
      } as OpenGraph,
      openGraph,
    ),
    description: description || seo.description || user.introduce || '',
    twitter: {
      cardType: 'summary',
      site: webUrl,
    },
    ...rest,
  }

  return <Head>{generateNextSeo(seoProps)}</Head>
})
