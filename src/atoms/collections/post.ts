import type { ModelWithLiked, PostModel } from '@mx-space/api-client'

import { apiClient } from '~/utils/client'

import { createCollection } from './utils/base'

interface IPostCollection {
  fetchBySlug(
    category: string,
    slug: string,
  ): Promise<ModelWithLiked<PostModel>>
  up(id: string): void
}
export const usePostCollection = createCollection<PostModel, IPostCollection>(
  'post',
  (setState, getState) => {
    return {
      async fetchBySlug(category, slug) {
        const data = await apiClient.post.getPost(
          category,
          encodeURIComponent(slug),
        )
        getState().add(data)
        return data
      },
      up(id: string) {
        setState((state) => {
          const post = state.data.get(id)
          if (post) {
            post.count.like += 1
          }
        })
      },
    }
  },
)
