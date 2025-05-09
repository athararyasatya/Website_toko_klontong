let isLoggedIn = false; // Awalnya user belum login
let cartCount = 0; // Menghitung jumlah produk dalam cart

const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartSidebar')); // Inisialisasi cartOffcanvas di sini

// Event Listener untuk tombol Add to Cart
document.addEventListener('DOMContentLoaded', function () {
    const addButtons = document.querySelectorAll('.btn-add-to-cart');

    addButtons.forEach((btn) => {
        btn.addEventListener('click', function (e) {
            if (!isLoggedIn) {
                e.preventDefault(); // Cegah aksi default jika belum login
                loginModal.show(); // Tampilkan modal login
            } else {
                const img = this.closest('.border').querySelector('.product-img');
                animateToCart(img);

                // Update badge
                cartCount++;
                const badge = document.getElementById('cartBadge');
                badge.classList.remove('d-none');
                badge.innerText = cartCount;
                badge.classList.add('bounce-badge');

                // Reset bounce animation so it can retrigger
                setTimeout(() => badge.classList.remove('bounce-badge'), 600);

                // Add to sidebar cart
                updateCartSidebar('broccoli'); // Ganti dengan productId yang sesuai
            }
        });
    });

    // Tombol Keranjang
    document.querySelectorAll('.open-cart').forEach(btn => {
        btn.addEventListener('click', function (e) {
            console.log('isLoggedIn saat klik keranjang:', isLoggedIn); // Cek nilai isLoggedIn
            if (!isLoggedIn) {
                e.preventDefault();
                loginModal.show();
            } else {
                cartOffcanvas.show(); // Gunakan cartOffcanvas di sini
            }
        });
    });

    // Mencegah scroll saat klik ikon keranjang (sekarang tidak perlu display: block)
    const cartIcon = document.querySelector('.open-cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', function (e) {
            e.preventDefault(); // Mencegah aksi default scroll ke atas
            // cartOffcanvas.show(); // Sekarang ditangani di atas
        });
    }

    // Handler submit form login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Simulasi login sukses
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (email && password) {
            // Logika login sukses di sini (misalnya, cek email dan password)
            isLoggedIn = true;
            loginModal.hide(); // Sembunyikan modal setelah login berhasil
            alert('Login sukses!');
            console.log('isLoggedIn setelah login:', isLoggedIn); // Cek nilai setelah login
        } else {
            alert('Silakan masukkan email dan password yang benar.');
        }
    });

    // Handler untuk link "Daftar di sini" pada modal login
    const showRegisterLink = document.getElementById('showRegister');
    showRegisterLink.addEventListener('click', function (e) {
        e.preventDefault();
        loginModal.hide(); // Sembunyikan modal login
        registerModal.show(); // Tampilkan modal register
    });

    // Handler submit form register
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Simulasi registrasi sukses
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (name && email && password) {
            // Logika register sukses di sini (misalnya, kirim data ke server)
            alert('Akun berhasil dibuat!');
            registerModal.hide(); // Sembunyikan modal register
            loginModal.show(); // Tampilkan modal login setelah registrasi berhasil
        } else {
            alert('Silakan isi semua kolom dengan benar.');
        }
    });
});

// Fungsi Animasi "Fly to Cart"
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

// Fungsi untuk update Sidebar Keranjang
function updateCartSidebar(productId) {
    const sidebarBody = document.getElementById('cartSidebarBody');

    // Cek apakah produk sudah ada di sidebar
    const existingItem = document.querySelector(`#sidebar-item-${productId}`);
    if (existingItem) {
        updateQty(productId, 1);
        return;
    }

    // Jika belum ada, tambahkan produk baru
    const item = document.createElement('div');
    item.className = "d-flex justify-content-between align-items-center mb-2";
    item.id = `sidebar-item-${productId}`;
    item.innerHTML = `
        <div>
            <strong>${productId}</strong><br>
            <small class="text-muted">500gm</small>
        </div>
        <div class="d-flex align-items-center gap-1">
            <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${productId}', -1)">−</button>
            <span id="qty-${productId}">1</span>
            <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${productId}', 1)">+</button>
        </div>
    `;
    sidebarBody.appendChild(item);

    // Tampilkan sidebar cart jika produk pertama ditambahkan (opsional, bisa dihilangkan jika ingin selalu hidden sampai tombol keranjang diklik)
    // const sidebar = document.getElementById('cartSidebar');
    // sidebar.style.display = 'block';
}

// Fungsi untuk update kuantitas produk di sidebar
function updateQty(productId, change) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    let qty = parseInt(qtyElement.innerText);
    qty += change;

    if (qty < 1) qty = 1; // Minimum qty adalah 1
    qtyElement.innerText = qty;
}