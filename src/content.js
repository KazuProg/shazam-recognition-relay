(function () {
  const handleRecognitionSuccess = (title, artist) => {
    console.log(`曲名: ${title}, アーティスト: ${artist}`);
    triggerServerCommunication({
      type: "SHAZAM_RECOGNITION_SUCCESS",
      title: title,
      artist: artist,
    });
  };

  window.addEventListener("DOMContentLoaded", () => {
    // Shazamの認識結果を監視するためのMutationObserverを設定
    new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type !== "childList") continue;
        if (mutation.addedNodes.length !== 0) {
          const node = mutation.addedNodes[0];
          if (node.className.indexOf("MatchInterstitial") == -1) continue;

          const title = node.children[0].textContent.trim();
          const artist = node.children[1].textContent.trim();

          handleRecognitionSuccess(title, artist);
        }
      }
    }).observe(document.body.querySelectorAll(":scope > div")[1], {
      childList: true,
      subtree: false,
    });

    console.log("MutationObserver が監視を開始しました。");
  });

  function triggerServerCommunication(data) {
    chrome.runtime.sendMessage(
      { type: "COMMUNICATE_TO_SERVER", payload: data },
      function (response) {
        if (response && response.status === "success") {
          console.log(
            "Server communication triggered via background script:",
            response.message
          );
        } else {
          console.error(
            "Failed to trigger server communication:",
            response.message
          );
        }
      }
    );
  }
})();
