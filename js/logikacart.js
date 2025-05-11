let isLoggedIn = false; // Pastikan variabel ini dikelola dengan benar saat login/logout
let cartCount = 0;
const cartItems = {}; // Menyimpan produk yang sudah ditambahkan

const loginModalElement = document.getElementById('loginModal'); // Pastikan ID modal login benar
const loginModal = new bootstrap.Modal(loginModalElement);
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
const cartOffcanvasElement = document.getElementById('cartSidebar');
const cartOffcanvas = new bootstrap.Offcanvas(cartOffcanvasElement);
const checkoutModalElement = document.getElementById('checkoutModal');
const checkoutModal = new bootstrap.Modal(checkoutModalElement);
const orderStatusModalElement = document.getElementById('orderStatusModal'); // Pastikan ID modal pesanan benar
const orderStatusModal = new bootstrap.Modal(orderStatusModalElement);
const orderIcon = document.getElementById('orderIcon');
const successModalElement = document.getElementById('successModal'); // Dapatkan elemen modal sukses
const successModal = new bootstrap.Modal(successModalElement); // Buat instance modal sukses

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

    // Kontrol pembukaan modal pesanan
    if (orderIcon && orderStatusModal && loginModal) {
        orderIcon.addEventListener('click', function (e) {
            e.preventDefault();
            if (isLoggedIn) {
                orderStatusModal.show();
            } else {
                loginModal.show();
            }
        });
    }

    // Mencegah pengiriman formulir checkout dan memanggil buatPesanan
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();
        buatPesanan();
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

    updateTotal(); // Panggil updateTotal di sini agar harga langsung terbarui
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

    updateTotal(); // Pastikan ini dipanggil setiap kali kuantitas berubah
}

// Hitung total harga produk di sidebar
function updateTotal() {
    const totalElement = document.getElementById('cartTotal');
    let total = 0;
    for (let id in cartItems) {
        total += cartItems[id].price * cartItems[id].qty;
    }
    totalElement.innerText = "Rp" + total.toLocaleString();
}

// Hitung total harga produk untuk checkout
function calculateTotalProduk() {
    let totalProduk = 0;
    for (let id in cartItems) {
        totalProduk += cartItems[id].price * cartItems[id].qty;
    }
    return totalProduk;
}

// Hitung total keseluruhan (produk + ongkir)
function calculateTotalKeseluruhan(ongkir) {
    const totalProduk = calculateTotalProduk();
    return totalProduk + ongkir;
}

// Format angka ke Rupiah
function formatRupiah(angka) {
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    });
    return formatter.format(angka);
}

// Update tampilan total di modal checkout
function updateCheckoutTotal(ongkir) {
    const totalProdukElement = document.getElementById('totalProdukCheckout');
    const totalOngkirElement = document.getElementById('totalOngkirCheckout');
    const totalKeseluruhanElement = document.getElementById('totalWithShipping');
    const checkoutTotalElement = document.getElementById('checkoutTotal');

    const totalProduk = calculateTotalProduk();
    const totalKeseluruhan = calculateTotalKeseluruhan(ongkir);

    totalProdukElement.innerText = formatRupiah(totalProduk);
    totalOngkirElement.innerText = formatRupiah(ongkir);
    totalKeseluruhanElement.innerText = formatRupiah(totalKeseluruhan);
    checkoutTotalElement.innerText = formatRupiah(totalKeseluruhan); // Update total di footer modal
}

