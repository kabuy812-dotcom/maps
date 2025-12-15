const map = L.map('map').setView([47.9187, 106.9177], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  draw: {
    polygon: true,
    rectangle: true,
    marker: true
  },
  edit: {
    featureGroup: drawnItems
  }
});
map.addControl(drawControl);

function createEditablePopup(marker) {
  const container = document.createElement('div');

  const textarea = document.createElement('textarea');
  textarea.rows = 4;
  textarea.cols = 20;

  // Хуучин текст байвал оруулах
  if (marker.getPopup()) {
    textarea.value = marker.getPopup().getContent();
  } else {
    textarea.value = 'Энд note бичнэ үү...';
  }

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Хадгалах';

  saveBtn.onclick = function () {
    marker.setPopupContent(textarea.value);
    marker.closePopup();
  };

  container.appendChild(textarea);
  container.appendChild(document.createElement('br'));
  container.appendChild(saveBtn);

  return container;
}

map.on(L.Draw.Event.CREATED, function (e) {
  const layer = e.layer;

  if (e.layerType === 'marker') {
    layer.bindPopup(createEditablePopup(layer)).openPopup();
  }

  drawnItems.addLayer(layer);
});

// Pin дээр дарахад note засах popup гаргах
map.on('click', function (e) {
  drawnItems.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      // Click хийх координат pin-ын координаттай ойрхон байвал засах popup гаргах
      const distance = map.distance(e.latlng, layer.getLatLng());
      if (distance < 20) { // 20 метрээс бага зайд байвал
        layer.bindPopup(createEditablePopup(layer)).openPopup();
      }
    }
  });
});

document.getElementById('searchBtn').onclick = function() {
  const query = document.getElementById('search').value;
  if (!query) return alert('Хайлтын үгээ оруулна уу!');

  // Nominatim API-д хүсэлт явуулах
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        const place = data[0];
        const lat = place.lat;
        const lon = place.lon;

        // Газрын зургийг тухайн координат руу төвлөрүүлэх
        map.setView([lat, lon], 15);

        // Хэрвээ өмнө marker нэмээгүй бол нэмэх эсвэл байршуулалт өөрчлөх
        if (window.searchMarker) {
          window.searchMarker.setLatLng([lat, lon]);
        } else {
          window.searchMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup(place.display_name)
            .openPopup();
        }
      } else {
        alert('Хайлт олдсонгүй');
      }
    })
    .catch(err => {
      alert('Алдаа гарлаа: ' + err);
    });
};
