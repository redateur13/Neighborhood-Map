// google map variables
let map;
let largeInfowindow;
let bounds;

// initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 25.0657, lng: 55.17128},
        zoom: 8,
        disableDefaultUI: true
    });
    // intialize the Info Window
    largeInfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    // start the ViewModel
    ko.applyBindings(new ViewModel());
}
// show Google map error
function mapError() {
    alert('unable to load Google Map');
}

// data Model
let Place = function(data) {
    let self = this;

    this.title = data.title;
    this.position = data.location;

    // style the Default Markers
    let defaultIcon = makeMarkerIcon('00BA22');

    // style the highlighted marker 
    let highlightedIcon = makeMarkerIcon('006ABA');

    // create a marker per place
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    // extend the bounds of the map 
    bounds.extend(this.marker.position);
    map.fitBounds(bounds);

    // display or hide the marker
    this.showMarker = function(show) {
        if (show) {
            this.marker.setMap(map);
            bounds.extend(this.marker.position);
            map.fitBounds(bounds);
        } else {
            this.marker.setMap(null);
        }
    };

    // animate the marker when a list place is clicked
    this.setPlace = function(clickedPlace) {
        populateInfoWindow(this.marker, largeInfowindow);
        map.panTo(this.marker.getPosition());
        animateMarker(this.marker);
    };

    // open the large infowindow and animate the marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);
        animateMarker(this);
        map.panTo(this.getPosition());
    });

    // Change the colors for mouseover and mouseout
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
}

// creates a new marker with passed color
function makeMarkerIcon(markerColor) {
    let markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
    return markerImage;
}

//bounce animate the marker
function animateMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null)
    }, 900);
}

// populates the infowindow when the marker is clicked
function populateInfoWindow(marker, infowindow) {
    // check infowindow is not opened on this marker
    if (infowindow.marker != marker) {
        // Clear the infowindow content
        infowindow.setContent('');
        infowindow.marker = marker;
        // marker is cleared if the infowindow is closed
        infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
        });

        //Foursquare Api
        const clientId = "K13SMRMG0VSQEWWK0DYVDM2PRP2H1AUB1HG4P2MYMDTLDERD"
        const clientSecret = "BDTJSNIZRAGYSAAMERUHLAVRXQLQXPOVKQOO2QHSUAY3VAOO"
        // infowindow content
        let infoWindowContent = '<div>' + marker.title + '</div>';

        // Get JSON request of foursquare data
        let url = 'https://api.foursquare.com/v2/venues/search?v=20161016';
            url += '&client_id=' + clientId;
            url += '&client_secret=' + clientSecret;
            url += '&ll=' + marker.position.lat() + ',' + marker.position.lng() ;
            url += '&query=' + marker.title;
        $.getJSON(url).done(function(data) {
            if (data.response.venues) {
                let results = data.response.venues[0];
                let venue_id = results.id;
                let address = results.location.formattedAddress;
                for (i =0; i < address.length; i++) {
                    infoWindowContent = infoWindowContent + '<br />' + address[i];
                }
            }
        }).fail(function() {
            infoWindowContent = infoWindowContent + '<div>Foursquare content is unavailable</div>';
        }).always(function() {
            let attribution = '<div> <a href="https://developer.foursquare.com/">';
            attribution += 'Powered by Foursquare!</a></div>';
            infowindow.setContent(infoWindowContent + attribution);
        });

        // Open the infowindow on the correct marker
        infowindow.open(map, marker);
    }
}

// View Model
let ViewModel = function() {

    let self = this;

    this.placeList = ko.observableArray([]);
    this.filterPlace = ko.observable("");

    places.forEach(function(placeItem){
        self.placeList.push( new Place(placeItem));
    });

    this.filteredPlaceList = ko.computed(function() {
        let filter = self.filterPlace().toLowerCase();

        // filter the place titles and return results
        if (!filter) {
            return self.placeList();
        } else {
            return ko.utils.arrayFilter(self.placeList(), function(item){
                return item.title.toLowerCase().indexOf(filter) !== -1;
            });
        }
    });

    // show or hide the markers
    this.filteredPlaceList.subscribe(function (newPlaces) {
        ko.utils.arrayForEach(self.placeList(), function (item) {
            let show = false;
            for (i=0; i < newPlaces.length; i++) {
                if (newPlaces[i].title == item.title)
                    show = true;
            }
            item.showMarker(show);
        });
     });
}
