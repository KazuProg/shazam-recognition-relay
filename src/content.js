(function () {
  window.addEventListener("DOMContentLoaded", () => {
    const targetNode = document.body.querySelectorAll(":scope > div")[1];

    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type !== "childList") continue;
        if (mutation.addedNodes.length !== 0) {
          const node = mutation.addedNodes[0];
          if (node.className.indexOf("Match") == -1) continue;

          const title = node.children[0].textContent.trim();
          const artist = node.children[1].textContent.trim();

          console.log(`曲名: ${title}, アーティスト: ${artist}`);
          triggerServerCommunication({
            type: "SHAZAM_RECOGNITION_SUCCESS",
            title: title,
            artist: artist,
          });
        }
      }
    };

    const observer = new MutationObserver(callback);

    observer.observe(targetNode, {
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