checkoutModalElement.addEventListener('show.bs.modal', function () {
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = ''; // Kosongkan isi sebelumnya

    let totalProduk = 0;

    for (let id in cartItems) {
        const item = cartItems[id];
        const itemElement = document.createElement('div');
        itemElement.className = 'd-flex justify-content-between mb-2';

        itemElement.innerHTML = `
            <div>
                <strong>${item.name}</strong> x ${item.qty}
            </div>
            <div>
                ${formatRupiah(item.price * item.qty)}
            </div>
        `;

        orderDetails.appendChild(itemElement);
        totalProduk += item.price * item.qty;
    }

    // Tampilkan total produk awal di modal
    document.getElementById('totalProdukCheckout').innerText = formatRupiah(totalProduk);
    document.getElementById('totalOngkirCheckout').innerText = formatRupiah(0); // Set ongkir awal 0
    document.getElementById('totalWithShipping').innerText = formatRupiah(totalProduk); // Set total awal sama dengan total produk
    document.getElementById('checkoutTotal').innerText = formatRupiah(totalProduk); // Set total di footer awal

    // Inisialisasi peta dan rute setelah modal ditampilkan
    setTimeout(() => {
        initMapAndRoute();
    }, 500);
});

function initMapAndRoute() {
    const tokoLat = -6.246761;   // Ganti ini dengan posisi toko kamu
    const tokoLng = 106.729114;
    const mapContainer = document.getElementById('map');

    const map = L.map('map').setView([tokoLat, tokoLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([tokoLat, tokoLng]).addTo(map).bindPopup("Toko").openPopup();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const userMarker = L.marker([userLat, userLng]).addTo(map).bindPopup("Lokasi Anda");

            fetch(`https://router.project-osrm.org/route/v1/driving/${tokoLng},${tokoLat};${userLng},${userLat}?overview=full&geometries=geojson`)
                .then(res => res.json())
                .then(data => {
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const distance = route.distance / 1000;
                        const ongkir = Math.ceil(distance) * 5000;

                        document.getElementById('distance').value = distance.toFixed(2);
                        document.getElementById('shippingCost').value = formatRupiah(ongkir);

                        L.geoJSON(route.geometry, {
                            style: { color: 'blue', weight: 4 }
                        }).addTo(map);

                        map.fitBounds([
                            [tokoLat, tokoLng],
                            [userLat, userLng]
                        ]);

                        // Update total dengan ongkir di modal
                        updateCheckoutTotal(ongkir);

                    } else {
                        // Jika tidak ada rute ditemukan, set ongkir ke 0 dan update total
                        document.getElementById('distance').value = 'Tidak ditemukan';
                        document.getElementById('shippingCost').value = formatRupiah(0);
                        updateCheckoutTotal(0);
                    }
                })
                .catch(error => {
                    console.error("Error fetching route:", error);
                    document.getElementById('distance').value = 'Gagal menghitung';
                    document.getElementById('shippingCost').value = formatRupiah(0);
                    updateCheckoutTotal(0);
                });
        }, function (err) {
            alert("Gagal mendeteksi lokasi: " + err.message);
            document.getElementById('distance').value = 'Tidak terdeteksi';
            document.getElementById('shippingCost').value = formatRupiah(0);
            updateCheckoutTotal(0);
        });
    } else {
        alert("Geolocation tidak didukung oleh browser kamu.");
        document.getElementById('distance').value = 'Tidak didukung';
        document.getElementById('shippingCost').value = formatRupiah(0);
        updateCheckoutTotal(0);
    }
}


  document.addEventListener('DOMContentLoaded', function () {
    const checkoutModalEl = document.getElementById('checkoutModal');
    const orderBadge = document.getElementById('orderBadge');
    const orderForm = document.getElementById('orderForm');

    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Tutup modal checkout
      const checkoutModal = bootstrap.Modal.getInstance(checkoutModalEl);
      if (checkoutModal) {
        checkoutModal.hide();
      }

      // Tampilkan indikator di menu Pesanan
      orderBadge.classList.remove('d-none');
      orderBadge.textContent = '1'; // Atur angka sesuai jumlah pesanan jika dinamis

      // (Opsional) Tampilkan modal sukses
     const successModalEl = document.getElementById('successModal');
const successModal = new bootstrap.Modal(successModalEl);
successModal.show();

// FIX: Hapus backdrop yang tertinggal & perbaiki interaksi halaman
successModalEl.addEventListener('hidden.bs.modal', () => {
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
});

    });
  });


  