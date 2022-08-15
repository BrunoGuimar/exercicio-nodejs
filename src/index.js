const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers
  const user = users.find(user => user.username === username)
  if(!user){
    return response.status(404).json({error: "User not found"})
  }
  request.user = user
  return next()
}
function checksCreateTodosUserAvailability(request, response, next){
  const {username} = request.headers
  const user = users.find(user => user.username === username)
  if(user.plan === "pro"){
    return next()
  }else if(user.plan === "free" && user.todos.length < 10){
    return next()
  }
  response.json({error: "limits of todos exceeded or no plans avalliable"})
}
function checksTodoExists(request, response, next){
  const {username} = request.headers
  const user = users.find(user => user.username === username)
  const {id} = request.params
  const userTodo = user.todos.find(todo => todo.id === id)
  if(userTodo === -1){
    response.status(404).json({error: "Todo ID informed does not exist in this user"})
  }
  request.userTodo = userTodo
  return next()
}
app.get("/users", (request, response) => {
  response.json(users)
})

app.post('/users', (request, response) => {
  const {name, username, plan} = request.body
  const userAlreadyExists = users.some(user => user.username === username)
  if(userAlreadyExists){
  return response.status(400).json({error: "User already created"})
  }
  users.push({
    id: uuidv4(),
    name,
    username,
    todos: [],
    plan
  })
  response.status(201).send()
})

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {user} = request
  response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body
  const {user} = request
  user.todos.push({
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  })
  response.status(201).json({message: "sucessfully created"})
});

app.put('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { title, deadline } = request.body
  const { userTodo } = request
  userTodo.title = title
  userTodo.deadline = deadline
  response.status(202).json({message: "Sucess on changes"})
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { id } = request.params
  const userTodos = user.todos.find(user => user.id === id)
  if(userTodos === undefined){
    return response.status(404).json({error: "Not able to mark a non existing todo as done"})
  }
  userTodos.done = true
  response.json({message: "sucessfully changes"})
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { id } = request.params
  const todosIndex = user.todos.findIndex(todos => todos.id === id)
  if(todosIndex === -1){
    return response.status(404).json({ error: 'User Todos not found' })
  }
  user.todos.splice(todosIndex, 1)
  return response.status(204).json();
});

module.exports = app;