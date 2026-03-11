import { useState } from 'react'
import type { Todo } from '../types'
import { TodoItem } from './TodoItem'
import './TodoList.css'

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onReorder: (reorderedTodos: Todo[]) => void
}

export function TodoList({ todos, onToggle, onRemove, onReorder }: TodoListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const draggedIndex = todos.findIndex((t) => t.id === draggedId)
    const targetIndex = todos.findIndex((t) => t.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newTodos = [...todos]
    const [draggedTodo] = newTodos.splice(draggedIndex, 1)
    newTodos.splice(targetIndex, 0, draggedTodo)

    // Update order values
    const reorderedTodos = newTodos.map((todo, index) => ({
      ...todo,
      order: index,
    }))

    onReorder(reorderedTodos)
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRemove={onRemove}
          onDragStart={() => handleDragStart(todo.id)}
          onDragOver={(e) => handleDragOver(e, todo.id)}
          onDrop={(e) => handleDrop(e, todo.id)}
          onDragEnd={handleDragEnd}
          isDragging={draggedId === todo.id}
          isDragOver={dragOverId === todo.id}
        />
      ))}
    </ul>
  )
}