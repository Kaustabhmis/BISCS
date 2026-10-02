/* =========================================================================
   Hotel Laxmi - shared settings and scripts.
   Edit HOTEL below to change phone, rooms or prices on every page.
   ========================================================================= */
const HOTEL = {
    name: 'Hotel Laxmi',
    phone: '+91 93396 91217',
    whatsapp: '919339691217',              // country code + number, digits only
    email: '',                             // add an email address if you want one shown
    address: '12, Biswa Bangla Sarani, Chinar Park, Rajarhat, Kolkata, West Bengal',
    lat: 22.6233, lng: 88.4465,            // APPROXIMATE - check against the hotel's Google Maps pin
    checkIn: '12:00 PM',                   // PLACEHOLDER - confirm with the hotel
    checkOut: '11:00 AM',                  // PLACEHOLDER - confirm with the hotel
    rooms: [                               // PLACEHOLDER prices - replace with actual tariff
        { id: 'standard', name: 'Standard AC Room', price: 1500, maxGuests: 2, image: 'images/room-standard.jpg',
          features: ['Air Conditioning', 'Double Bed', 'LED TV', 'Wi-Fi', 'Attached Bathroom'] },
        { id: 'deluxe', name: 'Deluxe AC Room', price: 2000, maxGuests: 3, image: 'images/room-deluxe.jpg',
          features: ['Air Conditioning', 'Queen Bed', 'LED TV', 'Wi-Fi', 'Geyser', 'Work Desk'] },
        { id: 'family', name: 'Family Room', price: 2800, maxGuests: 4, image: 'images/room-family.jpg',
          features: ['Air Conditioning', '2 Double Beds', 'LED TV', 'Wi-Fi', 'Geyser'] }
    ]
};

const telLink = 'tel:' + HOTEL.phone.replace(/[^0-9+]/g, '');
const waLink = (text) => 'https://wa.me/' + HOTEL.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isoDate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const DAY = 86400000;

/* ---------- Shared: phone links, menu, year ---------- */
document.querySelectorAll('[data-call]').forEach((a) => { a.href = telLink; });
document.querySelectorAll('[data-phone]').forEach((el) => { el.textContent = HOTEL.phone; });
document.querySelectorAll('[data-whatsapp]').forEach((a) => {
    a.href = waLink('Hi, I would like to book a room at ' + HOTEL.name + '.');
    a.target = '_blank';
    a.rel = 'noopener';
});
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

const menuBtn = document.querySelector('.menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        const nav = document.querySelector('.nav');
        nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
}

/* ---------- Room cards (any page with #room-list) ---------- */
const roomList = document.getElementById('room-list');
if (roomList) {
    roomList.innerHTML = HOTEL.rooms.map((r) => `
        <div class="card">
            <div class="photo"><img src="${esc(r.image)}" alt="${esc(r.name)}" loading="lazy" onerror="this.remove()"></div>
            <div class="card-body">
                <h3>${esc(r.name)}</h3>
                <ul class="tags">${r.features.map((f) => `<li>${esc(f)}</li>`).join('')}<li>Up to ${r.maxGuests} guests</li></ul>
                <div class="room-foot">
                    <div class="room-price">${rupees(r.price)} <small>/ night</small></div>
                    <a class="btn btn-blue" href="rooms.html?room=${r.id}#book">Book</a>
                </div>
            </div>
        </div>`).join('');
}

