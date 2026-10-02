/* =========================================================================
   Hotel Laxmi (pro) - settings and scripts shared by all pages.
   Edit HOTEL to change phone, rooms or prices everywhere.
   ========================================================================= */
const HOTEL = {
    name: 'Hotel Laxmi',
    phone: '+91 93396 91217',
    whatsapp: '919339691217',              // country code + number, digits only
    address: '12, Biswa Bangla Sarani, Chinar Park, Rajarhat, Kolkata, West Bengal',
    lat: 22.6233, lng: 88.4465,            // APPROXIMATE - check against the hotel's Google Maps pin
    rooms: [                               // PLACEHOLDER prices and room types - replace with actual tariff
        { id: 'standard', name: 'Standard Room', price: 1500, maxGuests: 2, bed: 'Double bed', image: 'images/room-standard.jpg',
          blurb: 'A cosy, spotless room for solo travellers and couples.',
          features: ['Air conditioning', 'Free Wi-Fi', 'LED TV', 'Attached bathroom'] },
        { id: 'deluxe', name: 'Deluxe Room', price: 2000, maxGuests: 3, bed: 'Queen bed', image: 'images/room-deluxe.jpg',
          blurb: 'More space to unwind, ideal for business stays.',
          features: ['Air conditioning', 'Free Wi-Fi', 'LED TV', 'Work desk', 'Hot water'] },
        { id: 'family', name: 'Family Room', price: 2800, maxGuests: 4, bed: '2 double beds', image: 'images/room-family.jpg',
          blurb: 'Room for the whole family, close to the airport.',
          features: ['Air conditioning', 'Free Wi-Fi', 'LED TV', 'Extra space', 'Hot water'] }
    ]
};

const DAY = 86400000;
const $ = (id) => document.getElementById(id);
const telLink = 'tel:' + HOTEL.phone.replace(/[^0-9+]/g, '');
const waLink = (text) => 'https://wa.me/' + HOTEL.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isoDate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const niceDate = (iso) => iso ? new Date(iso + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/* ---------- Shared: phone links, WhatsApp, menu, year ---------- */
document.querySelectorAll('[data-call]').forEach((a) => { a.href = telLink; });
document.querySelectorAll('[data-phone]').forEach((el) => { el.textContent = HOTEL.phone; });
document.querySelectorAll('[data-whatsapp]').forEach((a) => {
    a.href = waLink(`Hi, I would like to book a room at ${HOTEL.name}, Chinar Park.`);
    a.target = '_blank';
    a.rel = 'noopener';
});
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

const menuBtn = document.querySelector('.menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        const open = document.querySelector('.nav').classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open);
    });
}

/* Set sensible default dates on any check-in / check-out pair */
function setupDates(checkin, checkout) {
    const today = isoDate(new Date());
    checkin.min = today;
    if (!checkin.value || checkin.value < today) checkin.value = today;
    const syncOut = () => {
        const next = isoDate(new Date(new Date(checkin.value + 'T00:00').getTime() + DAY));
        checkout.min = next;
        if (!checkout.value || checkout.value < next) checkout.value = next;
    };
    syncOut();
    checkin.addEventListener('change', syncOut);
}

/* ---------- Home: quick booking bar ---------- */
const quick = $('quick-form');
if (quick) setupDates(quick.elements.checkin, quick.elements.checkout);

/* ---------- Room cards ---------- */
const roomList = $('room-list');
if (roomList) {
    roomList.innerHTML = HOTEL.rooms.map((r) => `
        <article class="room">
            <div class="ph">
                <img src="${esc(r.image)}" alt="${esc(r.name)}" loading="lazy" onerror="this.remove()">
                <span class="price-tag">from <b>${rupees(r.price)}</b> / night</span>
            </div>
            <div class="room-body">
                <h3>${esc(r.name)}</h3>
                <div class="room-meta">
                    <span>${icon('users')}Up to ${r.maxGuests} guests</span>
                    <span>${icon('bed')}${esc(r.bed)}</span>
                </div>
                <p>${esc(r.blurb)}</p>
                <ul class="room-features">${r.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
                <div class="room-actions">
                    <a class="btn btn-primary" href="booking.html?room=${r.id}">Book this room</a>
                    <a class="btn btn-call btn-icon" href="${telLink}" aria-label="Call to book ${esc(r.name)}">${icon('phone')}</a>
                </div>
            </div>
        </article>`).join('');
}

