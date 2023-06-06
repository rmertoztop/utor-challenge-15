// store the API endpoints for eathquakes and tectonic plates
let earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let tectonicUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// create the tile layers
let satellite = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 20,
	attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
});

let grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

let outdoors = L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});

// create the function to determine the circle size based on magnitude
function circleSize(magnitude) {
    return magnitude * 6;
};

// create the function to determine the circle color based on depth
function circleColor(depth) {
    if (depth > 90) {
        return "#ff5f65"
    }

    else if (depth > 70) {
        return "#fca35d"
    }

    else if (depth > 50) {
        return "#fdb72a"
    }

    else if (depth > 30) {
        return "#f7db11"
    }

    else if (depth > 10) {
        return "#dcf400"
    }
    else {
        return "#a3f600"
    }
};

// perform an API call to the USGS earthquake API to get the information
d3.json(earthquakeUrl).then(function (earthquakeData) {
    // define a function we want to run once for each feature in the features array
    // give each feature a popup describing the place and time of the earthquake
    function onEachFeature(feature, layer) {
        layer.bindPopup(`<h3>Location: ${feature.properties.place}
        </h3><hr><p>Date: ${new Date(feature.properties.time)}
        </p><p>Magnitude: ${feature.properties.mag}
        </p><p>Depth: ${feature.geometry.coordinates[2]} km
        </p><p>Last Updated: ${new Date(feature.properties.updated)}
        </p>`);
    }
    // create a GeoJSON layer containing the features array on the earthquakeData object
    // run the onEachFeature function once for each piece of data in the array
    var earthquakes = L.geoJSON(earthquakeData, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: circleSize(feature.properties.mag),
                fillColor: circleColor(feature.geometry.coordinates[2]),
                fillOpacity: 0.75,
                color: "black",
                weight: 0.5
            });
        },
        onEachFeature: onEachFeature
    });

    // when the data is returned, perform another API call to get the tectonic plates information
    d3.json(tectonicUrl).then(function (tectonicinfo) {
        var tectonicPlates = L.geoJSON(tectonicinfo, {
            color: "orange",
            weight: 2
        });
        let myMap = L.map("map", {
            center: [37.09, -95.71],
            zoom: 5,
            layers: [satellite, earthquakes, tectonicPlates]
        });
        // create the baseMaps object
        let baseMaps = {
            "Satellite": satellite,
            "Grayscale": grayscale,
            "Outdoors": outdoors
        };
        // create the overlayMaps object
        let overlayMaps = {
            "Earthquakes": earthquakes,
            "Tectonic Plates": tectonicPlates
        };
        // add the earthquakes layer to the map
        earthquakes.addTo(myMap);
        // create the layer control
        L.control.layers(baseMaps, overlayMaps, {
            collapsed: false
        }).addTo(myMap);
        // create the legend
        let legend = L.control({ position: "bottomright" });
        legend.onAdd = function () {
            let div = L.DomUtil.create("div", "legend");
            let limits = ["-10-10", "10-30", "30-50", "50-70", "70-90", "90+"];
            let colors = ["color1", "color2", "color3", "color4", "color5", "color6"];
            let labels = [];
            // create variable for legend title
            let legendInfo = "<p><b>Earthquake Depth</p>";
            // loop through the limits and generate a label with a colored square for each
            for (let i = 0; i < limits.length; i++) {
                labels.push("<p><p class='square " + colors[i] +"'></p>&nbsp"+  limits[i] + "&nbspkm</p>");
            }   
            div.innerHTML = legendInfo;
            div.innerHTML += "<p class='legtext'>" + labels.join("") + "</p>";
            // return the legend div containing the generated labels
            return div;
        };
        legend.addTo(myMap);
        // add the tectonic plates data
        tectonicPlates.addTo(myMap);
});
}
);