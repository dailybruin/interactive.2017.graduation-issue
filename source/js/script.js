require('Leaflet.Geodesic');

$(() => {
  let $main = $(".main");
  let $qnaModal = $("#qna-modal");
  let places = algoliasearch.initPlaces();

  // Initialize foundation
  $(document).foundation();

  const UCLA_LOC = [34.0689, -118.4452];
  const POLLING_INTERVAL = 15000;
  const LocalStorage = window.localStorage;
  const TO_PATH_OPTS = {
    color: '#ffe800',
    weight: 1,
    steps: 15,
    className: "line",
  };
  const FROM_PATH_OPTS = {
    color: '#3284bf',
    weight: 1,
    steps: 15,
    className: "line",
  };

  let displayLine = function (entry, map) {
    const PathClass = "path-" + entry.id;
    var toOpts = $.extend({}, TO_PATH_OPTS, { className: "line " + PathClass} );
    var fromOpts = $.extend({}, FROM_PATH_OPTS, { className: "line " + PathClass} );

    console.log(entry);

    /*
    var fromArc =  L.Polyline.Arc(entry.from, UCLA_LOC, toOpts).addTo(map)
    .snakeIn({
      snakingSpeed: 3000
    });
    var toArc =  L.Polyline.Arc(UCLA_LOC, entry.to, fromOpts).addTo(map)
    .snakeIn({
      snakingSpeed: 3000
    });
    */
    var fromArc = L.geodesic([[entry.from, UCLA_LOC]], fromOpts).addTo(map);
    var toArc = L.geodesic([[UCLA_LOC, entry.to]], toOpts).addTo(map);

    const PopupContent = `
      I'm from ${entry.fromloc} and after ${entry.years} amazing years at UCLA,
       I'm graduating with a ${entry.degree} in
      ${entry.major}. I'll be heading to ${entry.toloc} for ${entry.next}!
    `;

    fromArc.bindPopup(PopupContent);
    toArc.bindPopup(PopupContent);

    let v = new Vivus(fromArc._renderer._container, {
      duration: 200,
      selfDestroy: true,
      type: 'delayed',
    }, () => {
      v.finish();
    });

    let v2 = new Vivus(toArc._renderer._container, {
      duration: 200,
      selfDestroy: true,
      type: 'delayed',
    }, () => {
      v2.finish();
    });

    let $paths = $("." + PathClass);
    // Unfortunate hack to get the multiple hovering effect to work
    $paths.hover(() => {
      $paths.toggleClass("hover");
    });

    return [fromArc, toArc];
  }

  let pollServerForUpdates = function (map, locations) {
    $.get("/entries")
    .done((res) => {
      res.forEach((entry) => {
        if(!locations.hasOwnProperty(entry.id)) {
          entry['display'] = displayLine(entry, map);
          locations[entry.id] = entry;
        }
      });
    });
  };

  window.removeBlur = function () {
    $('#map').removeClass("blur");
    $('#map-guide').removeClass("blur");
    $('#qna-modal').css('display', 'none');
  };


  let displayedEntries = {};
  let submission = LocalStorage.getItem('submission');


  //removeBlur();
  // Has the form been previously filled?
  // always show
  //if(!submission) {
  //}

  $('.article-slider').lightSlider({
    loop: false,
    slideMove: 2,
    pager: false,
    item: 4,
    enableDrag: true,
    responsive: [
      {
        breakpoint: 800,
        settings: {
          item: 3
        }
      },
      {
        breakpoint: 480,
        settings:{
          item: 2
        }
      }
    ]
  });

  var map = L.map('map', {
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    maxZoom: 15,
    maxBoundsViscosity: 1.0,
  });

  //map.fitWorld();
  //map.setMaxBounds(map.getBounds());
  const southWest = L.latLng(-89.98155760646617, -180);
  const northEast = L.latLng(89.99346179538875, 180);
  const bounds = L.latLngBounds(southWest, northEast);

  map.setMaxBounds(bounds);

  map.setView([34.0689, -118.4452], 9);

  let tileL = L.tileLayer.provider('CartoDB.DarkMatter');
  //tileL.options.noWrap = true;
  tileL.addTo(map);

  // Initial call to populate map
  pollServerForUpdates(map, displayedEntries);
  // Update every POLLING_INTERVAL msec
  setInterval(pollServerForUpdates, POLLING_INTERVAL, map, displayedEntries);

  // Default values corresponding to the initial form values
  var fromloc = {lat: 34.0522, lng: -118.244};
  var toloc = {lat: 45.5088, lng: -73.5879};

  // Location Autocomplete
  $(".getloc").textcomplete([
    {
      match: /(^|\b)([\w,\s]{2,})$/,
      cacheBoolean: true,
      search: function(query, callback) {
        places.search({
          "query": query,
          "type": "city",
          "hitsPerPage": 6
        },
        (err, res) => {
          if(err) {
            throw err;
          }
          callback(res.hits);
        })
      },
      // #5 - Template used to display each result obtained by the Algolia API
      template: function (hit) {
        // Returns the highlighted version of the name attribute
        var ret = hit._highlightResult.locale_names.default[0].value
        if(hit._highlightResult.administrative) {
          return ret +
            '<p>' + hit._highlightResult.administrative[0].value + '</p>';
        } else {
          return ret +
            '<p>' + hit._highlightResult.country.default.value + '</p>';
        }
      },
      // #6 - Template used to display the selected result in the textarea
      replace: function (hit) {
        if (this.$el[0].id == "qna-fromloc") {
          fromloc = hit._geoloc;
        } else if (this.$el[0].id == "qna-toloc") {
          toloc = hit._geoloc;
        }
        return hit.locale_names.default[0];
      }
    }
  ]);

  $(".submit-form").click(() => {
    let formEls = $("span[id^='qna']");
    let params = {};
    formEls.each(function() {
      var $this = $(this);
      params[$this[0].id.substring(4)] = $this.text().trim();
    });

//    console.log(fromloc);

    params["from"] = fromloc;
    params["to"] = toloc;

//    console.log(params);

    $.post("/entries", params)
    .done((res) => {
      //console.log(res);
      LocalStorage.setItem("submission", true);
    });

    removeBlur();

    // Let the automatic update handle this

    /*
    console.log(params);


    const PathClass = "path-0";
    let toOpts = $.extend({}, TO_PATH_OPTS, { className: "line " + PathClass} );
    let fromOpts = $.extend({}, FROM_PATH_OPTS, { className: "line " + PathClass} );
    var fromArc =  L.Polyline.Arc(fromloc, UCLA_LOC, toOpts).addTo(map)
    .snakeIn({
      snakingSpeed: 3000
    });
    var toArc =  L.Polyline.Arc(UCLA_LOC, toloc, fromOpts).addTo(map)
    .snakeIn({
      snakingSpeed: 3000
    });

    let $paths = $("." + PathClass);
    // Unfortunate hack to get the multiple hovering effect to work
    $paths.hover(() => {
      $paths.toggleClass("hover");
    });
    */
  });
});
