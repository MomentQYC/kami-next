import type { FC, MouseEventHandler } from 'react'
import { memo, useCallback } from 'react'

import { useCommentCollection } from '~/atoms/collections/comment'
import { springScrollToElement } from '~/utils/spring'

export const CommentAtRender: FC<{ id: string }> = memo(({ id: value }) => {
  const comment = useCommentCollection((state) => state.data.get(value))

  const onMouseOver: MouseEventHandler<HTMLAnchorElement> = useCallback(() => {
    if (comment?.id) {
      useCommentCollection.getState().setHighlightCommnet(comment.id)
    }
  }, [comment?.id])

  const onClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault()

    const $el = document.getElementById(`comments-${comment?.id}`)

    $el && springScrollToElement($el, -120)
  }
  const onLeave: MouseEventHandler<HTMLAnchorElement> = useCallback(() => {
    if (comment?.id) {
      useCommentCollection.getState().setHighlightCommnet(comment.id, false)
    }
  }, [comment?.id])

  if (!comment) {
    return null
  }
  return (
    <a
      href="javascript:;"
      className="text-primary mr-[12px]"
      onMouseOver={onMouseOver}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      @{comment.author}
    </a>
  )
})
