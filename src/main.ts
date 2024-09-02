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
// ---------
const db = init<Schema>({ appId: APP_ID });

// Subscribe to data
// ---------
db.subscribeQuery(
  { todos: {} },
  (resp: SubscriptionState<{ todos: {} }, Schema>): void => {
    if (resp.error) {
      renderError(resp.error.message); // Pro-tip: Check you have the right appId!
      return;
    }
    if (resp.data) {
      render(resp.data);
    }
  },
);

// Write Data
// ---------
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

// Styles
// ---------
let styles: Record<string, string> = {};
const styles_light: Record<string, string> = {
  container: `
    box-sizing: border-box;
    background-color: #fafafa;
    font-family: code, monospace;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  `,
  header: `
    letter-spacing: 2px;
    font-size: 50px;
    color: lightgray;
    margin-bottom: 10px;
  `,
  form: `
    box-sizing: inherit;
    display: flex;
    border: 1px solid lightgray;
    border-bottom-width: 0px;
    width: 350px;
  `,
  toggleAll: `
    font-size: 30px;
    cursor: pointer;
    margin-left: 11px;
    margin-top: -6px;
    width: 15px;
    margin-right: 12px;
  `,
  input: `
    background-color: transparent;
    font-family: code, monospace;
    width: 287px;
    padding: 10px;
    font-style: italic;
  `,
  todoList: `
    box-sizing: inherit;
    width: 350px;
  `,
  checkbox: `
    font-size: 30px;
    margin-left: 5px;
    margin-right: 20px;
    cursor: pointer;
  `,
  todo: `
    display: flex;
    align-items: center;
    padding: 10px;
    border: 1px solid lightgray;
    border-bottom-width: 0px;
  `,
  todoText: `
    flex-grow: 1;
    overflow: hidden;
  `,
  delete: `
    width: 25px;
    cursor: pointer;
    color: lightgray;
  `,
  actionBar: `
    display: flex;
    justify-content: space-between;
    width: 328px;
    padding: 10px;
    border: 1px solid lightgray;
    font-size: 10px;
  `,
  footer: `
    margin-top: 20px;
    font-size: 10px;
  `,
};

const styles_dark: Record<string, string> = {
  container: `
    box-sizing: border-box;
    background-color: #050505;
    font-family: code, monospace;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: white;
  `,

  header: `
    letter-spacing: 2px;
    font-size: 50px;
    color: #2a2a2a;
    margin-bottom: 10px;
    user-select: none;
  `,

  form: `
    box-sizing: inherit;
    display: flex;
    border: 1px solid #2a2a2a;
    border-bottom-width: 0px;
    width: 350px;
    color: white;
  `,

  toggleAll: `
    font-size: 30px;
    cursor: pointer;
    margin-left: 11px;
    margin-top: -6px;
    width: 15px;
    margin-right: 12px;
    color: white;
  `,

  input: `
    background-color: transparent;
    font-family: code, monospace;
    width: 287px;
    padding: 10px;
    font-style: italic;
    color: white;
  `,

  todoList: `
    box-sizing: inherit;
    width: 350px;
    color: white;
    user-select: none;
  `,

  checkbox: `
    font-size: 30px;
    margin-left: 5px;
    margin-right: 20px;
    cursor: pointer;
    color: white;
  `,

  todo: `
    display: flex;
    align-items: center;
    padding: 10px;
    border: 1px solid #2a2a2a;
    border-bottom-width: 0px;
    color: white;
  `,

  todoText: `
    flex-grow: 1;
    overflow: hidden;
    color: white;
  `,

  delete: `
    width: 25px;
    cursor: pointer;
    color: #2a2a2a;
  `,

  actionBar: `
    display: flex;
    justify-content: space-between;
    width: 328px;
    padding: 10px;
    border: 1px solid #2a2a2a;
    font-size: 10px;
    color: white;
  `,

  footer: `
    margin-top: 20px;
    font-size: 10px;
    color: white;
  `,
};
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  console.log("dark mode");
  styles = styles_dark;
} else {
  console.log("light mode");
  styles = styles_light;
}

// Render
// ---------
const app = document.getElementById("app")!;
app.style.cssText = styles.container;

function render(data: { todos: Todo[] }): void {
  app.innerHTML = "";

  const { todos } = data;

  const containerHTML = `
    <title>Todolist App</title>
    <div style="${styles.container}">
      <div style="${styles.header}">todos</div>
      ${TodoForm()}
      ${TodoList(todos)}
      ${ActionBar(todos)}
      <div style="${styles.footer}">Open another tab to see todos update in realtime!</div>
    </div>
  `;

  app.innerHTML = containerHTML;

  // Attach event listeners
  document
    .querySelector(".toggle-all")
    ?.addEventListener("click", (): void => toggleAllTodos(todos));
  document.querySelector("form")?.addEventListener("submit", submitForm);
  todos.forEach((todo: Todo): void => {
    document
      .getElementById(`toggle-${todo.id}`)
      ?.addEventListener("change", (): void => toggleDone(todo));
    document
      .getElementById(`delete-${todo.id}`)
      ?.addEventListener("click", (): void => deleteTodoItem(todo));
  });
  document
    .querySelector(".delete-completed")
    ?.addEventListener("click", (): void => deleteCompleted(todos));
}

function renderError(errorMessage: string): void {
  app.innerHTML = `
    <div>${errorMessage}</div>
  `;
}

function TodoForm(): string {
  return `
    <div style="${styles.form}">
      <div class="toggle-all" style="${styles.toggleAll}">⌄</div>
      <form>
        <input style="${styles.input}" spellcheck="true" placeholder="What needs to be done?" type="text" autofocus>
      </form>
    </div>
  `;
}

function TodoList(todos: Todo[]): string {
  return `
    <div style="${styles.todoList}">
      ${todos
        .map(
          (todo: Todo): string => `
        <div style="${styles.todo}">
          <input id="toggle-${todo.id}" type="checkbox" style="${styles.checkbox}" ${todo.done ? "checked" : ""}>
          <div style="${styles.todoText}">
            ${todo.done ? `<span style="text-decoration: line-through;">${todo.text}</span>` : `<span>${todo.text}</span>`}
          </div>
          <span id="delete-${todo.id}" style="${styles.delete}">𝘟</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function ActionBar(todos: Todo[]): string {
  return `
    <div style="${styles.actionBar}">
      <div>Remaining todos: ${todos.filter((todo: Todo): boolean => !todo.done).length}</div>
      <div class="delete-completed" style="cursor: pointer;">Delete Completed</div>
    </div>
  `;
}

function focusInput(): void {
  const input = document.querySelector<HTMLInputElement>('input[type="text"]');
  if (input) {
    input.focus();
  }
}

function submitForm(event: Event): void {
  event.preventDefault();
  const input = (event.target as HTMLFormElement).querySelector("input");
  if (input && input.value.trim()) {
    addTodo(input.value);
    input.value = "";
  }
}