/* ---------- Booking system (rooms.html) ---------- */
const form = document.getElementById('booking-form');
if (form) {
    const roomSelect = form.elements.room;
    roomSelect.innerHTML = HOTEL.rooms.map((r) =>
        `<option value="${r.id}">${esc(r.name)} - ${rupees(r.price)}/night</option>`).join('');

    const wanted = new URLSearchParams(location.search).get('room');
    if (HOTEL.rooms.some((r) => r.id === wanted)) roomSelect.value = wanted;

    const today = new Date();
    form.elements.checkin.min = isoDate(today);
    form.elements.checkin.value = isoDate(today);
    form.elements.checkout.min = isoDate(new Date(today.getTime() + DAY));
    form.elements.checkout.value = isoDate(new Date(today.getTime() + DAY));

    const summary = document.getElementById('booking-summary');
    const errorBox = document.getElementById('booking-error');

    const read = () => {
        const f = form.elements;
        const room = HOTEL.rooms.find((r) => r.id === f.room.value);
        const nights = Math.round((new Date(f.checkout.value) - new Date(f.checkin.value)) / DAY);
        const roomsCount = Number(f.rooms.value);
        const guests = Number(f.guests.value);
        return { room, nights, roomsCount, guests, total: room && nights > 0 ? room.price * nights * roomsCount : 0 };
    };

    const validate = (b) => {
        if (!form.elements.name.value.trim()) return 'Please enter your name.';
        if (form.elements.phone.value.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit mobile number.';
        if (!form.elements.checkin.value || !form.elements.checkout.value) return 'Please choose check-in and check-out dates.';
        if (form.elements.checkin.value < isoDate(new Date())) return 'Check-in date cannot be in the past.';
        if (b.nights < 1) return 'Check-out date must be after the check-in date.';
        if (b.guests > b.room.maxGuests * b.roomsCount) {
            return `${b.room.name} allows up to ${b.room.maxGuests} guests per room. Please add another room or choose a bigger room.`;
        }
        return '';
    };

    const updateSummary = () => {
        const b = read();
        if (b.nights > 0) {
            summary.innerHTML = `<strong>${b.nights} night${b.nights > 1 ? 's' : ''}</strong> × ${b.roomsCount} room${b.roomsCount > 1 ? 's' : ''} × ${rupees(b.room.price)}
                = <strong>${rupees(b.total)}</strong> <small>(estimate, taxes extra)</small>`;
        } else {
            summary.textContent = 'Choose your dates to see the estimated tariff.';
        }
    };

    form.elements.checkin.addEventListener('change', () => {
        const next = new Date(new Date(form.elements.checkin.value).getTime() + DAY);
        form.elements.checkout.min = isoDate(next);
        if (form.elements.checkout.value <= form.elements.checkin.value) form.elements.checkout.value = isoDate(next);
    });
    form.addEventListener('input', updateSummary);
    form.addEventListener('change', updateSummary);
    updateSummary();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const b = read();
        const problem = validate(b);
        errorBox.textContent = problem;
        errorBox.classList.toggle('hidden', !problem);
        if (problem) return;

        const f = form.elements;
        const ref = 'LX' + f.checkin.value.slice(2).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        const rows = [
            ['Booking Ref', ref],
            ['Name', f.name.value.trim()],
            ['Mobile', f.phone.value.trim()],
            ['Room', `${b.room.name} × ${b.roomsCount}`],
            ['Guests', b.guests],
            ['Check-in', f.checkin.value],
            ['Check-out', `${f.checkout.value} (${b.nights} night${b.nights > 1 ? 's' : ''})`],
            ['Estimated Tariff', rupees(b.total) + ' + taxes']
        ];
        if (f.notes.value.trim()) rows.push(['Request', f.notes.value.trim()]);

        const message = `Room booking request - ${HOTEL.name}\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n');

        document.getElementById('confirm-ref').textContent = ref;
        document.getElementById('confirm-table').innerHTML =
            rows.slice(1).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
        document.getElementById('confirm-wa').href = waLink(message);
        form.classList.add('hidden');
        document.getElementById('booking-confirm').classList.remove('hidden');
        document.getElementById('booking-confirm').scrollIntoView({ block: 'center' });
    });

    document.getElementById('confirm-edit').addEventListener('click', () => {
        document.getElementById('booking-confirm').classList.add('hidden');
        form.classList.remove('hidden');
    });
}

/* ---------- Map (contact.html) - Leaflet + free OpenStreetMap tiles, no API key ---------- */
const mapEl = document.getElementById('map');
if (mapEl) {
    const directions = document.getElementById('directions');
    if (directions) directions.href = `https://www.google.com/maps/dir/?api=1&destination=${HOTEL.lat},${HOTEL.lng}`;
    if (window.L) {
        const map = L.map('map', { scrollWheelZoom: false }).setView([HOTEL.lat, HOTEL.lng], 16);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker([HOTEL.lat, HOTEL.lng]).addTo(map)
            .bindPopup(`<b>${esc(HOTEL.name)}</b><br>${esc(HOTEL.address)}`).openPopup();
    } else {
        mapEl.innerHTML = '<p style="padding:16px">Map could not load. Use "Get Directions" below.</p>';
    }
}
