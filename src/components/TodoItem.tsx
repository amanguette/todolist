import type { Todo } from '../types'
import './TodoItem.css'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onDragStart: (e: React.DragEvent<HTMLLIElement>) => void
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void
  onDrop: (e: React.DragEvent<HTMLLIElement>) => void
  onDragEnd: (e: React.DragEvent<HTMLLIElement>) => void
  isDragging: boolean
  isDragOver: boolean
}

export function TodoItem({ todo, onToggle, onRemove, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDragOver }: TodoItemProps) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`todo-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <div className="todo-item-content">
        <span className={`todo-item-text ${todo.completed ? 'completed' : ''}`}>
          {todo.title}
        </span>
      </div>
      <button className="todo-item-delete" onClick={() => onRemove(todo.id)}>Delete</button>
    </li>
  )
}