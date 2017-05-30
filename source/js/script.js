$(() => {
  var $main = $(".main");
  var $qnaModal = $("#qna-modal");
  var places = algoliasearch.initPlaces();

  $(document).foundation();

  $qnaModal.on("open.zf.reveal", () => {
    $main.addClass("blur");
  })

  $qnaModal.on("closed.zf.reveal", () => {
    $main.removeClass("blur");
  })

  $qnaModal.foundation("open");

  places
    .search({"query": "Singapore", "type": "city"}, function(err, res) {
      if (err) {
        throw err;
      }
      console.log(res);
    });

  var $fromloc = $("#fromloc");

  $("#fromloc").textcomplete([
    {
      match: /(^|\b)([\w,\s]{2,})$/,
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
        return hit.locale_names.default[0];
      }
    }
  ]);

});
