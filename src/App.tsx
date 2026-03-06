import './App.css'
import { useTodos } from './hooks/useTodos'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'

function App() {
  const { todos, loading, error, addTodo, toggleTodo, removeTodo, isSyncing, isOnline } = useTodos()

  return (
    <>
      <h1>My To-Do List</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>}
      
      {!isOnline && <div style={{ color: 'orange', marginBottom: '10px' }}>⚠️ You are offline - changes will sync when online</div>}
      
      {isSyncing && <div style={{ color: 'blue', marginBottom: '10px' }}>🔄 Syncing changes...</div>}
      
      {loading && <p>Loading...</p>}
      
      <TodoForm onAdd={addTodo} disabled={loading} />
      
      {!loading && <TodoList todos={todos} onToggle={toggleTodo} onRemove={removeTodo} />}
    </>
  )
}

export default App
