import { useState, useCallback, useEffect } from 'react'
import type { Todo } from '../types'
import { todoService } from '../services/todoService'

const STORAGE_KEY = 'todos'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load todos on mount
  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isOnline) {
        const data = await todoService.getTodos()
        setTodos(data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } else {
        const saved = localStorage.getItem(STORAGE_KEY)
        setTodos(saved ? JSON.parse(saved) : [])
      }
    } catch (err) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setTodos(JSON.parse(saved))
        setError('Using offline data - server unavailable')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load todos')
      }
    } finally {
      setLoading(false)
    }
  }, [isOnline])

  const addTodo = useCallback(
    async (title: string) => {
      setError(null)
      const tempTodo: Todo = {
        id: Date.now().toString(),
        title,
        completed: false,
      }

      try {
        if (isOnline) {
          const newTodo = await todoService.addTodo({ title, completed: false })
          setTodos((prev) => [...prev, newTodo])
          localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.concat(newTodo)))
        } else {
          setTodos((prev) => [...prev, tempTodo])
          localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.concat(tempTodo)))
        }
      } catch (err) {
        setTodos((prev) => [...prev, tempTodo])
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.concat(tempTodo)))
        setError('Added offline - will sync when online')
      }
    },
    [todos, isOnline]
  )

  const toggleTodo = useCallback(
    async (id: string) => {
      setError(null)
      const todo = todos.find((t) => t.id === id)
      if (!todo) return

      const updated = { ...todo, completed: !todo.completed }

      try {
        if (isOnline) {
          await todoService.updateTodo(id, { completed: !todo.completed })
        }
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.map((t) => (t.id === id ? updated : t))))
      } catch (err) {
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.map((t) => (t.id === id ? updated : t))))
        setError('Updated offline - will sync when online')
      }
    },
    [todos, isOnline]
  )

  const removeTodo = useCallback(
    async (id: string) => {
      setError(null)
      try {
        if (isOnline) {
          await todoService.deleteTodo(id)
        }
        setTodos((prev) => prev.filter((t) => t.id !== id))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.filter((t) => t.id !== id)))
      } catch (err) {
        setTodos((prev) => prev.filter((t) => t.id !== id))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.filter((t) => t.id !== id)))
        setError('Deleted offline - will sync when online')
      }
    },
    [todos, isOnline]
  )

  return { todos, loading, error, addTodo, toggleTodo, removeTodo }
}