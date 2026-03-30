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
          const addFn = get().add

          const add = (id: string, data: T | T[]) => {
            if (Array.isArray(data)) {
              data.forEach((d) => {
                addFn(d)
              })

              return
            }

            const exist = get().data.get(id)
            if (exist && isEqualObject(exist, data)) {
              return
            }

            set((state) => {
              state.data.set(id, { ...data } as ModelWithDeleted<T>)
            })
          }

          if (args.length === 2 && typeof args[0] === 'string') {
            const id = args[0]
            const data = args[1]
            add(id, data)
          } else if (args.length === 1 && !Array.isArray(args[0])) {
            const data = args[0]
            add(data.id, data)
          } else if (args.length === 1 && Array.isArray(args[0])) {
            const data = args[0]
            add('', data)
          }
        },
        addOrPatch(data: T | T[]) {
          if (Array.isArray(data)) {
            const patch = get().addOrPatch
            data.forEach((d) => {
              patch(d)
            })
            return
          }
          set((state) => {
            const collection = state.data
            if (collection.has(data.id)) {
              const exist = collection.get(data.id)

              collection.set(data.id, { ...exist, ...data } as ModelWithDeleted<T>)
            } else {
              collection.set(data.id, data as ModelWithDeleted<T>)
            }
          })
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
