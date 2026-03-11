import { useState, useCallback, useEffect, useRef } from 'react'
import type { Todo } from '../types'
import { todoService } from '../services/todoService'

const STORAGE_KEY = 'todos'

// Helper function to sort todos by order
const sortByOrder = (todos: Todo[]): Todo[] => {
  return [...todos].sort((a, b) => a.order - b.order)
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    // Load from localStorage immediately on mount
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    return sortByOrder(parsed)
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

      // If localStorage is empty, use server data as source of truth
      if (localTodos.length === 0) {
        const sortedServerData = sortByOrder(serverTodos)
        setTodos(sortedServerData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedServerData))
        return
      }

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
              order: localTodo.order,
            })
          } catch (err) {
            console.error('Failed to add todo to server:', err)
          }
        } else if (
          serverTodo.completed !== localTodo.completed ||
          serverTodo.title !== localTodo.title ||
          serverTodo.order !== localTodo.order
        ) {
          // Todo exists on both but is different, update server with local version
          try {
            await todoService.updateTodo(localTodo.id, {
              completed: localTodo.completed,
              order: localTodo.order,
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
      const sortedData = sortByOrder(finalServerData)
      setTodos(sortedData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedData))
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
      const maxOrder = todos.length > 0 ? Math.max(...todos.map((t) => t.order)) : -1
      const newTodo: Todo = {
        id: Date.now().toString(),
        title,
        completed: false,
        order: maxOrder + 1,
      }

      try {
        if (isOnline) {
          const serverTodo = await todoService.addTodo({ 
            title, 
            completed: false,
            order: maxOrder + 1,
          })
          setTodos((prev) => {
            const updated = sortByOrder([...prev, serverTodo])
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return updated
          })
        } else {
          setTodos((prev) => {
            const updated = sortByOrder([...prev, newTodo])
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return updated
          })
        }
      } catch (err) {
        setTodos((prev) => {
          const updated = sortByOrder([...prev, newTodo])
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
          todoService.updateTodo(id, { completed: !todo.completed }).catch(() => {
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
        const filtered = prev.filter((t) => t.id !== id)
        // Recalculate order values after deletion
        const reordered = filtered.map((todo, index) => ({
          ...todo,
          order: index,
        }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered))
        return reordered
      })

      if (isOnline) {
        todoService.deleteTodo(id).catch(() => {
          setError('Failed to delete - will retry when online')
        })
      }
    },
    [isOnline]
  )

  const reorderTodos = useCallback(
    async (reorderedTodos: Todo[]) => {
      setError(null)
      // Ensure data is sorted by order
      const sortedTodos = sortByOrder(reorderedTodos)
      
      // Update local state and storage immediately
      setTodos(sortedTodos)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedTodos))

      // Sync to server if online
      if (isOnline) {
        try {
          // Update all todos with their new order on the server
          await Promise.all(
            sortedTodos.map((todo) =>
              todoService.updateTodo(todo.id, { order: todo.order })
            )
          )
        } catch (err) {
          setError('Failed to save order - will retry when online')
          console.error('Order sync error:', err)
        }
      } else {
        setError('Reorder saved locally - will sync when online')
      }
    },
    [isOnline]
  )

  return { todos, loading, error, addTodo, toggleTodo, removeTodo, reorderTodos, isSyncing, isOnline }
}