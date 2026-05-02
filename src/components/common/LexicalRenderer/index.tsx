import type { FC, ReactNode } from 'react'
import React, { Fragment, memo } from 'react'

import { CodeBlock } from '~/components/common/CodeBlock'

import styles from '~/components/ui/Markdown/index.module.css'

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  format?: number | string
  tag?: string
  url?: string
  listType?: 'bullet' | 'number'
  value?: number
  language?: string
  textFormat?: number
}

type LexicalRoot = {
  root?: LexicalNode
}

const TEXT_BOLD = 1
const TEXT_ITALIC = 1 << 1
const TEXT_STRIKETHROUGH = 1 << 2
const TEXT_UNDERLINE = 1 << 3
const TEXT_CODE = 1 << 4

export const LexicalRenderer: FC<{ content?: string | null }> = memo(
  ({ content }) => {
    const root = parseLexicalRoot(content)

    if (!root) {
      return null
    }

    return (
      <div id="write" className={styles['md']}>
        {renderChildren(root.children)}
      </div>
    )
  },
)

const parseLexicalRoot = (content?: string | null) => {
  if (!content) {
    return null
  }

  try {
    const parsed = JSON.parse(content) as LexicalRoot

    return parsed.root || null
  } catch {
    return null
  }
}

const renderChildren = (children?: LexicalNode[]) =>
  children?.map((child, index) => renderNode(child, index)) || null

const renderNode = (node: LexicalNode, index: number): ReactNode => {
  const key = index

  switch (node.type) {
    case 'root':
      return <Fragment key={key}>{renderChildren(node.children)}</Fragment>
    case 'paragraph':
      return renderParagraph(node, key)
    case 'heading':
      return renderHeading(node, key)
    case 'quote':
      return <blockquote key={key}>{renderChildren(node.children)}</blockquote>
    case 'list':
      return renderList(node, key)
    case 'listitem':
      return <li key={key}>{renderChildren(node.children)}</li>
    case 'link':
    case 'autolink':
      return (
        <a href={node.url} key={key} rel="noopener noreferrer" target="_blank">
          {renderChildren(node.children)}
        </a>
      )
    case 'linebreak':
      return <br key={key} />
    case 'code':
      return (
        <CodeBlock
          key={key}
          content={collectText(node)}
          lang={node.language}
        />
      )
    case 'text':
      return renderText(node, key)
    default:
      return <Fragment key={key}>{renderChildren(node.children)}</Fragment>
  }
}

const renderParagraph = (node: LexicalNode, key: number) => {
  if (!node.children?.length) {
    return <p key={key} />
  }

  if (node.children.some(isBlockNode)) {
    return <Fragment key={key}>{renderChildren(node.children)}</Fragment>
  }

  return <p key={key}>{renderChildren(node.children)}</p>
}

const isBlockNode = (node: LexicalNode) =>
  node.type === 'paragraph' ||
  node.type === 'heading' ||
  node.type === 'quote' ||
  node.type === 'list' ||
  node.type === 'code'

const renderHeading = (node: LexicalNode, key: number) => {
  const tag = isHeadingTag(node.tag) ? node.tag : 'h2'

  return React.createElement(tag, { key }, renderChildren(node.children))
}

const isHeadingTag = (tag?: string): tag is `h${1 | 2 | 3 | 4 | 5 | 6}` =>
  tag === 'h1' ||
  tag === 'h2' ||
  tag === 'h3' ||
  tag === 'h4' ||
  tag === 'h5' ||
  tag === 'h6'

const renderList = (node: LexicalNode, key: number) => {
  const Tag = node.listType === 'number' ? 'ol' : 'ul'

  return (
    <Tag key={key} start={node.value}>
      {renderChildren(node.children)}
    </Tag>
  )
}

const renderText = (node: LexicalNode, key: number) => {
  let element: ReactNode = node.text || ''
  const format = Number(node.format || node.textFormat || 0)

  if (format & TEXT_CODE) {
    element = <code>{element}</code>
  }
  if (format & TEXT_BOLD) {
    element = <strong>{element}</strong>
  }
  if (format & TEXT_ITALIC) {
    element = <em>{element}</em>
  }
  if (format & TEXT_UNDERLINE) {
    element = <u>{element}</u>
  }
  if (format & TEXT_STRIKETHROUGH) {
    element = <s>{element}</s>
  }

  return <Fragment key={key}>{element}</Fragment>
}

const collectText = (node: LexicalNode): string => {
  if (node.text) {
    return node.text
  }

  return node.children?.map(collectText).join('') || ''
}
