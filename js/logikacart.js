let isLoggedIn = false;
let cartCount = 0;
const cartItems = {};
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartSidebar'));
const checkoutModalElement = document.getElementById('checkoutModal');
const checkoutModal = new bootstrap.Modal(checkoutModalElement);
const orderBadge = document.getElementById('orderBadge');

let leafletMapCheckout; // Variabel untuk menyimpan instance peta Leaflet di checkout
let userMarkerCheckout; // Variabel untuk menyimpan marker lokasi pengguna di checkout
let distanceLine; // Variabel untuk menyimpan garis jarak
const tokoLat = -6.26222430306444; // Koordinat toko Anda (ganti dengan koordinat toko Anda)
const tokoLng = 106.52494354240288; // Koordinat toko Anda (ganti dengan koordinat toko Anda)
const hargaPerKm = 5000; // Harga per KM (sesuai contoh HTML Anda)

document.addEventListener('DOMContentLoaded', function () {
    // Event listener untuk tombol "Add to Cart"
    document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
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
                updateCartBadge();
                updateCartSidebar(productId, name, price, imgSrc);
            }
        });
    });

    // Event listener untuk tombol "Open Cart"
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

    // Event listener untuk form login
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (email && password) {
            isLoggedIn = true;
            loginModal.hide();
            alert('Login sukses!');
            document.getElementById('userName').innerText = "Nama User (Contoh)";
        } else {
            alert('Silakan masukkan email dan password.');
        }
    });

    // Event listener untuk menampilkan modal register
    document.getElementById('showRegister').addEventListener('click', function (e) {
        e.preventDefault();
        loginModal.hide();
        registerModal.show();
    });

    // Event listener untuk form register
    document.getElementById('registerForm').addEventListener('submit', function (e) {
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

    // Event listener untuk menampilkan modal checkout dan mengisi alamat otomatis dengan peta
    checkoutModalElement.addEventListener('show.bs.modal', async function () {
        if (!isLoggedIn) {
            checkoutModal.hide();
            loginModal.show();
            return;
        }
        if (Object.keys(cartItems).length === 0) {
            checkoutModal.hide();
            alert("Keranjang kosong.");
            return;
        }

        showOrderDetails();
        await initCheckoutMap(); // Inisialisasi peta dan dapatkan lokasi
        document.getElementById('orderAddress').readOnly = false;
        document.getElementById('orderAddress').placeholder = "Nyalakan GPS supaya lokasi aktif";
        document.getElementById('distance').value = "Menghitung..."; // Inisialisasi nilai jarak
        document.getElementById('shippingCost').value = "Menghitung..."; // Inisialisasi nilai ongkir
        document.getElementById('totalWithShipping').innerText = "Menghitung...";
    });

    // Event listener untuk form order (di dalam modal checkout)
    document.getElementById('orderForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const address = document.getElementById('orderAddress').value;
        const payment = document.getElementById('paymentMethod').value;
        const userLocationLat = document.getElementById('userLocationLat').value;
        const userLocationLng = document.getElementById('userLocationLng').value;
        const shippingCost = document.getElementById('shippingCost').value.replace('Rp', '').replace('.', '');

        if (!payment || !userLocationLat || !userLocationLng) {
            alert("Mohon aktifkan lokasi Anda dan pilih metode pembayaran.");
            return;
        }

        const totalBelanja = Object.values(cartItems).reduce((acc, item) => acc + item.price * item.qty, 0);
        const total = totalBelanja + parseInt(shippingCost);

        const orderData = {
            items: JSON.parse(JSON.stringify(cartItems)),
            total: total,
            address: address,
            location: `${userLocationLat},${userLocationLng}`,
            payment: payment,
            shipping: parseInt(shippingCost),
            date: new Date().toLocaleString()
        };

        localStorage.setItem('lastOrder', JSON.stringify(orderData));

        checkoutModal.hide();
        cartOffcanvas.hide();
        alert("Pesanan berhasil dibuat!");

        cartCount = 0;
        updateCartBadge();
        document.getElementById('cartSidebarBody').innerHTML = "";
        for (let id in cartItems) delete cartItems[id];
        updateTotal();

        document.getElementById('orderAddress').value = "";
        document.getElementById('paymentMethod').value = "";
        document.getElementById('userLocationLat').value = "";
        document.getElementById('userLocationLng').value = "";
        document.getElementById('distance').value = "Menghitung...";
        document.getElementById('shippingCost').value = "Rp0";
        document.getElementById('totalWithShipping').innerText = "Rp0";

        orderBadge.classList.remove('d-none');
    });

    // Event listener untuk menampilkan modal status pesanan
    document.getElementById('orderIcon').addEventListener('click', function (e) {
        e.preventDefault();
        const orderData = JSON.parse(localStorage.getItem('lastOrder'));
        if (!orderData) {
            alert("Belum ada pesanan.");
            return;
        }

        const orderDetails = document.getElementById('orderDetails');
        orderDetails.innerHTML = '';

        for (let id in orderData.items) {
            const item = orderData.items[id];
            const div = document.createElement('div');
            div.className = 'mb-2';
            div.innerHTML = `<div class="d-flex justify-content-between">
                <span>${item.name} x${item.qty}</span>
                <strong>Rp${(item.qty * item.price).toLocaleString()}</strong>
            </div>`;
            orderDetails.appendChild(div);
        }

        document.getElementById('checkoutTotal').innerText = "Rp" + orderData.total.toLocaleString();
        document.getElementById('shippingCost').innerText = "Rp" + orderData.shipping.toLocaleString();
        document.getElementById('totalWithShipping').innerText = "Rp" + orderData.total.toLocaleString();
        new bootstrap.Modal(document.getElementById('orderStatusModal')).show();
    });
});

