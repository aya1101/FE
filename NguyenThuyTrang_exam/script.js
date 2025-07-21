document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todoInput');
    const addButton = document.getElementById('addButton');
    const todoList = document.getElementById('todoList');

    let todos = [
        { id: 1, name: "Have breakfast", completed: true },
        { id: 2, name: "Do homework", completed: false },
        { id: 3, name: "Check email", completed: false }
    ];

    let editingTodoId = null; 

    function renderTodos() {
        todoList.innerHTML = ''; 
        todos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            listItem.setAttribute('data-id', todo.id);

            listItem.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                <span>${todo.name}</span>
                <div class="actions">
                    <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            todoList.appendChild(listItem);
        });
    }

    // Hàm thêm/cập nhật todo
    function addOrUpdateTodo() {
        const todoName = todoInput.value.trim();

        if (todoName === '') {
            alert('Todo name cannot be empty!');
            return;
        }

        if (editingTodoId !== null) {
            // Cập nhật todo
            const todoIndex = todos.findIndex(t => t.id === editingTodoId);
            if (todoIndex > -1) {
                todos[todoIndex].name = todoName;
                editingTodoId = null;
                addButton.textContent = 'Add';
            }
        } else {
            // Thêm todo mới
            const newTodo = {
                id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1, 
                name: todoName,
                completed: false
            };
            todos.push(newTodo);
        }

        todoInput.value = ''; 
        renderTodos(); 
    }

    // click nút Add
    addButton.addEventListener('click', addOrUpdateTodo);

    // nhấn Enter trong input
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addOrUpdateTodo();
        }
    });

    // 
    todoList.addEventListener('click', (e) => {
        const target = e.target;
        const listItem = target.closest('.todo-item');

        if (!listItem) return; 

        const todoId = parseInt(listItem.dataset.id);
        const todo = todos.find(t => t.id === todoId);

        if (!todo) return;

        // checkbox
        if (target.type === 'checkbox') {
            todo.completed = target.checked;
            renderTodos();
        }

        if (target.classList.contains('fa-trash') || target.classList.contains('delete-btn')) {
            todos = todos.filter(t => t.id !== todoId);
            renderTodos();
        }

        if (target.classList.contains('fa-pencil-alt') || target.classList.contains('edit-btn')) {
            todoInput.value = todo.name;
            editingTodoId = todoId; 
            addButton.textContent = 'Save'; 
        }
    });

    renderTodos();
});