/* ---------- Booking page ---------- */
const form = $('booking-form');
if (form) {
    const f = form.elements;
    const params = new URLSearchParams(location.search);

    $('room-picker').innerHTML = HOTEL.rooms.map((r, i) => `
        <label>
            <input type="radio" name="room" value="${r.id}" ${i === 0 ? 'checked' : ''}>
            <div class="opt"><strong>${esc(r.name)}</strong><span>${rupees(r.price)} / night</span></div>
        </label>`).join('');

    // Prefill from the home page quick-booking bar or a room card
    if (HOTEL.rooms.some((r) => r.id === params.get('room'))) f.room.value = params.get('room');
    if (params.get('checkin')) f.checkin.value = params.get('checkin');
    if (params.get('checkout')) f.checkout.value = params.get('checkout');
    if (params.get('guests')) f.guests.value = params.get('guests');
    setupDates(f.checkin, f.checkout);

    const read = () => {
        const room = HOTEL.rooms.find((r) => r.id === f.room.value) || HOTEL.rooms[0];
        const nights = Math.round((new Date(f.checkout.value + 'T00:00') - new Date(f.checkin.value + 'T00:00')) / DAY);
        const roomsCount = Number(f.rooms.value);
        const guests = Number(f.guests.value);
        return { room, nights, roomsCount, guests, total: nights > 0 ? room.price * nights * roomsCount : 0 };
    };

    const validate = (b) => {
        if (!f.name.value.trim()) return 'Please enter your full name.';
        if (f.phone.value.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit mobile number.';
        if (!f.checkin.value || !f.checkout.value) return 'Please choose your check-in and check-out dates.';
        if (f.checkin.value < isoDate(new Date())) return 'Check-in date cannot be in the past.';
        if (b.nights < 1) return 'Check-out must be after check-in.';
        if (b.guests > b.room.maxGuests * b.roomsCount) {
            return `${b.room.name} fits up to ${b.room.maxGuests} guests per room. Add another room or choose a larger room.`;
        }
        return '';
    };

    const summaryImg = $('sum-img');
    const updateSummary = () => {
        const b = read();
        if (summaryImg.dataset.src !== b.room.image) {
            summaryImg.dataset.src = b.room.image;
            summaryImg.innerHTML = `<img src="${esc(b.room.image)}" alt="" onerror="this.remove()">`;
        }
        $('sum-room').textContent = b.room.name;
        $('sum-in').textContent = niceDate(f.checkin.value);
        $('sum-out').textContent = niceDate(f.checkout.value);
        $('sum-nights').textContent = b.nights > 0 ? `${b.nights} night${b.nights > 1 ? 's' : ''}` : '—';
        $('sum-rooms').textContent = `${b.roomsCount} × ${rupees(b.room.price)}`;
        $('sum-guests').textContent = b.guests;
        $('sum-total').textContent = rupees(b.total);
    };
    form.addEventListener('input', updateSummary);
    form.addEventListener('change', updateSummary);
    updateSummary();

    const setStep = (n) => document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('on', i < n));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const b = read();
        const problem = validate(b);
        $('booking-error').textContent = problem;
        $('booking-error').classList.toggle('hidden', !problem);
        if (problem) return;

        const ref = 'LX' + f.checkin.value.slice(2).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        const rows = [
            ['Name', f.name.value.trim()],
            ['Mobile', f.phone.value.trim()],
            ['Room', `${b.room.name} × ${b.roomsCount}`],
            ['Guests', b.guests],
            ['Check-in', niceDate(f.checkin.value)],
            ['Check-out', niceDate(f.checkout.value)],
            ['Nights', b.nights],
            ['Estimated tariff', rupees(b.total) + ' + taxes']
        ];
        if (f.notes.value.trim()) rows.push(['Special request', f.notes.value.trim()]);

        const message = `Room booking request - ${HOTEL.name}, Chinar Park\nBooking Ref: ${ref}\n` +
            rows.map(([k, v]) => `${k}: ${v}`).join('\n');

        $('confirm-ref').textContent = ref;
        $('confirm-table').innerHTML = rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
        $('confirm-wa').href = waLink(message);
        form.classList.add('hidden');
        $('booking-confirm').classList.remove('hidden');
        setStep(2);
        $('booking-confirm').scrollIntoView({ block: 'start' });
    });

    $('confirm-edit').addEventListener('click', () => {
        $('booking-confirm').classList.add('hidden');
        form.classList.remove('hidden');
        setStep(1);
    });
}

/* ---------- Contact page map: Leaflet + free OpenStreetMap tiles, no API key ---------- */
const mapEl = $('map');
if (mapEl) {
    const dir = $('directions');
    if (dir) dir.href = `https://www.google.com/maps/dir/?api=1&destination=${HOTEL.lat},${HOTEL.lng}`;
    if (window.L) {
        const map = L.map('map', { scrollWheelZoom: false }).setView([HOTEL.lat, HOTEL.lng], 16);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        L.marker([HOTEL.lat, HOTEL.lng]).addTo(map)
            .bindPopup(`<b>${esc(HOTEL.name)}</b><br>${esc(HOTEL.address)}`).openPopup();
    } else {
        mapEl.innerHTML = '<p style="padding:24px">The map could not load. Tap "Get Directions" to open Google Maps.</p>';
    }
}
