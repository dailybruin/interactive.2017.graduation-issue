require('leaflet.polyline.snakeanim');

$(() => {
  var $main = $(".main");
  var $qnaModal = $("#qna-modal");
  var places = algoliasearch.initPlaces();

  const UCLA_LOC = [34.0689, -118.4452];

  const TO_PATH_OPTS = {
    color: '#ffe800',
    weight: 1
  };

  const FROM_PATH_OPTS = {
    color: '#3284bf',
    weight: 1
  };

  $(document).foundation();

  var map = L.map('map', {
    zoomSnap: 0.5,
    zoomDelta: 0.5,
  });

  map.setView([34.0689, -118.4452], 10);
  L.tileLayer.provider('CartoDB.DarkMatter').addTo(map);

  $qnaModal.on("open.zf.reveal", () => {
    $main.addClass("blur");
  })

  $qnaModal.on("closed.zf.reveal", () => {
    $main.removeClass("blur");
  })

  $qnaModal.foundation("open");

  // Default values corresponding to the initial form values
  var fromloc = L.latLng([34.0522, -118.244]);
  var toloc = L.latLng([45.5088, -73.5879]);

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
        if (this.$el[0].id == "fromloc") {
          fromloc = L.latLng(hit._geoloc);
        } else if (this.$el[0].id == "toloc") {
          toloc = L.latLng(hit._geoloc);
        }
        console.log(fromloc);
        console.log(toloc);
        return hit.locale_names.default[0];
      }
    }
  ]);

  $(".submit-form").click(() => {
    var toArc =  L.Polyline.Arc(fromloc, UCLA_LOC, TO_PATH_OPTS).addTo(map).snakeIn();
    var fromArc =  L.Polyline.Arc(UCLA_LOC, toloc, FROM_PATH_OPTS).addTo(map).snakeIn();

    $qnaModal.foundation("close");
  });
});
