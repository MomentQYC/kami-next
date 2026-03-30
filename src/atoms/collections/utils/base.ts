import { enableMapSet, immerable } from 'immer'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { isEqualObject } from '~/utils/_'

type Id = string

enableMapSet()

interface BaseStore<T extends object, TT = ModelWithDeleted<T>> {
  data: Map<Id, TT>
  add(id: string, data: T | T[]): void
  add(data: T | T[]): void
  addOrPatch(data: T | T[]): void
  remove(id: Id): void
  softDelete(key: string): boolean
}

export type ModelWithDeleted<T> = { isDeleted?: boolean } & T

type Setter<
  T extends {
    id: Id
  },
  A extends object,
> = (
  partial:
    | Partial<BaseStore<T> & A>
    | ((state: BaseStore<T> & A) => Partial<BaseStore<T> & A> | void),
  replace?: boolean,
) => void

// TODO ssr hydrate
export const createCollection = <T extends { id: Id }, A extends object>(
  name: string,
  actions?: A | ((set: Setter<T, A>, get: () => BaseStore<T> & A) => A),
) => {
  const data = new Map<Id, T>()
  data[immerable] = true

  return create(
    // persist(
    immer(
      // @ts-ignore
      subscribeWithSelector<BaseStore<T> & A>((set: Setter<T, A>, get) => ({
        data,

        softDelete(key) {
          const data = get().data.get(key)
          if (!data) {
            return false
          }

          set((state) => {
            const data = state.data.get(key)
            if (data) data.isDeleted = true
          })

          return true
        },
        add(...args: [T | T[]] | [string, T | T[]]) {
          const currentData = get().data
          const toAdd = new Map<string, ModelWithDeleted<T>>()

          const processItem = (id: string, item: T) => {
            const exist = currentData.get(id)
            if (!exist || !isEqualObject(exist, item)) {
              toAdd.set(id, { ...item } as ModelWithDeleted<T>)
            }
          }

          if (args.length === 2 && typeof args[0] === 'string') {
            processItem(args[0], args[1] as T)
          } else if (args.length === 1) {
            const data = args[0]
            if (Array.isArray(data)) {
              data.forEach((item) => processItem((item as T).id, item as T))
            } else {
              const item = data as T
              processItem(item.id, item)
            }
          }

          if (toAdd.size > 0) {
            set((state) => {
              for (const [id, item] of toAdd) {
                state.data.set(id, item)
              }
            })
          }
        },
        addOrPatch(data: T | T[]) {
          const currentData = get().data
          const items = Array.isArray(data) ? data : [data]
          const toUpdate = new Map<string, ModelWithDeleted<T>>()

          items.forEach((item) => {
            const exist = currentData.get(item.id)
            if (!exist) {
              toUpdate.set(item.id, { ...item } as ModelWithDeleted<T>)
            } else {
              const next = { ...exist, ...item }
              if (!isEqualObject(exist, next)) {
                toUpdate.set(item.id, next as ModelWithDeleted<T>)
              }
            }
          })

          if (toUpdate.size > 0) {
            set((state) => {
              for (const [id, item] of toUpdate) {
                state.data.set(id, item)
              }
            })
          }
        },
        remove(id: Id) {
          set((state) => {
            state.data.delete(id)
          })
        },

        ...(typeof actions === 'function' ? actions(set, get) : actions),
      })),
    ),
    // {
    //   name,
    // storage: {}
    // serialize: (data) => {
    //   return JSON.stringify({
    //     ...data,
    //     state: {
    //       ...data.state,
    //       data: Array.from(data.state.data as Set<unknown>),
    //     },
    //   })
    // },
    // deserialize: (value) => {
    //   const data = JSON.parse(value)

    //   data.state.data = new Map(Object.entries(data.state.data))

    //   return data
    // },
    // },
    // ),
  )
}
