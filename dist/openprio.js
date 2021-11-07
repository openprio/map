var client  = new WebSocket('wss://api.openprio.nl/rt/positions')

protobuf.load("openprio_pt_position_data.proto", function(err, root) {
    if (err) {
        throw err;
    }
    // Obtain a message type
    message = root.lookupType("LocationMessage");

});

client.onmessage = async function(event) {
  arrayBuffer = await event.data.arrayBuffer();
  var result = message.decode(new Uint8Array(arrayBuffer));
  console.log(result);
  plotPosition(result);
};

arrivaIcon = L.icon({
    iconUrl: 'arriva.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

uovIcon = L.icon({
    iconUrl: 'u-ov.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

unknown = L.icon({
    iconUrl: 'unknown.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

var dataOwnerCodeToIcon = {
    "ARR": arrivaIcon,
    "QBUZZ": uovIcon,
};

bus_positions = {};
function plotPosition(msg) {
    var mstyle = {
        radius: 2,
        fillOpacity: 0.8,
        color: '#108a00'
    };
    coordinates = [msg.position.latitude, msg.position.longitude];
    
    vehicle_id = msg.vehicleDescriptor.dataOwnerCode + ':' + msg.vehicleDescriptor.vehicleNumber;
    if (vehicle_id in bus_positions) {
        L.circleMarker(bus_positions[vehicle_id]._latlng, mstyle).addTo(map)
        bus_positions[vehicle_id].setLatLng(L.latLng(coordinates))
        bus_positions[vehicle_id].options.rotationAngle = msg.position.bearing;

    } else {
        markerIcon = dataOwnerCodeToIcon[msg.vehicleDescriptor.dataOwnerCode];
        if (markerIcon == null) {
            markerIcon = unknown;
        }

        bus_positions[vehicle_id] = L.marker(coordinates, {icon: markerIcon, rotationAngle: msg.position.bearing}).addTo(map);
    }
 
   content = '<div>'
   + '<b>Voertuiginformatie:</b><br>'
   + 'Dataownercode: ' + msg.vehicleDescriptor.dataOwnerCode + '<br>'
   + 'Grootwagennummer: ' + msg.vehicleDescriptor.vehicleNumber + '<br>'
   + '<br>'
   + '<b>Positie informatie:</b><br>'
   + 'Snelheid: ' + Math.round(msg.position.speed * 3.6) + ' km/h <br>'  
   + 'Richting: ' + Math.round(msg.position.bearing) + ' deg <br>'

   + '</div>';
   bus_positions[vehicle_id].bindPopup(content);
}
