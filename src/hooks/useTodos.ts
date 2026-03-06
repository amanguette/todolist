import { useState, useCallback, useEffect, useRef } from 'react'
import type { Todo } from '../types'
import { todoService } from '../services/todoService'

const STORAGE_KEY = 'todos'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    // Load from localStorage immediately on mount
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const hasInitializedRef = useRef(false)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      await syncWithServer()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setError(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncWithServer = useCallback(async () => {
    setIsSyncing(true)
    setError(null)

    try {
      // Get local data
      const localData = localStorage.getItem(STORAGE_KEY)
      const localTodos: Todo[] = localData ? JSON.parse(localData) : []

      // Get server data
      const serverTodos = await todoService.getTodos()
      const serverMap = new Map(serverTodos.map((t) => [t.id, t]))
      const localMap = new Map(localTodos.map((t) => [t.id, t]))

      // Process each local todo
      for (const localTodo of localTodos) {
        const serverTodo = serverMap.get(localTodo.id)

        if (!serverTodo) {
          // Todo exists locally but not on server, add it
          try {
            await todoService.addTodo({
              title: localTodo.title,
              completed: localTodo.completed,
            })
          } catch (err) {
            console.error('Failed to add todo to server:', err)
          }
        } else if (
          serverTodo.completed !== localTodo.completed ||
          serverTodo.title !== localTodo.title
        ) {
          // Todo exists on both but is different, update server with local version
          try {
            await todoService.updateTodo(localTodo.id, {
              completed: localTodo.completed,
            })
          } catch (err) {
            console.error('Failed to update todo on server:', err)
          }
        }
      }

      // Process deletions: todos on server but not locally
      for (const serverTodo of serverTodos) {
        if (!localMap.has(serverTodo.id)) {
          // Todo exists on server but not locally, delete it
          try {
            await todoService.deleteTodo(serverTodo.id)
          } catch (err) {
            console.error('Failed to delete todo from server:', err)
          }
        }
      }

      // After syncing, reload from server to get the final state
      const finalServerData = await todoService.getTodos()
      setTodos(finalServerData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalServerData))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      console.error('Sync error:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  // Sync on mount if online
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    setLoading(false)

    if (isOnline) {
      syncWithServer()
    }
  }, [isOnline])

  const addTodo = useCallback(
    async (title: string) => {
      setError(null)
      const newTodo: Todo = {
        id: Date.now().toString(),
        title,
        completed: false,
      }

      try {
        if (isOnline) {
          const serverTodo = await todoService.addTodo({ title, completed: false })
          setTodos((prev) => {
            const updated = [...prev, serverTodo]
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return updated
          })
        } else {
          setTodos((prev) => {
            const updated = [...prev, newTodo]
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return updated
          })
        }
      } catch (err) {
        setTodos((prev) => {
          const updated = [...prev, newTodo]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
        setError('Added offline - will sync when online')
      }
    },
    [isOnline]
  )

  const toggleTodo = useCallback(
    async (id: string) => {
      setError(null)
      setTodos((prev) => {
        const todo = prev.find((t) => t.id === id)
        if (!todo) return prev

        const updated = { ...todo, completed: !todo.completed }
        const newTodos = prev.map((t) => (t.id === id ? updated : t))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos))

        if (isOnline) {
          todoService.updateTodo(id, { completed: !todo.completed }).catch((err) => {
            setError('Failed to update - will retry when online')
          })
        }

        return newTodos
      })
    },
    [isOnline]
  )

  const removeTodo = useCallback(
    async (id: string) => {
      setError(null)
      setTodos((prev) => {
        const newTodos = prev.filter((t) => t.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTodos))
        return newTodos
      })

      if (isOnline) {
        todoService.deleteTodo(id).catch((err) => {
          setError('Failed to delete - will retry when online')
        })
      }
    },
    [isOnline]
  )

  return { todos, loading, error, addTodo, toggleTodo, removeTodo, isSyncing, isOnline }
}