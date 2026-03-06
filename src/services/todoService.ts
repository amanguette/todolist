import type { Todo } from '../types'

const API_URL = 'http://localhost:3001/todos'

export class TodoServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TodoServiceError'
  }
}

export const todoService = {
  async getTodos(): Promise<Todo[]> {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error(`Failed to fetch todos: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      throw new TodoServiceError(`Failed to fetch todos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async addTodo(todo: Omit<Todo, 'id'>): Promise<Todo> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      })
      if (!response.ok) throw new Error(`Failed to add todo: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      throw new TodoServiceError(`Failed to add todo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async updateTodo(id: string, todo: Partial<Todo>): Promise<Todo> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      })
      if (!response.ok) throw new Error(`Failed to update todo: ${response.statusText}`)
      return await response.json()
    } catch (error) {
      throw new TodoServiceError(`Failed to update todo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async deleteTodo(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Failed to delete todo: ${response.statusText}`)
    } catch (error) {
      throw new TodoServiceError(`Failed to delete todo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}