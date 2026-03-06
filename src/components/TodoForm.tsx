import { useState } from 'react'

interface TodoFormProps {
  onAdd: (title: string) => void
  disabled?: boolean
}

export function TodoForm({ onAdd, disabled = false }: TodoFormProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onAdd(input)
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a new todo..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>Add</button>
    </form>
  )
}