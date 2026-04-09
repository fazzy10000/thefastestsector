import { useSyncExternalStore, useCallback } from 'react'

const STORAGE_KEY = 'tfs_dark_mode'

let listeners: Array<() => void> = []

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains('dark')
}

function applyDark(on: boolean) {
  if (on) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function init() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'true') {
    applyDark(true)
  } else if (stored === 'false') {
    applyDark(false)
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyDark(true)
  }
}

init()

export function useDarkMode() {
  const dark = useSyncExternalStore(subscribe, getSnapshot)

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    applyDark(next)
    localStorage.setItem(STORAGE_KEY, String(next))
    emit()
  }, [])

  return { dark, toggle }
}
