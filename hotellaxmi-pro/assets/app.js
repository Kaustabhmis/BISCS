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
        { id: 'standard', name: 'Standard Room', price: 1500, maxGuests: 2, bed: 'Double bed',
          images: ['images/standard-1.jpg', 'images/standard-2.jpg', 'images/standard-6.jpg', 'images/standard-3.jpg', 'images/standard-4.jpg', 'images/standard-5.jpg'],
          blurb: 'A bright, spotless room with a comfortable double bed, ideal for solo travellers and couples.',
          features: ['Air conditioning', 'Free Wi-Fi', 'LED TV', 'Intercom phone', 'Mirror wardrobe', 'Bathroom with geyser'] },
        { id: 'deluxe', name: 'Deluxe Room', price: 2000, maxGuests: 3, bed: 'Double bed',
          images: ['images/deluxe-1.jpg', 'images/deluxe-balcony.jpg'],
          blurb: 'A spacious, bright room with a sofa seating area and a private balcony overlooking Chinar Park.',
          features: ['Private balcony', 'Sofa seating', 'Air conditioning', 'Free Wi-Fi', 'Wardrobe'] },
        { id: 'family', name: 'Family Suite', price: 2800, maxGuests: 4, bed: 'Double bed + sofa-cum-bed',
          images: ['images/suite-4.jpg', 'images/suite-1.jpg', 'images/suite-5.jpg', 'images/suite-2.jpg', 'images/suite-6.jpg', 'images/suite-3.jpg', 'images/suite-7.jpg'],
          blurb: 'A private bedroom plus a separate sitting room with a sofa-cum-bed. Room for the whole family.',
          features: ['Separate sitting room', 'Sofa-cum-bed', 'Air conditioning', 'LED TV', 'Marble flooring'] }
    ]
};

/* Gallery page. Room photos are added automatically from HOTEL.rooms above.
   Add other photos (lobby, building, views, restaurant...) here. */
const EXTRA_PHOTOS = [
    { src: 'images/reception-1.jpg', caption: 'Reception and lobby lounge', category: 'hotel' },
    { src: 'images/reception-2.jpg', caption: 'Front desk', category: 'hotel' },
    { src: 'images/lounge-1.jpg', caption: 'Guest lounge', category: 'hotel' },
    { src: 'images/lobby-1.jpg', caption: 'Lobby', category: 'hotel' },
    { src: 'images/corridor-1.jpg', caption: 'Corridor to the rooms', category: 'hotel' },
    { src: 'images/corridor-2.jpg', caption: 'Room corridor', category: 'hotel' },
    { src: 'images/bathroom-1.jpg', caption: 'Attached bathroom with geyser', category: 'facilities' },
    { src: 'images/lift-1.jpg', caption: 'Lift', category: 'facilities' },
    { src: 'images/lift-2.jpg', caption: 'Lift to all floors', category: 'facilities' },
];
const GALLERY_CATEGORIES = { hotel: 'Reception & Lobby', facilities: 'Bathroom & Lift' };

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
                ${r.images[0] ? `<img src="${esc(r.images[0])}" alt="${esc(r.name)} at Hotel Laxmi" loading="lazy" onerror="this.remove()">` : ''}
                <span class="price-tag">from <b>${rupees(r.price)}</b> / night</span>
                ${r.images.length ? `<a class="photo-count" href="gallery.html#${r.id}">${icon('camera')}${r.images.length} photo${r.images.length > 1 ? 's' : ''}</a>` : ''}
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
        const img = b.room.images[0] || '';
        if (summaryImg.dataset.src !== img) {
            summaryImg.dataset.src = img;
            summaryImg.innerHTML = img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : '';
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

/* ---------- Gallery page: filter tabs + lightbox ---------- */
const galleryEl = $('gallery-grid');
if (galleryEl) {
    const photos = [
        ...HOTEL.rooms.flatMap((r) => r.images.map((src, i) => ({
            src, category: r.id, caption: `${r.name}${i ? ' - photo ' + (i + 1) : ''}`
        }))),
        ...EXTRA_PHOTOS
    ];
    const labels = Object.fromEntries(HOTEL.rooms.map((r) => [r.id, r.name]));
    Object.assign(labels, GALLERY_CATEGORIES);
    const used = [...new Set(photos.map((p) => p.category))];

    $('gallery-tabs').innerHTML = [['all', 'All photos'], ...used.map((c) => [c, labels[c] || c])]
        .map(([c, l]) => `<button type="button" data-cat="${esc(c)}">${esc(l)}</button>`).join('');

    let visible = photos;
    const show = (cat) => {
        visible = cat === 'all' ? photos : photos.filter((p) => p.category === cat);
        document.querySelectorAll('#gallery-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.cat === cat));
        galleryEl.innerHTML = visible.length ? visible.map((p, i) => `
            <figure class="g-item">
                <button type="button" data-i="${i}" aria-label="Open photo: ${esc(p.caption)}">
                    <img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy">
                </button>
                <figcaption>${esc(p.caption)}</figcaption>
            </figure>`).join('') : '<p class="g-empty">More photos coming soon.</p>';
    };
    const fromHash = decodeURIComponent(location.hash.slice(1));
    show(used.includes(fromHash) ? fromHash : 'all');
    $('gallery-tabs').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) { show(b.dataset.cat); history.replaceState(null, '', b.dataset.cat === 'all' ? location.pathname : '#' + b.dataset.cat); }
    });

    // Lightbox
    const box = $('lightbox');
    let current = 0;
    const open = (i) => {
        current = (i + visible.length) % visible.length;
        const p = visible[current];
        $('lb-img').src = p.src;
        $('lb-img').alt = p.caption;
        $('lb-cap').textContent = `${p.caption}  (${current + 1} / ${visible.length})`;
        box.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };
    const close = () => { box.classList.add('hidden'); document.body.style.overflow = ''; };
    galleryEl.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (b) open(Number(b.dataset.i)); });
    $('lb-prev').addEventListener('click', () => open(current - 1));
    $('lb-next').addEventListener('click', () => open(current + 1));
    $('lb-close').addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => {
        if (box.classList.contains('hidden')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') open(current - 1);
        if (e.key === 'ArrowRight') open(current + 1);
    });
    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) open(current + (dx < 0 ? 1 : -1));
        touchX = null;
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