function animateToCart(imgElement) {
    const cartIcon = document.querySelector('.open-cart i');
    const imgClone = imgElement.cloneNode(true);
    const imgRect = imgElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    imgClone.style.position = 'fixed';
    imgClone.style.left = imgRect.left + 'px';
    imgClone.style.top = imgRect.top + 'px';
    imgClone.style.width = imgRect.width + 'px';
    imgClone.style.height = imgClone.height + 'px';
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

function updateQty(productId, change) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    const currentQty = parseInt(qtyElement.innerText);
    const newQty = currentQty + change;

    if (newQty < 1) {
        document.getElementById(`sidebar-item-${productId}`).remove();
        cartCount -= currentQty;
        delete cartItems[productId];
    } else {
        qtyElement.innerText = newQty;
        cartItems[productId].qty = newQty;
        cartCount += change;
    }

    updateCartBadge();
    updateTotal();
}

function updateTotal() {
    const totalElement = document.getElementById('cartTotal');
    let total = 0;
    for (let id in cartItems) {
        total += cartItems[id].price * cartItems[id].qty;
    }
    totalElement.innerText = "Rp" + total.toLocaleString();
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (cartCount <= 0) {
        badge.classList.add('d-none');
    } else {
        badge.classList.remove('d-none');
        badge.innerText = cartCount;
        badge.classList.add('bounce-badge');
        setTimeout(() => badge.classList.remove('bounce-badge'), 600);
    }
}

function showOrderDetails() {
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = '';
    for (let id in cartItems) {
        const item = cartItems[id];
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.innerHTML = `<div class="d-flex justify-content-between">
            <span>${item.name} x${item.qty}</span>
            <strong>Rp${(item.qty * item.price).toLocaleString()}</strong>
        </div>`;
        orderDetails.appendChild(div);
    }
    const total = Object.values(cartItems).reduce((acc, item) => acc + item.price * item.qty, 0);
    document.getElementById('checkoutTotal').innerText = "Rp" + total.toLocaleString();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Jarak dalam km
    return distance;
}

function toRad(degree) {
    return degree * Math.PI / 180;
}

