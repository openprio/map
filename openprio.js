import {load as protobuf_load} from "protobufjs";

import L from "leaflet";

var client  = new WebSocket('wss://api.openprio.nl/rt/positions')
var normal = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 21,
                accessToken: 'pk.eyJ1Ijoic3ZlbjRhbGwiLCJhIjoiY2swb3pmaGl5MGVzNTNsczM1Z2loMmxkayJ9.z6nzNgRWrcRqDHIwO2MbkA'
            });
var satellite = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 21,
    accessToken: 'pk.eyJ1Ijoic3ZlbjRhbGwiLCJhIjoiY2swb3pmaGl5MGVzNTNsczM1Z2loMmxkayJ9.z6nzNgRWrcRqDHIwO2MbkA'
});
var map = L.map('mapid', {layers: [normal]}).setView([52.054088, 4.31905470], 12);

var baseMaps = {
    "Normaal": normal,
    "Sateliet": satellite
};
L.control.layers(baseMaps).addTo(map);

var message = "";
protobuf_load("openprio_pt_position_data.proto", function(err, root) {
    if (err) {
        throw err;
    }
    // Obtain a message type
    message = root.lookupType("LocationMessage");

});


client.onmessage = async function(event) {
  console.log(event.data);
  var arrayBuffer = await event.data.arrayBuffer();
  var result = message.decode(new Uint8Array(arrayBuffer));
  console.log(result);
  plotPosition(result);
};

var arrivaIcon = L.icon({
    iconUrl: 'arriva.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

var uovIcon = L.icon({
    iconUrl: 'u-ov.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

var htmIcon = L.icon({
    iconUrl: 'htm.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

var unknown = L.icon({
    iconUrl: 'unknown.png',
    iconSize: [20, 25],
    iconAnchor: [10, 10]
});

var dataOwnerCodeToIcon = {
    "ARR": arrivaIcon,
    "QBUZZ": uovIcon,
    "HTM": htmIcon,
};

var bus_positions = {};
function plotPosition(msg) {
    var json_msg = msg.toJSON();
    var mstyle = {
        radius: 2,
        fillOpacity: 0.8,
        color: '#108a00'
    };
    var coordinates = [msg.position.latitude, msg.position.longitude];
    
    var vehicle_id = msg.vehicleDescriptor.dataOwnerCode + ':' + msg.vehicleDescriptor.vehicleNumber;
    if (vehicle_id in bus_positions) {
        L.circleMarker(bus_positions[vehicle_id]._latlng, mstyle).addTo(map)
        bus_positions[vehicle_id].setLatLng(L.latLng(coordinates))
        bus_positions[vehicle_id].options.rotationAngle = msg.position.bearing;

    } else {
        var markerIcon = dataOwnerCodeToIcon[msg.vehicleDescriptor.dataOwnerCode];
        if (markerIcon == null) {
            markerIcon = unknown;
        }

        bus_positions[vehicle_id] = L.marker(coordinates, {icon: markerIcon, rotationAngle: msg.position.bearing}).addTo(map);
    }
    var timestamp = new Date(msg.timestamp);
    var latency = new Date() - timestamp;
   var content = '<div>'
   + '<b>Voertuiginformatie:</b><br>'
   + 'Dataownercode: ' + msg.vehicleDescriptor.dataOwnerCode + '<br>'
   + 'Grootwagennummer: ' + msg.vehicleDescriptor.vehicleNumber + '<br>'
   + '<br>'
   + '<b>Positie informatie:</b><br>'
   + 'Snelheid: ' + Math.round(msg.position.speed * 3.6) + ' km/h <br>' 
   + 'Odometer: ' + Math.round(msg.position.odometer) + ' m <br>'   
   + 'Richting: ' + Math.round(msg.position.bearing) + ' deg <br>'
   + 'Stopknopstatus: ' + json_msg.stopButtonStatus + ' <br>'
   + 'Deurstatus: ' +  json_msg.doorStatus + ' <br>'
   + 'Halteknopstatus: ' + json_msg.passageStopStatus + ' <br>'
   + 'Satelieten zichtbaar: ' + msg.position.numberOfReceivedSatellites + ' <br>'
   + 'Hdop: ' + msg.position.hdop + ' <br>'
   + 'Richting (relevant voor 2-richting voertuigen): ' + json_msg.vehicleDescriptor.drivingDirection + ' <br>'
   + 'Aantal gekoppelde eenheden.: ' + msg.vehicleDescriptor.numberOfVehiclesCoupled  + ' <br>'
   + 'timestamp: ' +  timestamp.toISOString()  + ' <br>'
   + 'latency: ' + latency + 'ms <br>'
   + '</div>';
   bus_positions[vehicle_id].bindPopup(content);
}

(function() {
    // save these original methods before they are overwritten
    var proto_initIcon = L.Marker.prototype._initIcon;
    var proto_setPos = L.Marker.prototype._setPos;

    var oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

    L.Marker.addInitHook(function () {
        var iconOptions = this.options.icon && this.options.icon.options;
        var iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
        if (iconAnchor) {
            iconAnchor = (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px');
        }
        this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || 'center bottom' ;
        this.options.rotationAngle = this.options.rotationAngle || 0;

        // Ensure marker keeps rotated during dragging
        this.on('drag', function(e) { e.target._applyRotation(); });
    });

    L.Marker.include({
        _initIcon: function() {
            proto_initIcon.call(this);
        },

        _setPos: function (pos) {
            proto_setPos.call(this, pos);
            this._applyRotation();
        },

        _applyRotation: function () {
            if(this.options.rotationAngle) {
                this._icon.style[L.DomUtil.TRANSFORM+'Origin'] = this.options.rotationOrigin;

                if(oldIE) {
                    // for IE 9, use the 2D rotation
                    this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
                } else {
                    // for modern browsers, prefer the 3D accelerated version
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
                }
            }
        },

        setRotationAngle: function(angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },

        setRotationOrigin: function(origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
})();
