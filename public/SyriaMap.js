var date;
var zoom;
var lat;
var lang;
var dateSelector = document.getElementById('mapDate');
var datePick = datepicker(document.getElementById('mapDate'), {
  minDate: new Date(2015, 5, 6), // June 1st, 2016. 
  maxDate: new Date(2099, 0, 1), // Jan 1st, 2099.
  formatter: function(el, date) {
    // This will display the date as `1/1/2017`. 
    el.value = date.getFullYear()+'-'+(date.getMonth())+'-'+date.getDate();
  }, 
  onSelect: function(instance) {
    // Show which date was selected. 
    dateListener();
  }
});

var urlExtra = {
  date:"",
  zoom:"",
  center:"",
};
var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 7,
      center: {lat: 33.933860, lng: 41.416260},
        mapTypeId: 'roadmap', mapTypeControl: false, streetViewControl: false
});


dateSelector.addEventListener('change', dateListener);

function dateListener(){
  var dateParts = `${dateSelector.value}`.split('-');
  dateParts[1] ++;
  date = new Date (dateParts[0],dateParts[1]-1,dateParts[2]);
  changeMap("change");
}

google.maps.event.addDomListener(map,'zoom_changed', function() {
  zoom =  map.getZoom();
  urlExtra.zoom = zoom;
  history.pushState({}, "", "/scw/?"+urlExtra.date+'/'+urlExtra.zoom+'/'+urlExtra.center);
});

map.addListener('center_changed', function() {
  if(map.getCenter() != undefined){
    urlExtra.center = map.getCenter();
    var center = map.getCenter();
    lat = center.lat()
    lang = center.lng()
    history.pushState({}, "", "/scw/?"+urlExtra.date+'/'+urlExtra.zoom+'/'+urlExtra.center);
  }
});

document.getElementById('preMapBut').addEventListener('click', function(){
  changeMap("pre");
});
document.getElementById('nextMapBut').addEventListener('click', function(){
  changeMap("next");
});

function changeCenter(){
  var latlng = new google.maps.LatLng(lat, lang);
  map.setZoom(zoom);
  map.setCenter(latlng);
}

function changeMap(type){
  var data = JSON.stringify({year: date.getFullYear(), month: date.getMonth()+1, day: date.getDate(), type: type});
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/scw/mapUpdate", true);
  xhr.setRequestHeader("Content-type","application/json");
  xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
          var response = JSON.parse(xhr.responseText);
          if(xhr.responseText.includes("https:")){
            initMap(response.mapURL, zoom, lat, lang)
          }else{
            initMap("https:"+response.mapURL, zoom, lat, lang)
          }
          urlExtra.date = response.mapDate.substring(0,10);
          urlExtra.zoom = map.getZoom();
          urlExtra.center = map.getCenter();
          history.pushState({}, "", "/scw/?"+urlExtra.date+'/'+urlExtra.zoom+'/'+urlExtra.center);
          dateSelector.value = urlExtra.date;
          var dateParts = dateSelector.value.split('-');
          date = new Date (dateParts[0],dateParts[1]-1,dateParts[2]);
        }
  };
  xhr.send(data);
}
var overlayTemp = []; 
function removeOldMap(){
  overlayTemp[1].setMap(null);
  overlayTemp.splice(0,1);
  console.log("-----------------deleted------------")
}

function showKey(){
  var btn = document.getElementById("dropButton");
  if(btn.innerHTML == "Show Key"){
    btn.innerHTML = "Hide Key";
  } else{
    btn.innerHTML = "Show Key";
  }
  document.getElementById("keyDrop").classList.toggle('showKey');
}

function getMapInfo(){
  var url = window.location.href.split("/?")[1];
  if(url){
    var urlSplit = url.split(/\/|%2F/);
    var dateParts = urlSplit[0].split('-');
    date = new Date (dateParts[0],dateParts[1]-1,dateParts[2]);
    zoom = parseInt(urlSplit[1]);
    var latlang = urlSplit[2].slice(1,urlSplit[2].length-2).split(/,%20|%2C%20/);
    lat = latlang[0]
    lang = latlang[1]
    changeMap("change");
    changeCenter();
  }else{
    date = new Date();
    date.setMonth(date.getMonth());
    changeMap("change");
  }
}
window.onload = getMapInfo;

var overlay;

// Initialize the map and the custom overlay.

function initMap(url, zooom, latitude, longitude) {
  var bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(28.299566, 34.851674),
      new google.maps.LatLng(37.653165, 48.931870));
  var srcImage;
  if(typeof url === 'string'){
    tempOver = new google.maps.GroundOverlay();
    tempOver = overlay;
    overlayTemp.push(tempOver);
    srcImage = url;
    setTimeout(removeOldMap, 3000);
  }else{
    srcImage = 'https://upload.wikimedia.org/wikipedia/commons/1/11/Syrian%2C_Iraqi%2C_and_Lebanese_insurgencies.png';
  }

  overlay = new google.maps.GroundOverlay(srcImage, bounds);
  overlay.setMap(map);
  overlay.setOpacity(1);
}
