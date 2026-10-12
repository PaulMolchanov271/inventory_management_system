const state = {
products: [],
    user: null,
    stockAction: null,
    selectedProductId: null,
    sort: { field: "name", direction: "asc" }
};

const $ = selector => document.querySelector(selector);
const money = value => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "EUR"
}).format(Number(value) || 0);

async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const body = await response.json();
            message = body.message || body.error || message;
        } catch { /* Response may be empty or non-JSON. */ }
        throw new Error(message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
}

function isAdmin() {
    return state.user?.role === "ADMIN";
}

function applyRoleVisibility() {
    document.querySelectorAll(".admin-only").forEach(element => {
        element.hidden = !isAdmin();
    });
    $("#add-product-btn").hidden = !isAdmin();
}

function navigate(section) {
    if (section === "transactions" && !isAdmin()) {
        showToast("Access denied");
        return;
    }
    document.querySelectorAll(".section").forEach(element => {
        element.classList.remove("active");
        element.hidden = element.classList.contains("admin-only") && !isAdmin();
    });
    const target = $(`#${section}-section`);
    if (!target) return;
    target.hidden = false;
    target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(element =>
        element.classList.toggle("active", element.dataset.section === section)
    );
    $("#page-title").textContent = section === "transactions"
        ? "Transactions"
        : section[0].toUpperCase() + section.slice(1);
    $("#add-product-btn").hidden = !isAdmin();

    if (section === "products") renderProducts();
    if (section === "profile") loadProfile();
    if (section === "transactions") loadTransactions();
}

document.querySelectorAll(".nav-item").forEach(button =>
    button.addEventListener("click", () => navigate(button.dataset.section))
);
document.querySelectorAll("[data-section-link]").forEach(button =>
    button.addEventListener("click", () => navigate(button.dataset.sectionLink))
);
document.querySelectorAll("[data-close-dialog]").forEach(button =>
    button.addEventListener("click", () => $(`#${button.dataset.closeDialog}`).close())
);
$("#add-product-btn").addEventListener("click", () => {
    $("#product-message").textContent = "";
    $("#product-dialog").showModal();
});
$("#search").addEventListener("input", renderProducts);
$("#logout-btn").addEventListener("click", () => { window.location.href = "/logout"; });
$("#refresh-transactions").addEventListener("click", loadTransactions);

document.querySelectorAll(".sort-header").forEach(button => {
    button.addEventListener("click", () => {
        const field = button.dataset.sort;
        if (state.sort.field === field) {
            state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
        } else {
            state.sort.field = field;
            state.sort.direction = "asc";
        }
        updateSortHeaders();
        renderProducts();
    });
});

$("#low-stock-card").addEventListener("click", () => {
    const list = $("#low-stock-list");
    list.classList.toggle("show");
    if (list.classList.contains("show")) {
        list.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
});

async function initialize() {
    try {
        state.user = await api("/auth/me");
        applyRoleVisibility();
        await loadProducts();
        renderDashboard();
        renderProducts();
    } catch (error) {
        showToast("Could not initialize application: " + error.message);
    }
}

async function loadProducts() {
    state.products = await api("/products");
    renderDashboard();
    renderProducts();
}

function renderDashboard() {
    const products = state.products;
    const totalUnits = products.reduce((total, product) => total + (Number(product.quantity) || 0), 0);
    const inventoryValue = products.reduce((total, product) =>
        total + (Number(product.price) || 0) * (Number(product.quantity) || 0), 0);
    const lowStockProducts = products.filter(product => (Number(product.quantity) || 0) <= 5);

    $("#total-products").textContent = products.length;
    $("#total-units").textContent = totalUnits;
    $("#inventory-value").textContent = money(inventoryValue);
    $("#low-stock").textContent = lowStockProducts.length;
    $("#low-stock-list").innerHTML = lowStockProducts.length ? `
<div class="panel low-stock-panel">
  <div class="panel-head"><div><h2>Low stock products</h2><p>Products with 5 units or less</p></div></div>
  <div class="low-stock-items">${lowStockProducts.map(product => `
    <div class="low-stock-item"><div><strong>${escapeHtml(product.name)}</strong>
      <span>${escapeHtml(product.description || "No description")}</span></div><b>${product.quantity} units</b></div>
    `).join("")}</div>
</div>` : "";

    const maxQuantity = Math.max(1, ...products.map(product => Number(product.quantity) || 0));
    $("#overview-list").innerHTML = products.length ? products.slice(0, 7).map(product => `
<div class="overview-row"><div class="overview-name">${escapeHtml(product.name)}</div>
  <div class="bar"><i style="width:${Math.round((Number(product.quantity) || 0) / maxQuantity * 100)}%"></i></div>
  <div class="stock-num">${product.quantity || 0} units</div></div>
`).join("") : '<div class="empty">No products yet.</div>';
}

function renderProducts() {
    if (!$("#product-table")) return;
    const query = ($("#search")?.value || "").toLowerCase();
    let products = state.products.filter(product =>
        (product.name || "").toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query)
    );
    products.sort((a, b) => {
        let result;
        if (state.sort.field === "price") result = Number(a.price || 0) - Number(b.price || 0);
        else if (state.sort.field === "stock") result = Number(a.quantity || 0) - Number(b.quantity || 0);
        else result = (a.name || "").localeCompare(b.name || "");
        return state.sort.direction === "asc" ? result : -result;
    });

    $("#product-table").innerHTML = products.length ? products.map(product => `
<tr>
  <td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.description || "—")}</td>
  <td>${money(product.price)}</td>
  <td><span class="stock-badge ${(Number(product.quantity) || 0) <= 5 ? "low" : ""}">${product.quantity} units</span></td>
  <td class="actions-cell">
    <button class="ghost" data-stock-action="receive" data-product-id="${product.id}">Receive</button>
    <button class="ghost" data-stock-action="ship" data-product-id="${product.id}">Ship</button>
    ${isAdmin() ? `<button class="danger-button" data-delete-product="${product.id}">Delete</button>` : ""}
  </td>
</tr>`).join("") : '<tr><td colspan="5" class="empty">No products found.</td></tr>';

    $("#product-table").querySelectorAll("[data-stock-action]").forEach(button =>
        button.addEventListener("click", () => openStockDialog(
            Number(button.dataset.productId), button.dataset.stockAction
        ))
    );
    $("#product-table").querySelectorAll("[data-delete-product]").forEach(button =>
        button.addEventListener("click", () => deleteProduct(Number(button.dataset.deleteProduct)))
    );
}

