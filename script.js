// script.js

// Ваши конфигурационные данные Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDZrQVcTvLhLDhrjvDFoOk63ob4G6xyKLg",
    authDomain: "sam-neft.firebaseapp.com",
    databaseURL: "https://sam-neft-default-rtdb.firebaseio.com",
    projectId: "sam-neft",
    storageBucket: "sam-neft.appspot.com",
    messagingSenderId: "604869571586",
    appId: "1:604869571586:web:94e4756142099b8b41231b"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Элементы DOM
const entryForm = document.getElementById('entryForm');
const entriesTableBody = document.querySelector('#entriesTable tbody');
const filterForm = document.getElementById('filterForm');
const clearFilterBtn = document.getElementById('clearFilter');
const clearAllBtn = document.getElementById('clearAll');
const loading = document.getElementById('loading');
const editModal = document.getElementById('editModal');
const closeModal = document.querySelector('.close');
const editForm = document.getElementById('editForm');
const toggleThemeBtn = document.getElementById('toggleTheme');

let currentEditId = null;

// Функция для отображения индикатора загрузки
function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}

// Функция для проверки пароля
function checkPassword() {
    const password = prompt("Введите пароль для подтверждения действия:");
    if (password === null) { // Пользователь нажал "Отмена"
        return false;
    }
    return password === '8899';
}

