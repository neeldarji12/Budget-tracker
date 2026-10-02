const transactionForm = document.getElementById("transactionForm");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const transactionList = document.getElementById("transactionList");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filterType");
const sortBy = document.getElementById("sortBy");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const emptyMessage = document.getElementById("emptyMessage");
const exportBtn = document.getElementById("exportBtn");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editId = null;

const today = new Date().toISOString().split("T")[0];
dateInput.value = today;

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const date = dateInput.value.trim();
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;
    const type = typeInput.value;
    const amount = Number(amountInput.value);

    if (!date) {
        alert("Please select a date.");
        return;
    }

    if (!description) {
        alert("Please enter description.");
        return;
    }

    if (amount <= 0 || isNaN(amount)) {
        alert("Please enter a valid amount.");
        return;
    }

    if (editId !== null) {
        const transaction = transactions.find(item => item.id === editId);

        if (transaction) {
            transaction.date = date;
            transaction.description = description;
            transaction.category = category;
            transaction.type = type;
            transaction.amount = amount;
        }

        editId = null;
        submitBtn.textContent = "Add Transaction";
        cancelBtn.style.display = "none";
    } else {
        transactions.push({
            id: Date.now(),
            date,
            description,
            category,
            type,
            amount
        });
    }

    saveData();
    transactionForm.reset();
    dateInput.value = today;
    displayTransactions();
    updateSummary();
    createChart();
});

function displayTransactions() {
    let filteredTransactions = [...transactions];
    const searchText = searchInput.value.toLowerCase().trim();

    if (searchText) {
        filteredTransactions = filteredTransactions.filter(item =>
            item.description.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText)
        );
    }

    const selectedType = filterType.value;

    if (selectedType !== "all") {
        filteredTransactions = filteredTransactions.filter(
            item => item.type === selectedType
        );
    }

    const selectedSort = sortBy.value;

    if (selectedSort === "newest") {
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (selectedSort === "oldest") {
        filteredTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (selectedSort === "high") {
        filteredTransactions.sort((a, b) => b.amount - a.amount);
    } else if (selectedSort === "low") {
        filteredTransactions.sort((a, b) => a.amount - b.amount);
    }

    transactionList.innerHTML = "";

    if (filteredTransactions.length === 0) {
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    filteredTransactions.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(item.date)}</td>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td><span class="${item.type}">${item.type.toUpperCase()}</span></td>
            <td>₹${Number(item.amount).toFixed(2)}</td>
            <td>
                <button class="btn btn-warning btn-sm action-btn" onclick="editTransaction(${item.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${item.id})">Delete</button>
            </td>
        `;

        transactionList.appendChild(row);
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function deleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    transactions = transactions.filter(item => item.id !== id);
    saveData();
    displayTransactions();
    updateSummary();
    createChart();
}

function editTransaction(id) {
    const transaction = transactions.find(item => item.id === id);

    if (!transaction) return;

    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;
    categoryInput.value = transaction.category;
    typeInput.value = transaction.type;
    amountInput.value = transaction.amount;

    editId = id;
    submitBtn.textContent = "Update Transaction";
    cancelBtn.style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

cancelBtn.addEventListener("click", function () {
    editId = null;
    transactionForm.reset();
    dateInput.value = today;
    submitBtn.textContent = "Add Transaction";
    cancelBtn.style.display = "none";
});

function updateSummary() {
    let income = 0;
    let expense = 0;

    transactions.forEach(item => {
        if (item.type === "income") {
            income += Number(item.amount);
        } else {
            expense += Number(item.amount);
        }
    });

    totalIncome.textContent = `₹${income.toFixed(2)}`;
    totalExpense.textContent = `₹${expense.toFixed(2)}`;
    balance.textContent = `₹${(income - expense).toFixed(2)}`;
}

searchInput.addEventListener("input", displayTransactions);
filterType.addEventListener("change", displayTransactions);
sortBy.addEventListener("change", displayTransactions);

exportBtn.addEventListener("click", function () {
    if (transactions.length === 0) {
        alert("No transaction data to export.");
        return;
    }

    const data = JSON.stringify(transactions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "budget-transactions.json";
    link.click();

    URL.revokeObjectURL(url);
});

function createChart() {
    const chart = document.getElementById("chart");
    chart.innerHTML = "";

    const expenses = transactions.filter(item => item.type === "expense");

    if (expenses.length === 0) {
        chart.innerHTML = "<p class='text-muted'>No expense data available.</p>";
        return;
    }

    const recentExpenses = expenses.slice(-10);
    const maxAmount = Math.max(...recentExpenses.map(item => Number(item.amount)));

    recentExpenses.forEach(item => {
        const bar = document.createElement("div");
        bar.className = "bar";

        const height = (Number(item.amount) / maxAmount) * 180;
        bar.style.height = `${Math.max(height, 10)}px`;
        bar.title = `${item.description}: ₹${item.amount}`;

        bar.innerHTML = `<span class="bar-label">₹${item.amount}</span>`;
        chart.appendChild(bar);
    });
}

displayTransactions();
updateSummary();
createChart();
