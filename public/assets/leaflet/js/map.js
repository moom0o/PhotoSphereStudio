// Creating map options
let mapOptions = {
    center: [17.385044, 78.486671],
    zoom: 10,
}

var defaultIcon = L.icon({
    iconUrl: '/assets/icons/marker-icon.png',
    shadowUrl: '/assets/icons/marker-shadow.png',
});
    
// Creating a map object
let map = new L.map('map', mapOptions);
    
// Creating a Layer object
let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Geolocation
L.control.locate().addTo(map);

// Adding layer to the map
map.addLayer(layer);

// Marker
let marker = null;
map.on('click', (event)=> {

    if(marker !== null){
        map.removeLayer(marker);
    }

    marker = L.marker([event.latlng.lat , event.latlng.lng], {icon: defaultIcon}).addTo(map);

    document.getElementById('lat').value = event.latlng.lat;
    document.getElementById('long').value = event.latlng.lng;
    
})