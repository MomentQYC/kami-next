import { useEffect } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

const useHeaderMetaStore = create<{
  title: string
  meta: string
  show: boolean
}>(() => ({
  title: '',
  meta: '',
  show: false,
}))
/**
 * 设置头部 信息 (标题) 分享等操作
 */
export const useSetHeaderMeta = (title: string, description: string) => {
  useEffect(() => {
    useHeaderMetaStore.setState({
      title,
      meta: description,
      show: true,
    })
  }, [description, title])

  useEffect(() => {
    return () => {
      useHeaderMetaStore.setState({
        show: false,
      })
    }
  }, [])
}
export const useGetHeaderMeta = () => {
  return useHeaderMetaStore(
    useShallow((state) => ({ title: state.title, meta: state.meta, show: state.show }))
  )
}

const useShareDataStore = create<{
  title: string
  text?: string
  url: string
}>(() => ({
  title: '',
  text: '' as string | undefined,
  url: '',
}))

export const useSetHeaderShare = (title: string, text?: string) => {
  useEffect(() => {
    useShareDataStore.setState({
      text,
      title,
      url: location.href,
    })
  }, [title, text])

  useEffect(() => {
    return () => {
      useShareDataStore.setState({
        title: '',
        text: '',
        url: '',
      })
    }
  }, [])
}

export const useGetHeaderShare = () => {
  return useShareDataStore(
    useShallow((state) => ({ title: state.title, text: state.text, url: state.url }))
  )
}
