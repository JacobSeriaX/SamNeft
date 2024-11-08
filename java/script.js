// Твоя конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDZrQVcTvLhLDhrjvDFoOk63ob4G6xyKLg",
  authDomain: "sam-neft.firebaseapp.com",
  databaseURL: "https://sam-neft-default-rtdb.firebaseio.com",
  projectId: "sam-neft",
  storageBucket: "sam-neft.firebasestorage.app",
  messagingSenderId: "604869571586",
  appId: "1:604869571586:web:94e4756142099b8b41231b"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Ссылки на элементы DOM
const addItemForm = document.getElementById('addItemForm');
const inventoryList = document.getElementById('inventoryList');
const salesList = document.getElementById('salesList');

// Добавление нового товара
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('itemName').value.trim();
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const price = parseFloat(document.getElementById('itemPrice').value);
    
    if(name && quantity >= 0 && price >= 0){
        const newItemRef = database.ref('inventory').push();
        newItemRef.set({
            name,
            quantity,
            price
        });
        addItemForm.reset();
    }
});

// Отображение инвентаря
database.ref('inventory').on('value', (snapshot) => {
    inventoryList.innerHTML = '';
    const inventory = snapshot.val();
    for(let id in inventory){
        const item = inventory[id];
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name} - Количество: ${item.quantity} - Цена: ${item.price} руб.</span>
            <button onclick="sellItem('${id}', '${item.name}', ${item.quantity})">Продать</button>
        `;
        inventoryList.appendChild(li);
    }
});

// Функция продажи товара
function sellItem(id, name, currentQuantity){
    const sellQuantity = parseInt(prompt(`Сколько ${name} продано?`, "1"));
    if(sellQuantity > 0 && sellQuantity <= currentQuantity){
        // Обновление количества товара
        const updatedQuantity = currentQuantity - sellQuantity;
        database.ref(`inventory/${id}`).update({
            quantity: updatedQuantity
        });

        // Запись продажи
        const salesRef = database.ref('sales').push();
        salesRef.set({
            name,
            quantity: sellQuantity,
            time: new Date().toLocaleString()
        });
    } else {
        alert("Некорректное количество продажи.");
    }
}

// Отображение продаж
database.ref('sales').on('value', (snapshot) => {
    salesList.innerHTML = '';
    const sales = snapshot.val();
    for(let id in sales){
        const sale = sales[id];
        const li = document.createElement('li');
        li.textContent = `${sale.time}: Продано ${sale.quantity} шт. ${sale.name}`;
        salesList.appendChild(li);
    }
}

// Добавление функции sellItem в глобальный объект
window.sellItem = sellItem;
