const state = { products: [] };

const $ = selector => document.querySelector(selector);

const money = value =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR"
    }).format(Number(value) || 0);

async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    if (!response.ok) {
        let message = "Request failed";

        try {
            const json = await response.json();
            message = json.message || message;
        } catch {
            // Ignore invalid or empty error responses.
        }

        throw new Error(message);
    }

    return response.status === 204 ? null : response.json();
}

function showToast(message) {
    const toast = $("#toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
}

function navigate(section) {
    document
        .querySelectorAll(".section")
        .forEach(element => element.classList.remove("active"));

    $("#" + section + "-section").classList.add("active");

    document
        .querySelectorAll(".nav-item")
        .forEach(element =>
            element.classList.toggle(
                "active",
                element.dataset.section === section
            )
        );

    $("#page-title").textContent =
        section === "stock"
            ? "Stock movement"
            : section[0].toUpperCase() + section.slice(1);

    if (section === "products") {
        renderProducts();
    }
}

document
    .querySelectorAll(".nav-item")
    .forEach(button =>
        button.addEventListener(
            "click",
            () => navigate(button.dataset.section)
        )
    );

document
    .querySelectorAll("[data-section-link]")
    .forEach(button =>
        button.addEventListener(
            "click",
            () => navigate(button.dataset.sectionLink)
        )
    );

$("#add-product-btn").onclick = () =>
    $("#product-dialog").showModal();

$("#search").addEventListener("input", renderProducts);

async function load() {
    try {
        state.products = await api("/products");

        renderDashboard();
        renderProducts();
        renderStockProducts();
    } catch (error) {
        showToast("Could not load products: " + error.message);
    }
}

function renderDashboard() {
    const products = state.products;

    const totalUnits = products.reduce(
        (total, product) => total + (product.quantity || 0),
        0
    );

    const inventoryValue = products.reduce(
        (total, product) =>
            total +
            (Number(product.price) || 0) *
            (product.quantity || 0),
        0
    );

    const lowStock = products.filter(
        product => (product.quantity || 0) <= 5
    ).length;

    $("#total-products").textContent = products.length;
    $("#total-units").textContent = totalUnits;
    $("#inventory-value").textContent = money(inventoryValue);
    $("#low-stock").textContent = lowStock;

    const maxQuantity = Math.max(
        1,
        ...products.map(product => product.quantity || 0)
    );

    $("#overview-list").innerHTML = products.length
        ? products
            .slice(0, 7)
            .map(product => `
<div class="overview-row">
    <div class="overview-name">
    ${escapeHtml(product.name)}
</div>

<div class="bar">
    <i
        style="width:${Math.round(
                                (product.quantity || 0) /
                                maxQuantity *
                                100
                            )}%"
    ></i>
</div>

<div class="stock-num">
    ${product.quantity || 0} units
</div>
</div>
`)
            .join("")
        : '<div class="empty">No products yet.</div>';
}

function renderProducts() {
    const query = ($("#search")?.value || "").toLowerCase();

    const products = state.products.filter(product =>
        (product.name || "").toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query)
    );

    $("#product-table").innerHTML = products.length
        ? products
            .map(product => `
<tr>
<td>
${escapeHtml(product.name)}
</td>

<td>
    ${escapeHtml(product.description || "—")}
</td>

<td>
    ${money(product.price)}
</td>

<td>
                        <span
                            class="stock-badge ${
                                product.quantity <= 5 ? "low" : ""
                            }"
                        >
                            ${product.quantity} units
                        </span>
</td>

<td>
    <button
        class="ghost"
        onclick="quickReceive(${product.id})"
    >
        Receive
    </button>

    <button
        class="ghost"
        onclick="quickShip(${product.id})"
    >
        Ship
    </button>
</td>
</tr>
`)
            .join("")
        : `
<tr>
<td colspan="5" class="empty">
    No products found.
</td>
</tr>
`;
}

function renderStockProducts() {
    const options = state.products.length
        ? state.products
            .map(product => `
<option value="${product.id}">
    ${escapeHtml(product.name)} — ${product.quantity} units
</option>
    `)
            .join("")
        : `
<option value="">
    No products available
</option>
    `;

    $("#receive-product").innerHTML = options;
    $("#ship-product").innerHTML = options;
}

function quickReceive(id) {
    navigate("stock");

    $("#receive-product").value = id;
    $("#receive-quantity").focus();
}

function quickShip(id) {
    navigate("stock");

    $("#ship-product").value = id;
    $("#ship-quantity").focus();
}

$("#receive-form").addEventListener("submit", async event => {
    event.preventDefault();

    const id = $("#receive-product").value;
    const quantity = Number($("#receive-quantity").value);

    try {
        await api(
            `/api/inventory/products/${id}/receive`,
{
    method: "POST",
        body: JSON.stringify({
    quantity: quantity
})
}
);

$("#receive-message").textContent =
    "Stock received successfully.";

showToast("Stock received");

$("#receive-quantity").value = 1;

await load();
} catch (error) {
    $("#receive-message").textContent = error.message;
}
});

$("#ship-form").addEventListener("submit", async event => {
    event.preventDefault();

    const id = $("#ship-product").value;
    const quantity = Number($("#ship-quantity").value);

    try {
        await api(
            `/api/inventory/products/${id}/ship`,
            {
                method: "POST",
                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        $("#ship-message").textContent =
            "Stock shipped successfully.";

        showToast("Stock shipped");

        $("#ship-quantity").value = 1;

        await load();
    } catch (error) {
        $("#ship-message").textContent = error.message;
    }
});

$("#product-form").addEventListener("submit", async event => {
    event.preventDefault();

    const product = {
        name: $("#product-name").value.trim(),
        description: $("#product-description").value.trim(),
        price: Number($("#product-price").value),
        quantity: Number($("#product-quantity").value)
    };

    try {
        await api(
            "/products",
            {
                method: "POST",
                body: JSON.stringify(product)
            }
        );

        $("#product-dialog").close();

        event.target.reset();

        $("#product-quantity").value = 0;

        showToast("Product created");

        await load();
    } catch (error) {
        $("#product-message").textContent = error.message;
    }
});

function escapeHtml(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}

load();
