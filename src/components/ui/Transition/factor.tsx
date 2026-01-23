import type { Target } from 'framer-motion'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC, PropsWithChildren, ReactNode } from 'react'
import { Fragment, memo, useRef } from 'react'

import { microReboundPreset } from '~/constants/spring'

import type { BaseTransitionProps } from './typings'

interface TransitionViewParams {
  from: Target
  to: Target
  initial?: Target
}

const PresenceFC = ({
  children,
  onExited,
  useAnimatePresence,
}: PropsWithChildren<{
  useAnimatePresence: boolean
  onExited?: () => void
}>) => {
  return useAnimatePresence ? (
    <AnimatePresence onExitComplete={onExited}>{children}</AnimatePresence>
  ) : (
    <Fragment>{children}</Fragment>
  )
}
export const createTransitionView = (
  params: TransitionViewParams,
): FC<PropsWithChildren<BaseTransitionProps>> => {
  const { from, to, initial } = params
  return function Transition(props) {
    const {
      timeout = {},
      duration = 0.5,
      appear = true,
      in: In = true,
      animation = {},
      as = 'div',
      useAnimatePresence = false,
      ...rest
    } = props

    const { enter = 0, exit = 0 } = timeout
    const MotionComponent = (motion as unknown as Record<string, any>)[
      as
    ] as typeof motion.div

    return (
      <PresenceFC
        useAnimatePresence={useAnimatePresence}
        onExited={props.onExited}
      >
        {In &&
          (!appear ? (
            props.children
          ) : (
            <MotionComponent
              initial={{ ...(initial || from) }}
              animate={{
                ...to,
                transition: {
                  duration,
                  ...microReboundPreset,
                  ...animation.enter,
                  delay: enter / 1000,
                },
              }}
              onAnimationComplete={() => {
                props.onEntered?.()
              }}
              exit={{
                ...from,
                transition: {
                  duration,
                  ...animation.exit,
                  delay: exit / 1000,
                },
              }}
              transition={{
                duration,
              }}
              {...rest}
            >
              {props.children}
            </MotionComponent>
          ))}
      </PresenceFC>
    )
  }
}
