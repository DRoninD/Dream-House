// Contentful API SDK
const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "fbfsn1s1gfva",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "Sz_DXzvNoYnfg-SEggA23zk70FFkfIw8OwkDlmw1C-c",
});

// DOM varibles

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// MAIN CART
let cart = [];

// Buttons
let buttonsDOM = [];

// Getting the products
class Products {
    async getProducts() {
        try {
            let contentful = await client.getEntries({
                content_type: "dreamHouseProducts",
            });
            console.log(contentful);

            // let result = await fetch("products.json");
            // let data = await result.json();

            // Destructuring the json object
            let products = contentful.items;
            products = products.map((item) => {
                const { title, price } = item.fields;
                const { id } = item.sys;

                const image = item.fields.image.fields.file.url;

                return { title, price, id, image };
            });

            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

// UI class display products
class UI {
    displayProducts(products) {
        let result = "";

        products.forEach((product) => {
            result += `
            <!-- single product -->
            <article class="product">
                <div class="img-container">
                    <img src=${product.image} alt="product 1" class="product-img" />
                    <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>
              add to cart
            </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>
            <!-- end of single product -->`;
        });
        productsDOM.innerHTML = result;
    }

    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;

        // LOGIC
        buttons.forEach((button) => {
            let id = button.dataset.id;
            let inCart = cart.find((item) => item.id === id);
            if (inCart) {
                button.innerText = "In Cart";
                button.disable = true;
            }
            button.addEventListener("click", (event) => {
                event.target.innerText = "In Cart";
                event.target.disable = true;

                // Get product from pdocuts based on ID
                let cartItem = {
                    ...Storage.getProduct(id),
                    amount: 1,
                };

                // Add that product to the cart
                cart = [...cart, cartItem];

                //Save cart in local storage
                Storage.saveCart(cart);

                // Set cart values
                this.setCartValues(cart);

                // Display cart item
                this.addCartItem(cartItem);

                // Show cart
                this.showCart();
            });
        });
    }

    // Calculating the amout
    setCartValues(cart) {
            let tempTotal = 0;
            let itemsTotal = 0;
            cart.map((item) => {
                tempTotal += item.price * item.amount;
                itemsTotal += item.amount;
            });
            cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
            cartItems.innerText = itemsTotal;
        }
        // Adding items to the cart
    addCartItem(item) {
            // Creating HTML element DIV
            const div = document.createElement("div");

            div.classList.add("cart-item");

            div.innerHTML = `<img src=${item.image} alt="image of product" />
        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>`;
            cartContent.appendChild(div);
        }
        // Show cart overlay
    showCart() {
        cartOverlay.classList.add("transparentBcg");
        cartDOM.classList.add("showCart");
    }

    // Setup APP
    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener("click", this.showCart);
        closeCartBtn.addEventListener("click", this.hideCart);
    }

    // Fill the cart with items
    populateCart(cart) {
        cart.forEach((item) => this.addCartItem(item));
    }

    // Hide cart
    hideCart() {
        cartOverlay.classList.remove("transparentBcg");
        cartDOM.classList.remove("showCart");
    }

    // Logic inside the cart, remove items, clear cart, update
    cartLogic() {
        // Clear cart
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();
        });

        // Cart funcionality
        cartContent.addEventListener("click", (event) => {
            if (event.target.classList.contains("remove-item")) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItems(id);
            } else if (event.target.classList.contains("fa-chevron-up")) {
                let increaseAmount = event.target;
                let id = increaseAmount.dataset.id;
                let tempItem = cart.find((item) => item.id === id);
                tempItem.amount += 1;

                // Update the local storage
                Storage.saveCart(cart);
                this.setCartValues(cart);

                increaseAmount.nextElementSibling.innerText = tempItem.amount;
            } else if (event.target.classList.contains("fa-chevron-down")) {
                let decreaseAmount = event.target;
                let id = decreaseAmount.dataset.id;
                let tempItem = cart.find((item) => item.id === id);
                tempItem.amount -= 1;

                // If the user hits 0 for product amount
                if (tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    decreaseAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    cartContent.removeChild(decreaseAmount.parentElement.parentElement);
                    this.removeItems(id);
                }
            }
        });
    }

    // Clearing the cart
    clearCart() {
        let cartItems = cart.map((item) => item.id);
        cartItems.forEach((id) => this.removeItems(id));

        // Removing all children
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    removeItems(id) {
        cart = cart.filter((item) => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
    }

    getSingleButton(id) {
        return buttonsDOM.find((button) => button.dataset.id === id);
    }
}

// Local storage
class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));

        return products.find((product) => product.id === id);
    }

    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    static getCart() {
        return localStorage.getItem("cart") ?
            JSON.parse(localStorage.getItem("cart")) :
            [];
    }
}

// DOM Rendering
document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();
    console.log((dom = performance.now()), "now loaded");

    // Setup APP
    ui.setupAPP();
    //Get all products
    products
        .getProducts()
        .then((products) => {
            ui.displayProducts(products);
            Storage.saveProducts(products);
        })
        .then(() => {
            ui.getBagButtons();
            ui.cartLogic();
        });

    // Local storage
});