// Функция для рендеринга записей в таблице
function renderEntries(entries) {
    entriesTableBody.innerHTML = '';
    if (entries) {
        Object.keys(entries).forEach(key => {
            const entry = entries[key];
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td data-label="Дата">${entry.date}</td>
                <td data-label="Тип бензина">${entry.soldType}</td>
                <td data-label="Продано (л)">${entry.sold.toFixed(2)}</td>
                <td data-label="Действия">
                    <button class="action-btn edit-btn" data-id="${key}">Редактировать</button>
                    <button class="action-btn delete-btn" data-id="${key}">Удалить</button>
                </td>
            `;

            // Добавляем анимацию добавления
            tr.classList.add('added');

            tr.addEventListener('animationend', () => {
                tr.classList.remove('added');
            });

            entriesTableBody.appendChild(tr);
        });
    } else {
        // Если нет записей, можно отобразить сообщение или очистить таблицу
        entriesTableBody.innerHTML = '<tr><td colspan="4">Нет записей для отображения.</td></tr>';
    }
}

// Загрузка записей из Firebase с учетом фильтров
function loadEntries(filters = {}) {
    showLoading();
    let entriesRef = database.ref('entries');

    entriesRef.once('value', (snapshot) => {
        let entries = snapshot.val();
        if (entries) {
            // Применяем фильтры
            if (filters.date) {
                for (const key in entries) {
                    if (entries[key].date !== filters.date) {
                        delete entries[key];
                    }
                }
            }

            if (filters.type) {
                for (const key in entries) {
                    if (entries[key].soldType !== filters.type) {
                        delete entries[key];
                    }
                }
            }
        }
        renderEntries(entries);
        hideLoading();
    });
}

// Обработка добавления новой записи
entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const soldType = document.getElementById('soldType').value;
    const sold = parseFloat(document.getElementById('sold').value);

    if (!date || !soldType || isNaN(sold)) {
        alert('Пожалуйста, заполните все поля правильно.');
        return;
    }

    const newEntryRef = database.ref('entries').push();
    const entry = {
        date,
        soldType,
        sold
    };

    newEntryRef.set(entry, (error) => {
        if (error) {
            alert('Ошибка при добавлении записи: ' + error.message);
        } else {
            entryForm.reset();
            document.getElementById('soldType').selectedIndex = 0;
        }
    });
});

// Обработка фильтрации
filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const filterDate = document.getElementById('filterDate').value;
    const filterType = document.getElementById('filterType').value;
    loadEntries({ date: filterDate, type: filterType });
});

// Обработка сброса фильтра
clearFilterBtn.addEventListener('click', () => {
    filterForm.reset();
    loadEntries();
});

// Обработка очистки всех записей
clearAllBtn.addEventListener('click', () => {
    if (!checkPassword()) {
        alert('Неверный пароль. Действие отменено.');
        return;
    }

    if (confirm('Вы уверены, что хотите удалить все записи?')) {
        showLoading();
        database.ref('entries').remove()
            .then(() => {
                alert('Все записи удалены!');
                hideLoading();
            })
            .catch(error => {
                alert('Ошибка при удалении записей: ' + error.message);
                hideLoading();
            });
    }
});

// Обработка кнопок редактирования и удаления через делегирование событий
entriesTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.getAttribute('data-id');
        deleteEntry(id);
    }

    if (e.target.classList.contains('edit-btn')) {
        const id = e.target.getAttribute('data-id');
        openEditModal(id);
    }
});

// Функция для удаления записи с анимацией и запросом пароля
function deleteEntry(id) {
    if (!checkPassword()) {
        alert('Неверный пароль. Действие отменено.');
        return;
    }

    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        const deleteBtn = document.querySelector(`button.delete-btn[data-id="${id}"]`);
        const tr = deleteBtn.closest('tr');
        tr.classList.add('removed');

        tr.addEventListener('animationend', () => {
            database.ref('entries/' + id).remove()
                .catch(error => alert('Ошибка при удалении записи: ' + error.message));
        });
    }
}

// Функция для открытия модального окна редактирования
function openEditModal(id) {
    const entryRef = database.ref('entries/' + id);
    entryRef.once('value')
        .then((snapshot) => {
            const entry = snapshot.val();
            if (entry) {
                document.getElementById('editDate').value = entry.date;
                document.getElementById('editSoldType').value = entry.soldType;
                document.getElementById('editSold').value = entry.sold;
                currentEditId = id;
                editModal.classList.add('show');
                editModal.style.display = 'block';
                if (document.body.classList.contains('dark-mode')) {
                    editModal.querySelector('.modal-content').classList.add('dark-mode');
                } else {
                    editModal.querySelector('.modal-content').classList.remove('dark-mode');
                }
            } else {
                alert('Запись не найдена.');
            }
        })
        .catch((error) => {
            alert('Ошибка при редактировании записи: ' + error.message);
        });
}

// Закрытие модального окна
closeModal.onclick = () => {
    editModal.classList.remove('show');
    setTimeout(() => {
        editModal.style.display = 'none';
    }, 300);
};

window.onclick = (event) => {
    if (event.target == editModal) {
        editModal.classList.remove('show');
        setTimeout(() => {
            editModal.style.display = 'none';
        }, 300);
    }
};

// Обработка сохранения изменений в записи
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('editDate').value;
    const soldType = document.getElementById('editSoldType').value;
    const sold = parseFloat(document.getElementById('editSold').value);

    if (!date || !soldType || isNaN(sold)) {
        alert('Пожалуйста, заполните все поля правильно.');
        return;
    }

    const updatedEntry = { date, soldType, sold };

    database.ref('entries/' + currentEditId).set(updatedEntry)
        .then(() => {
            alert('Запись обновлена!');
            editModal.classList.remove('show');
            setTimeout(() => {
                editModal.style.display = 'none';
            }, 300);
            editForm.reset();
        })
        .catch(error => alert('Ошибка при обновлении записи: ' + error.message));
});

// Переключение темы
toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.querySelector('.container').classList.toggle('dark-mode');
    document.querySelectorAll('table, th, td, button').forEach(el => {
        el.classList.toggle('dark-mode');
    });
    document.querySelectorAll('.modal-content').forEach(el => {
        el.classList.toggle('dark-mode');
    });

    // Сохранить выбор темы в Local Storage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        toggleThemeBtn.querySelector('.btn-txt').textContent = 'Светлая тема';
    } else {
        localStorage.setItem('theme', 'light');
        toggleThemeBtn.querySelector('.btn-txt').textContent = 'Темная тема';
    }
});

// Применение сохраненной темы при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.container').classList.add('dark-mode');
        document.querySelectorAll('table, th, td, button').forEach(el => {
            el.classList.add('dark-mode');
        });
        document.querySelectorAll('.modal-content').forEach(el => {
            el.classList.add('dark-mode');
        });
        toggleThemeBtn.querySelector('.btn-txt').textContent = 'Светлая тема';
    }
});

// Отображение индикатора загрузки при первоначальной загрузке
showLoading();

// Отображение записей и скрытие индикатора загрузки при изменении данных
database.ref('entries').on('value', (snapshot) => {
    const entries = snapshot.val();
    renderEntries(entries);
    hideLoading();
});
