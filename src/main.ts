import {
  init,
  tx,
  id,
  SubscriptionState,
  TransactionChunk,
} from "@instantdb/core";

// Visit https://instantdb.com/dash to get your APP_ID :)
const APP_ID = "d754b838-e20b-4c83-88ac-2f04233db34e";

// Optional: Declare your schema for intellisense!
interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

type Schema = {
  todos: Todo;
};

// Initialize the database
const db = init<Schema>({ appId: APP_ID });

// Subscribe to data
db.subscribeQuery(
  { todos: {} },
  (resp: SubscriptionState<{ todos: {} }, Schema>): void => {
    if (resp.error) {
      renderError(resp.error.message);
      return;
    }
    if (resp.data) {
      render(resp.data);
    }
  },
);

// Write Data
function addTodo(text: string): void {
  db.transact(
    tx.todos[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
    }),
  );
  focusInput();
}

function deleteTodoItem(todo: Todo): void {
  db.transact(tx.todos[todo.id].delete());
}

function toggleDone(todo: Todo): void {
  db.transact(tx.todos[todo.id].update({ done: !todo.done }));
}

function deleteCompleted(todos: Todo[]): void {
  const completed = todos.filter((todo: Todo): boolean => todo.done);
  const txs = completed.map(
    (todo: Todo): TransactionChunk => tx.todos[todo.id].delete(),
  );
  db.transact(txs);
}

function toggleAllTodos(todos: Todo[]): void {
  const newVal = !todos.every((todo: Todo): boolean => todo.done);
  db.transact(
    todos.map(
      (todo: Todo): TransactionChunk =>
        tx.todos[todo.id].update({ done: newVal }),
    ),
  );
}

// Render
function render(data: { todos: Todo[] }): void {
  const { todos } = data;
  const todoList = document.querySelector(".todo-list")!;
  const remainingTodosElement = document.querySelector(".remaining-todos")!;

  todoList.innerHTML = todos
    .map(
      (todo: Todo): string => `
    <div class="todo-item">
      <input id="toggle-${todo.id}" type="checkbox" class="todo-checkbox" ${todo.done ? "checked" : ""}>
      <div class="todo-text">
        ${todo.done ? `<span style="text-decoration: line-through;">${todo.text}</span>` : `<span>${todo.text}</span>`}
      </div>
      <span id="delete-${todo.id}" class="todo-delete">𝘟</span>
    </div>
  `,
    )
    .join("");

  remainingTodosElement.textContent = `Remaining todos: ${todos.filter((todo: Todo): boolean => !todo.done).length}`;

  // Attach event listeners
  document
    .querySelector(".toggle-all")
    ?.addEventListener("click", () => toggleAllTodos(todos));
  document.querySelector("form")?.addEventListener("submit", submitForm);
  todos.forEach((todo: Todo): void => {
    document
      .getElementById(`toggle-${todo.id}`)
      ?.addEventListener("change", () => toggleDone(todo));
    document
      .getElementById(`delete-${todo.id}`)
      ?.addEventListener("click", () => deleteTodoItem(todo));
  });
  document
    .querySelector(".delete-completed")
    ?.addEventListener("click", () => deleteCompleted(todos));
}

function renderError(errorMessage: string): void {
  const app = document.getElementById("app")!;
  app.innerHTML = `<div>${errorMessage}</div>`;
}

function focusInput(): void {
  const input = document.querySelector<HTMLInputElement>(".todo-input");
  if (input) {
    input.focus();
  }
}

function submitForm(event: Event): void {
  event.preventDefault();
  const input = (event.target as HTMLFormElement).querySelector(
    ".todo-input",
  ) as HTMLInputElement;
  if (input && input.value.trim()) {
    addTodo(input.value);
    input.value = "";
  }
}
