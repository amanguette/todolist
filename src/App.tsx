import './App.css'
import { useTodos } from './hooks/useTodos'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'

function App() {
  const { todos, loading, error, addTodo, toggleTodo, removeTodo, reorderTodos, isSyncing, isOnline } = useTodos()

  return (
    <div className="app">
      <h1>Todolist</h1>
      
      {error && <div className="notification notification-error">⚠️ Error: {error}</div>}
      
      {!isOnline && <div className="notification notification-offline">⚠️ You are offline - changes will sync when online</div>}
      
      {isSyncing && <div className="notification notification-syncing">🔄 Syncing changes...</div>}
      
      {loading && <p className="loading">Loading...</p>}
      
      <TodoForm onAdd={addTodo} disabled={loading} />
      
      {!loading && <TodoList todos={todos} onToggle={toggleTodo} onRemove={removeTodo} onReorder={reorderTodos} />}
    </div>
  )
}

export default App
