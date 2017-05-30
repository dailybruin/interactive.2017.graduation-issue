$(() => {
  var $main = $(".main");
  var $qnaModal = $("#qna-modal");

  $(document).foundation();

  $qnaModal.on("open.zf.reveal", () => {
    $main.addClass("blur");
  })

  $qnaModal.on("closed.zf.reveal", () => {
    $main.removeClass("blur");
  })

  $qnaModal.foundation("open");
});
