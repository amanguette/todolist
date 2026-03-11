import { useState, useRef, useEffect } from 'react'
import { Edit2, Trash2, Check, X } from 'lucide-react'
import type { Todo } from '../types'
import './TodoItem.css'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, title: string) => void
  onDragStart: (e: React.DragEvent<HTMLLIElement>) => void
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void
  onDrop: (e: React.DragEvent<HTMLLIElement>) => void
  onDragEnd: (e: React.DragEvent<HTMLLIElement>) => void
  isDragging: boolean
  isDragOver: boolean
}

export function TodoItem({ todo, onToggle, onRemove, onEdit, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDragOver }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(todo.title)
  const editInputRef = useRef<HTMLInputElement>(null)
  const itemRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEditing && itemRef.current && !itemRef.current.contains(e.target as Node)) {
        // Cancel editing when clicking outside
        setEditedTitle(todo.title)
        setIsEditing(false)
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, todo.title])

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      onEdit(todo.id, editedTitle.trim())
      setIsEditing(false)
    } else {
      setEditedTitle(todo.title)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedTitle(todo.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }
  return (
    <li
      ref={itemRef}
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`todo-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isEditing ? 'editing' : ''}`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        disabled={isEditing}
        className="todo-item-checkbox"
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="todo-item-content">
        {isEditing ? (
          <div className="todo-item-edit-container">
            <input
              ref={editInputRef}
              type="text"
              className="todo-item-edit-input"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Edit todo title"
            />
            <div className="todo-item-actions-inline">
              <button
                className="todo-item-action-btn todo-item-action-confirm"
                onClick={handleSaveEdit}
                title="Save changes (Enter)"
                aria-label="Confirm edit"
              >
                <Check size={18} />
              </button>
              <button
                className="todo-item-action-btn todo-item-action-cancel"
                onClick={handleCancelEdit}
                title="Cancel (Escape)"
                aria-label="Cancel edit"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <span
            className={`todo-item-text ${todo.completed ? 'completed' : ''}`}
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsEditing(true)
              }
            }}
          >
            {todo.title}
          </span>
        )}
      </div>
      <div className="todo-item-toolbar">
        {!isEditing && (
          <button
            className="todo-item-action-btn todo-item-action-edit"
            onClick={() => setIsEditing(true)}
            title="Edit (or double-click the text)"
            aria-label={`Edit "${todo.title}"`}
          >
            <Edit2 size={18} />
          </button>
        )}
        {!isEditing && (
          <button
            className="todo-item-action-btn todo-item-action-delete"
            onClick={() => onRemove(todo.id)}
            title="Delete"
            aria-label={`Delete "${todo.title}"`}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </li>
  )
}