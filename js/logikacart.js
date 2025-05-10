let isLoggedIn = false;
let cartCount = 0;
const cartItems = {}; // Menyimpan produk yang sudah ditambahkan

const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartSidebar'));

document.addEventListener('DOMContentLoaded', function () {
    const addButtons = document.querySelectorAll('.btn-add-to-cart');

    addButtons.forEach((btn) => {
        btn.addEventListener('click', function (e) {
            if (!isLoggedIn) {
                e.preventDefault();
                loginModal.show();
            } else {
                const productCard = this.closest('.product');
                const productId = this.getAttribute('data-id');
                const img = productCard.querySelector('.product-img');
                const name = productCard.querySelector('.product-name').innerText;
                const price = productCard.querySelector('.product-price').getAttribute('data-price');
                const imgSrc = img.getAttribute('src');

                animateToCart(img);
                cartCount++;
                const badge = document.getElementById('cartBadge');
                badge.classList.remove('d-none');
                badge.innerText = cartCount;
                badge.classList.add('bounce-badge');
                setTimeout(() => badge.classList.remove('bounce-badge'), 600);

                updateCartSidebar(productId, name, price, imgSrc);
            }
        });
    });

    // Buka keranjang
    document.querySelectorAll('.open-cart').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!isLoggedIn) {
                loginModal.show();
            } else {
                cartOffcanvas.show();
            }
        });
    });

    // Login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (email && password) {
            isLoggedIn = true;
            loginModal.hide();
            alert('Login sukses!');
        } else {
            alert('Silakan masukkan email dan password.');
        }
    });

    // Register
    const showRegisterLink = document.getElementById('showRegister');
    showRegisterLink.addEventListener('click', function (e) {
        e.preventDefault();
        loginModal.hide();
        registerModal.show();
    });

    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        if (name && email && password) {
            alert('Akun berhasil dibuat!');
            registerModal.hide();
            loginModal.show();
        } else {
            alert('Silakan isi semua kolom dengan benar.');
        }
    });
});

// Animasi gambar ke keranjang
function animateToCart(imgElement) {
    const cartIcon = document.querySelector('.open-cart i');
    const imgClone = imgElement.cloneNode(true);
    const imgRect = imgElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    imgClone.style.position = 'fixed';
    imgClone.style.left = imgRect.left + 'px';
    imgClone.style.top = imgRect.top + 'px';
    imgClone.style.width = imgRect.width + 'px';
    imgClone.style.height = imgRect.height + 'px';
    imgClone.style.zIndex = 9999;
    imgClone.style.transition = 'all 0.8s ease-in-out';

    document.body.appendChild(imgClone);

    setTimeout(() => {
        imgClone.style.left = cartRect.left + 'px';
        imgClone.style.top = cartRect.top + 'px';
        imgClone.style.opacity = '0';
        imgClone.style.transform = 'scale(0.1)';
    }, 10);

    setTimeout(() => {
        imgClone.remove();
    }, 900);
}

// Sidebar keranjang
function updateCartSidebar(productId, name, price, imgSrc) {
    const sidebarBody = document.getElementById('cartSidebarBody');
    let item = document.querySelector(`#sidebar-item-${productId}`);

    if (item) {
        updateQty(productId, 1);
        return;
    }

    item = document.createElement('div');
    item.className = "d-flex justify-content-between align-items-center mb-3";
    item.id = `sidebar-item-${productId}`;
    item.innerHTML = `
        <div class="d-flex align-items-start gap-2">
          <img src="${imgSrc}" alt="${name}" width="50" height="50" style="object-fit:cover; border-radius:8px;">
          <div>
            <strong>${name}</strong><br>
            <small class="text-muted">Rp${parseInt(price).toLocaleString()}</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${productId}', -1)">−</button>
          <span id="qty-${productId}">1</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${productId}', 1)">+</button>
        </div>
    `;
    sidebarBody.appendChild(item);

    cartItems[productId] = {
        name,
        price: parseInt(price),
        qty: 1
    };

    updateTotal();
}

// Ubah jumlah produk dan hapus jika qty 0
function updateQty(productId, change) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    const currentQty = parseInt(qtyElement.innerText);
    const newQty = currentQty + change;

    if (newQty < 1) {
        const itemElement = document.getElementById(`sidebar-item-${productId}`);
        if (itemElement) itemElement.remove();

        cartCount -= currentQty;
        if (cartCount <= 0) {
            cartCount = 0;
            document.getElementById('cartBadge').classList.add('d-none');
        } else {
            document.getElementById('cartBadge').innerText = cartCount;
        }

        delete cartItems[productId];
    } else {
        qtyElement.innerText = newQty;
        cartItems[productId].qty = newQty;

        cartCount += change;
        document.getElementById('cartBadge').innerText = cartCount;
    }

    updateTotal();
}

// Hitung total
function updateTotal() {
    const totalElement = document.getElementById('cartTotal');
    let total = 0;
    for (let id in cartItems) {
        total += cartItems[id].price * cartItems[id].qty;
    }
    totalElement.innerText = "Rp" + total.toLocaleString();
}
