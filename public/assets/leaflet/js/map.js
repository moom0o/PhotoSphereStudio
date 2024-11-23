// Creating map options
let mapOptions = {
    center: [41.875728, -87.626609],
    zoom: 4,
}

var defaultIcon = L.icon({
    iconUrl: '/assets/icons/marker-icon.png',
    shadowUrl: '/assets/icons/marker-shadow.png',
});

// Creating a map object
let map = new L.map('map', mapOptions);

// Creating a Layer object
let layer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Geolocation
L.control.locate().addTo(map);

// Adding layer to the map
map.addLayer(layer);

const getJSON = async url => {
    const response = await fetch(url);
    if(!response.ok) // check if response worked (no 404 errors etc...)
        throw new Error(response.statusText);

    const data = response.json(); // get JSON from the response
    return data; // returns a promise, which resolves to this data value
}

console.log("Fetching data...");
let camIcon = L.icon({
    iconUrl: '/assets/icons/camicon.png',

    iconSize:     [32, 32], // size of the icon
    iconAnchor:   [16, 28], // point of the icon which will correspond to marker's location
});
getJSON("/list").then(data => {
    data.forEach(b => {
        L.marker([b.lat, b.long], {icon: camIcon}).addTo(map).on('click', function(evt) {
            window.open(b.url, '_blank');
        });
    })
}).catch(error => {
    console.error(error);
});

// Marker
let marker = null;
map.on('click', (event) => {
    if(!document.getElementById('lat')){
        return
    }
    if (marker !== null) {
        map.removeLayer(marker);
    }

    marker = L.marker([event.latlng.lat, event.latlng.lng]).addTo(map);

    document.getElementById('lat').value = event.latlng.lat;
    document.getElementById('long').value = event.latlng.lng;

})
