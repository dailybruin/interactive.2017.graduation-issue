$(() => {
  var $main = $(".main");
  var $qnaModal = $("#qna-modal");
  var places = algoliasearch.initPlaces();

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

  L.Polyline.Arc([34.0289, -118.4152], [34.0689, -118.4452], {
    color: '#ffe800',
    weight: 1
  }).addTo(map);

});