function updateSortHeaders() {
    document.querySelectorAll(".sort-header").forEach(button => {
        const arrow = button.querySelector("span");
        const active = button.dataset.sort === state.sort.field;
        button.classList.toggle("active", active);
        arrow.textContent = !active ? "↕" : state.sort.direction === "asc" ? "↑" : "↓";
    });
}

function openStockDialog(productId, action) {
    const product = state.products.find(item => Number(item.id) === productId);
    if (!product) return;
    state.selectedProductId = productId;
    state.stockAction = action;
    $("#stock-dialog-title").textContent = action === "receive" ? "Receive stock" : "Ship stock";
    $("#stock-dialog-product").textContent = `${product.name} · Current stock: ${product.quantity} units`;
    $("#stock-dialog-submit").textContent = action === "receive" ? "Receive units" : "Ship units";
    $("#stock-dialog-quantity").value = "1";
    $("#stock-dialog-message").textContent = "";
    $("#stock-dialog").showModal();
    $("#stock-dialog-quantity").focus();
}

$("#stock-form").addEventListener("submit", async event => {
    event.preventDefault();
    const quantity = Number($("#stock-dialog-quantity").value);
    if (!Number.isInteger(quantity) || quantity < 1) {
        $("#stock-dialog-message").textContent = "Enter a whole number greater than zero.";
        return;
    }
    const id = state.selectedProductId;
    const action = state.stockAction;
    if (!id || !action) return;
    const submit = $("#stock-dialog-submit");
    submit.disabled = true;
    try {
        await api(`/api/inventory/products/${id}/${action}`, {
            method: "POST", body: JSON.stringify({ quantity })
        });
        $("#stock-dialog").close();
        showToast(action === "receive" ? "Stock received successfully" : "Stock shipped successfully");
        await loadProducts();
    } catch (error) {
        $("#stock-dialog-message").textContent = error.message;
    } finally {
        submit.disabled = false;
    }
});

async function deleteProduct(id) {
    if (!isAdmin()) {
        showToast("Only administrators can delete products");
        return;
    }
    const product = state.products.find(item => Number(item.id) === id);
    if (!product || !confirm(`Delete "${product.name}"? Products with transaction history may not be deletable.`)) return;
    try {
        await api(`/products/${id}`, { method: "DELETE" });
        showToast("Product deleted");
        await loadProducts();
    } catch (error) {
        showToast(error.message);
    }
}

$("#product-form").addEventListener("submit", async event => {
    event.preventDefault();
    const product = {
        name: $("#product-name").value.trim(),
        description: $("#product-description").value.trim(),
        price: Number($("#product-price").value),
        quantity: Number($("#product-quantity").value)
    };
    try {
        await api("/products", { method: "POST", body: JSON.stringify(product) });
        $("#product-dialog").close();
        event.target.reset();
        $("#product-quantity").value = 0;
        showToast("Product created");
        await loadProducts();
    } catch (error) {
        $("#product-message").textContent = error.message;
    }
});

async function loadTransactions() {
    if (!isAdmin()) return;
    const tbody = $("#transactions-table");
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Loading transactions…</td></tr>';
    try {
        const transactions = await api("/api/inventory/transactions");
        tbody.innerHTML = transactions.length ? transactions.map(transaction => `
<tr>
  <td>${escapeHtml(transaction.id)}</td>
  <td>${escapeHtml(transaction.productName || "Deleted product")}</td>
  <td><span class="transaction-type">${escapeHtml(transaction.type || "—")}</span></td>
  <td>${escapeHtml(transaction.quantity)}</td>
  <td>${escapeHtml(transaction.username || "—")}</td>
  <td>${escapeHtml(formatDate(transaction.createdAt))}</td>
</tr>`).join("") : '<tr><td colspan="6" class="empty">No transactions recorded.</td></tr>';
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(error.message)}</td></tr>`;
    }
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

async function loadProfile() {
    try {
        const user = await api("/auth/me");
        state.user = user;
        applyRoleVisibility();
        $("#profile-username").textContent = user.username;
        $("#profile-role").textContent = user.role;
        $("#profile-avatar").textContent = (user.username || "?").charAt(0).toUpperCase();
    } catch (error) {
        showToast("Could not load profile: " + error.message);
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

updateSortHeaders();
initialize();