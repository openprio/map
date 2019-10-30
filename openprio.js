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

// socket.onmessage = async function (event) {
//     //console.log(event.data);
//     var buffer = await event.data.arrayBuffer();
//     var result = message.decode(new Uint8Array(buffer));
//     plotPositions(result)
//     //message.decode(event.data);
// }

// function plotPositions(position) {
//     position.entity.forEach(entity => {
//         if (plotOV) {
//             plotPosition(entity);
//         }
//     });
// }


myIcon = L.icon({
    iconUrl: 'arriva.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

L.marker([52.0, 5.0], {icon: myIcon, rotationAngle: 270}).addTo(map);

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
        console.log(bus_positions[vehicle_id]);
        console.log(bus_positions[vehicle_id]._latlng);
        L.circleMarker(bus_positions[vehicle_id]._latlng, mstyle).addTo(map)
        bus_positions[vehicle_id].setLatLng(L.latLng(coordinates));

    } else {
        bus_positions[vehicle_id] = L.marker(coordinates, {icon: myIcon, rotationAngle: msg.position.bearing}).addTo(map);
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
    // icon = L.icon({
    //     iconUrl: 'my-icon.png',
    //     iconSize: [38, 95],
    //     iconAnchor: [22, 94],
    //     popupAnchor: [-3, -76],
    //     shadowUrl: 'my-icon-shadow.png',
    //     shadowSize: [68, 95],
    //     shadowAnchor: [22, 94]
    // });
    // icon.addTo(map);
    //marker = L.circleMarker(coordinates, mstyle).addTo(map);
  
}

// function enableOV() {
//     plotOV = true;
// }

// function disableAndClearOV() {
//     plotOV = false;
//     Object.keys(bus_positions).forEach(function(key) {
//         map.removeLayer(bus_positions[key]);
//     });
// }
