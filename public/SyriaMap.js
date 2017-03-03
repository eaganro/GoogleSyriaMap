var date;
var zoom;
var lat;
var lang;
var lowDate = new Date("04-28-2013");
var dateSelector = document.getElementById('mapDate');
//var map = document.getElementById('map');
var urlExtra = {
  date:"",
  zoom:"",
  center:"",
};
var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 7,
      center: {lat: 33.933860, lng: 41.416260},
        mapTypeId: 'roadmap',
    });


dateSelector.addEventListener('change', dateListener);

function dateListener(){
  dateParts = `${dateSelector.value}`.split('-');
  date = new Date(`${dateParts[1]}-${dateParts[2]}-${dateParts[0]}`);
  if(date > lowDate) changeMap();
}

google.maps.event.addDomListener(map,'zoom_changed', function() {
  zoom =  map.getZoom();
  urlExtra.zoom = zoom;
  history.pushState({}, "", "/?"+urlExtra.date+'/'+urlExtra.zoom+'/'+urlExtra.center);
});

map.addListener('center_changed', function() {
  if(map.getCenter() != undefined){
    urlExtra.center = map.getCenter();
    var center = map.getCenter();
    lat = center.lat()
    lang = center.lng()
    history.pushState({}, "", "/?"+urlExtra.date+'/'+urlExtra.zoom+'/'+urlExtra.center);
  }
});

function changeCenter(){
  console.log(lat);
  console.log(lang);
  var latlng = new google.maps.LatLng(lat, lang);
  map.setZoom(zoom);
  map.setCenter(latlng);
}

function changeMap(){
  date.setHours(23);
  date.setMinutes(59);
  date.setSeconds(59);
  var data = JSON.stringify({year: date.getFullYear(), month: date.getMonth()+1, day: date.getDate()});
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/mapUpdate", true);
  xhr.setRequestHeader("Content-type","application/json");
  xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        console.log(lat);
          console.log(lang);
          var response = JSON.parse(xhr.responseText);
          if(xhr.responseText.includes("https:")){
            initMap(response.mapURL, zoom, lat, lang)
          }else{
            initMap("https:"+response.mapURL, zoom, lat, lang)
          }
          console.log(lat);
          console.log(lang);
          console.log(zoom);
          urlExtra.date = response.mapDate.substring(0,10);
          urlExtra.zoom = map.getZoom();
          urlExtra.center = map.getCenter();
          history.pushState({}, "", "/?"+urlExtra.date+'/'+urlExtra.zoom+'/'+urlExtra.center);
          dateSelector.value = urlExtra.date;
      }
  };
  xhr.send(data);
}

function removeOldMap(){
  overlayTemp.setMap(null);
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
    var urlSplit = url.split("/");
    var urlSplit2;
    if(urlSplit.length == 1){
      urlSplit2 = urlSplit[0].split("%2F");
    } else{
      var urlSplit2 = urlSplit;
    }

    var dateparts = urlSplit2[0].split('-');
    date = new Date(dateparts[1]+'-'+dateparts[2]+'-'+dateparts[0]);
    zoom = parseInt(urlSplit2[1]);
    var latlang = urlSplit2[2];
    lat = latlang.substr(1,latlang.indexOf(',')-1);
    var langstring = latlang.substr(latlang.indexOf(',')+1);
    console.log("string" +langstring + "   "+langstring.indexOf(')'));
    lang = langstring.substr(3, langstring.indexOf(')')-3);
    console.log(lat);
    console.log(lang);
    console.log(zoom);
    changeMap();
    changeCenter();
  }else{
    date = new Date();
    changeMap();
  }
}
window.onload = getMapInfo;

var overlay;
var overlayTemp; 
// Initialize the map and the custom overlay.

function initMap(url, zooom, latitude, longitude) {
  var bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(28.299566, 34.851674),
      new google.maps.LatLng(37.653165, 48.931870));
  var srcImage;
  if(typeof url === 'string'){
    overlayTemp = new google.maps.GroundOverlay();
    overlayTemp = overlay;
    srcImage = url;
    setTimeout(removeOldMap, 500);
  }else{
    srcImage = 'https://upload.wikimedia.org/wikipedia/commons/1/11/Syrian%2C_Iraqi%2C_and_Lebanese_insurgencies.png';
  }

  overlay = new google.maps.GroundOverlay(srcImage, bounds);
  overlay.setMap(map);
  overlay.setOpacity(1);
}
//google.maps.event.addDomListener(window, 'load', initMap);