async function initCheckoutMap() {
    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung di browser ini.");
        return;
    }

    const mapContainerId = 'map-container-checkout';

    // Pastikan elemen peta ada
    if (!document.getElementById(mapContainerId)) {
        const mapContainer = document.createElement('div');
        mapContainer.id = mapContainerId;
        mapContainer.style.height = '200px';
        mapContainer.style.width = '100%';
        document.getElementById('checkoutModal').querySelector('.modal-body').insertBefore(mapContainer, document.getElementById('orderAddress').parentNode);
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;

        document.getElementById('userLocationLat').value = latitude;
        document.getElementById('userLocationLng').value = longitude;

        const distance = calculateDistance(latitude, longitude, tokoLat, tokoLng);
        const ongkir = Math.ceil(distance * hargaPerKm);

        document.getElementById('distance').value = distance.toFixed(2);
        document.getElementById('shippingCost').value = ongkir.toLocaleString();
        const totalBelanja = Object.values(cartItems).reduce((acc, item) => acc + item.price * item.qty, 0);
        document.getElementById('totalWithShipping').innerText = `Rp${(totalBelanja + ongkir).toLocaleString()}`;

        // Inisialisasi peta jika belum ada
        if (!leafletMapCheckout) {
            leafletMapCheckout = L.map(mapContainerId).setView([latitude, longitude], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(leafletMapCheckout);

            const tokoMarker = L.marker([tokoLat, tokoLng]).addTo(leafletMapCheckout).bindPopup("📍 Toko Kami").openPopup();
            userMarkerCheckout = L.marker([latitude, longitude]).addTo(leafletMapCheckout).bindPopup("📍 Lokasi Anda").openPopup();

            // Tambahkan garis yang menunjukkan jarak
            distanceLine = L.polyline([[latitude, longitude], [tokoLat, tokoLng]], {color: 'red'}).addTo(leafletMapCheckout);

            // Perbarui tampilan peta agar mencakup kedua marker
            leafletMapCheckout.fitBounds([
                [latitude, longitude],
                [tokoLat, tokoLng]
            ]);
        } else {
            leafletMapCheckout.setView([latitude, longitude], 15);
            userMarkerCheckout.setLatLng([latitude, longitude]).bindPopup("📍 Lokasi Anda").openPopup();

            // Perbarui garis jarak
            distanceLine.setLatLngs([[latitude, longitude], [tokoLat, tokoLng]]);

             // Perbarui tampilan peta agar mencakup kedua marker
            leafletMapCheckout.fitBounds([
                [latitude, longitude],
                [tokoLat, tokoLng]
            ]);
        }

    } catch (error) {
        let errorMessage = "Gagal mendapatkan lokasi.";
        if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Izin lokasi ditolak. Mohon aktifkan izin lokasi di browser Anda.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Informasi lokasi tidak tersedia. Pastikan GPS Anda aktif dan coba lagi.";
        } else if (error.code === error.TIMEOUT) {
            errorMessage = "Waktu tunggu untuk mendapatkan lokasi habis. Coba lagi.";
        } else {
            errorMessage = "Terjadi kesalahan yang tidak diketahui saat mendapatkan lokasi.";
        }
        alert(errorMessage);
        document.getElementById('orderAddress').readOnly = true;
        document.getElementById('orderAddress').placeholder = errorMessage;
        document.getElementById('distance').value = "Tidak Tersedia";
        document.getElementById('shippingCost').value = "Tidak Tersedia";
        document.getElementById('totalWithShipping').innerText = "Tidak Tersedia";

        // Inisialisasi peta dengan lokasi default jika gagal mendapatkan lokasi pengguna
        if (!leafletMapCheckout) {
            leafletMapCheckout = L.map(mapContainerId).setView([tokoLat, tokoLng], 13); // Fokus ke lokasi toko
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(leafletMapCheckout);
            L.marker([tokoLat, tokoLng]).addTo(leafletMapCheckout).bindPopup("📍 Toko Kami").openPopup();
        }
    }
}