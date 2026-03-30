import markdownEscape from 'markdown-escape'
import type { FC } from 'react'
import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { message } from 'react-message-popup'
import isEmail from 'validator/lib/isEmail'
import isUrl from 'validator/lib/isURL'
import { createStore, useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { useIsLogged, useUserStore } from '~/atoms/user'
import { ImpressionView } from '~/components/common/ImpressionView'
import { Button } from '~/components/ui/Button'
import { FloatPopover } from '~/components/ui/FloatPopover'
import {
  GridiconsNoticeOutline,
  MdiEmailFastOutline,
  PhUser,
  SiGlyphGlobal,
} from '~/components/ui/Icons/for-comment'
import { Input } from '~/components/ui/Input'
import { kaomoji } from '~/constants/kaomoji'
import { TrackerAction } from '~/constants/tracker'
import { useAnalyze } from '~/hooks/app/use-analyze'
import { useSyncEffectOnce } from '~/hooks/common/use-sync-effect'
import { omit, pick, sample } from '~/utils/_'
import { apiClient } from '~/utils/client'
import { isClientSide, isDev } from '~/utils/env'

import styles from './index.module.css'

const USER_PREFIX = 'mx-space-comment-author'
const USER_DRAFT = 'mx-space-comment-draft'

const initialConfig = {
  syncToRecently: false,
  isWhispers: false,
}

const initialState = {
  author: '',
  mail: '',
  url: '',
  text: '',

  ...initialConfig,
}

const createCommentState = () =>
  createStore<
    typeof initialState & {
      setConfig(config: Partial<typeof initialConfig>): void
    }
  >((setState) => ({
    ...initialState,
    setConfig(config: Partial<typeof initialConfig>) {
      setState(config)
    },
  }))

type CommentStore = ReturnType<typeof createCommentState>

const FormInputCopyMap = {
  author: '昵称 *',
  mail: '邮箱 *',
  url: '网址',
}
const FormInputIconMap = {
  author: <PhUser />,
  mail: <MdiEmailFastOutline />,
  url: <SiGlyphGlobal />,
}
const FormInput: FC<{
  fieldKey: 'author' | 'mail' | 'url'
  store: CommentStore
}> = (props) => {
  const { fieldKey, store } = props
  const value = useStore(store, (state) => state[fieldKey])
  const onChange = useCallback(
    (e) => {
      store.setState({ [fieldKey]: e.target.value })
    },
    [fieldKey, store],
  )
  return (
    <Input
      placeholder={FormInputCopyMap[fieldKey]}
      required
      name={fieldKey}
      prefix={FormInputIconMap[fieldKey]}
      value={value}
      onChange={onChange}
    />
  )
}

export const CommentBox: FC<{
  onSubmit: (model: any) => Promise<any>
  onCancel?: () => any
  autoFocus?: boolean

  refId: string
  commentId?: string
}> = memo(({ onSubmit, onCancel, autoFocus = false, refId, commentId }) => {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const commentStore = useMemo(() => createCommentState(), [])

  useEffect(() => {
    if (isDev && isClientSide()) {
      commentStore.setState({
        author: '测试昵称',
        mail: 'test@innei.ren',
        url: 'https://test.innei.ren',
      })
    }
  }, [commentStore])

  useEffect(() => {
    const $ref = taRef.current
    if ($ref) {
      const setText = (text: string) => commentStore.setState({ text })
      if (isDev) {
        const testText =
          '幻なんかじゃない 人生は夢じゃない 僕達ははっきりと生きてるんだ'
        $ref.value = testText
        setText(testText)
      } else {
        const draftText = localStorage.getItem(USER_DRAFT) ?? ''
        $ref.value = draftText
        setText(draftText)
      }
    }

    return () => {
      if ($ref && $ref.value) {
        localStorage.setItem(USER_DRAFT, $ref.value)
      }
    }
  }, [])

  const reset = () => {
    if (taRef.current) {
      taRef.current.value = ''

      commentStore.setState({
        text: '',
      })
    }
  }

  const handleInsertEmoji = useCallback((emoji: string) => {
    if (!taRef.current) {
      return
    }

    const $ta = taRef.current
    const start = $ta.selectionStart
    const end = $ta.selectionEnd

    $ta.value = `${$ta.value.substring(
      0,
      start,
    )} ${emoji} ${$ta.value.substring(end, $ta.value.length)}`

    commentStore.setState({ text: $ta.value })
    requestAnimationFrame(() => {
      const shouldMoveToPos = start + emoji.length + 2
      $ta.selectionStart = shouldMoveToPos
      $ta.selectionEnd = shouldMoveToPos

      $ta.focus()
    })
  }, [commentStore])

  const handleCancel = () => {
    onCancel?.()
    reset()
  }

  const handleSubmit = () => {
    if (!taRef.current) {
      return
    }
    const text = taRef.current.value
    const { username: ownerUserName, name: ownerName } =
      useUserStore.getState().master || {}
    const logged = useUserStore.getState().isLogged
    const { author, mail, url, isWhispers, syncToRecently } =
      commentStore.getState()
    if (!logged) {
      if (author === ownerName || author === ownerUserName) {
        return message.error('昵称与我主人重名了，但是你好像并不是我的主人唉')
      }
      if (!author || !text || !mail) {
        message.error('小可爱，能把信息填完整么')
        return
      }
      if (url && !isUrl(url, { require_protocol: true })) {
        message.error('小可爱，网址格式不正确哦')
        return
      }
      if (!isEmail(mail)) {
        message.error('小可爱，邮箱格式不正确哦')
        return
      }
      if (author.length > 20) {
        message.error('昵称太长了了啦，服务器会坏掉的')
        return
      }
    }

    if (text.length > 500) {
      message.error('内容太长了了啦，服务器会坏掉的')
      return
    }

    const model = {
      author,
      text,
      mail,
      url: url || undefined,
      isWhispers,
    }
    localStorage.setItem(USER_PREFIX, JSON.stringify(omit(model, ['text'])))
    onSubmit(model).then(() => {
      if (syncToRecently) {
        apiClient.recently.proxy.post({
          data: {
            content: text,
            ref: refId,
          },
        })
      }

      reset()
    })
  }
  useEffect(() => {
    const store = localStorage.getItem(USER_PREFIX)
    if (store) {
      try {
        const model = JSON.parse(store) as {
          author: string
          mail: string
          url: string
        }
        for (const key in model) {
          if ((model as any)[key] === 'undefined') {
            ;(model as any)[key] = ''
          }
        }
        commentStore.setState(model)
      } catch {}
    }
  }, [commentStore])

  const setWrapper = useCallback((fn: (value: string) => void) => {
    return (e: any) => {
      fn(e.target.value)
    }
  }, [])

  const noticeOnce = useRef(false)

  const handleCommentBoxClick = useCallback(() => {
    const isLogged = useUserStore.getState().isLogged
    if (isLogged) {
      return
    }
    if (!noticeOnce.current) {
      message.warn('欧尼酱，文明发言哦，否则评论会被移入垃圾箱哦')
      noticeOnce.current = true
    }
  }, [])

  const logged = useIsLogged()

  const setter = useMemo(
    () =>
      ['author', 'mail', 'url', 'text'].reduce((acc, key) => {
        acc[key] = setWrapper((e) => {
          commentStore.setState({ [key]: e })
        })
        return acc
      }, {} as any),
    [commentStore, setWrapper],
  )

  const isWhispers = useStore(commentStore, (state) => state.isWhispers)
  const text = useStore(commentStore, (state) => state.text)

  return (
    <div className="my-4">
      {!logged && (
        <div className={styles['comment-box-head']}>
          <FormInput fieldKey="author" store={commentStore} />
          <FormInput fieldKey="mail" store={commentStore} />
          <FormInput fieldKey="url" store={commentStore} />
        </div>
      )}
      <Input
        // @ts-ignore
        ref={taRef}
        multi
        maxLength={500}
        // @ts-ignore
        rows={4}
        required
        onChange={setter['text']}
        autoFocus={autoFocus}
        onClick={handleCommentBoxClick}
        wrapperProps={useMemo(
          () => ({
            className: isWhispers ? styles['whispers-input'] : '',
          }),
          [isWhispers],
        )}
        placeholder={
          !logged
            ? '嘿 ︿(￣︶￣)︿, 留个评论好不好嘛~'
            : '主人，说点什么好呢？'
        }
      />

      <div className="relative mt-2 flex flex-wrap items-center justify-between">
        <div className="flex flex-shrink-0 items-center space-x-2">
          <MarkdownSupport />
          <KaomojiButton onClickKaomoji={handleInsertEmoji} />
        </div>

        <div className="flex flex-shrink-0 items-center whitespace-nowrap">
          <CommentBoxOption
            refId={refId}
            commentId={commentId}
            store={commentStore}
          />

          {onCancel && (
            <Button
              className="btn !border-red !text-red !bg-transparent"
              onClick={handleCancel}
            >
              取消回复
            </Button>
          )}
          <Button
            className="btn ml-[12px]"
            onClick={handleSubmit}
            disabled={text.trim().length === 0}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  )
})

const CommentBoxOption: FC<{
  commentId?: string
  refId: string
  store: CommentStore
}> = (props) => {
  const isLogged = useIsLogged()
  const { store } = props
  const { syncToRecently, isWhispers } = useStore(
    store,
    useShallow((state) => pick(state, ['syncToRecently', 'isWhispers'])),
  )
  const setConfig = store.getState().setConfig
  const isReply = !!props.commentId

  return (
    <>
      {isLogged && !isReply && (
        <fieldset className="children:cursor-pointer inline-flex items-center">
          <input
            type="checkbox"
            id="comment-box-sync"
            checked={syncToRecently}
            onChange={(e) => {
              setConfig({ syncToRecently: e.target.checked })
            }}
          />
          <label htmlFor="comment-box-sync" className="text-shizuku">
            同步到速记
          </label>
        </fieldset>
      )}
      {!isLogged && !isReply && (
        <fieldset className="children:cursor-pointer inline-flex items-center">
          <input
            type="checkbox"
            id="comment-box-whispers"
            checked={isWhispers}
            onChange={(e) => {
              setConfig({ isWhispers: e.target.checked })
            }}
          />
          <label htmlFor="comment-box-whispers" className="text-shizuku">
            悄悄话
          </label>
        </fieldset>
      )}
    </>
  )
}
const MarkdownSupport = () => {
  return (
    <FloatPopover
      triggerComponent={
        useRef(() => (
          <Button
            aria-label="support markdown"
            className="btn !text-secondary pointer-events-none mr-2 flex-shrink-0 cursor-not-allowed rounded-full border-[2px] !border-current !bg-transparent !p-2 text-lg"
          >
            <GridiconsNoticeOutline />
          </Button>
        )).current
      }
    >
      <div className="leading-7">
        <p>评论支持部分 Markdown 语法</p>
        <p>评论可能被移入垃圾箱</p>
        <p>评论可能需要审核，审核通过后才会显示</p>
      </div>
    </FloatPopover>
  )
}
const KaomojiButton: FC<{ onClickKaomoji: (kaomoji: string) => any }> = memo(
  ({ onClickKaomoji }) => {
    const { event } = useAnalyze()
    const [trackerOnce, setOnce] = useState(false)
    const randomKaomoji = useRef(sample(kaomoji))
    const handleTrack = useCallback(() => {
      setOnce(true)
    }, [])
    return (
      <FloatPopover
        trigger="both"
        wrapperClassNames="flex-shrink-0"
        triggerComponent={memo(() => (
          <Button className="btn !bg-secondary mr-[12px] cursor-pointer">
            {randomKaomoji.current}
          </Button>
        ))}
      >
        <ImpressionView
          shouldTrack={!trackerOnce}
          trackerMessage="曝光 Kaomoji 面板"
          onTrack={handleTrack}
        >
          <div className="h-[300px] max-h-[50vh] w-[300px] max-w-[80vw] overflow-auto">
            {kaomoji.map((emoji, i) => (
              <Button
                aria-label="kaomoji panel"
                className="!text-secondary !bg-transparent p-2"
                key={i}
                onClick={() => {
                  event({
                    action: TrackerAction.Click,
                    label: 'Kaomoji',
                  })
                  onClickKaomoji(markdownEscape(emoji))
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </ImpressionView>
      </FloatPopover>
    )
  },
)
