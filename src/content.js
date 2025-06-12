(function () {
  const isChangedURL = (() => {
    let previousURL = location.href;
    return () => {
      const currentURL = location.href;
      if (previousURL !== currentURL) {
        previousURL = currentURL;
        return true;
      }
      return false;
    };
  })();

  const handleRecognitionSuccess = (title, artist) => {
    console.log(`曲名: ${title}, アーティスト: ${artist}`);
    triggerServerCommunication({
      type: "SHAZAM_RECOGNITION_SUCCESS",
      title: title,
      artist: artist,
    });
  };

  const handleURLChange = () => {
    const currentURL = location.href;
    console.log(`URLが変更されました: ${currentURL}`);

    if (location.pathname.indexOf("/song/") !== -1) {
      watchSongLoad((title, artist) => {
        console.log(`曲名: ${title}, アーティスト: ${artist}`);
        triggerServerCommunication({
          type: "SHAZAM_SONG_PAGE_VIEW",
          lang:
            location.pathname.split("/song/")[0].replace("/", "") || "en-us",
          title: title,
          artist: artist,
        });
        if (location.pathname.startsWith("/song/")) {
          location.href = `/ja-jp${location.pathname}`;
        }
      });
    }
  };

  const watchSongLoad = (callback) => {
    const getTitleElement = () => document.querySelector("main h1");
    const getArtistElement = () => document.querySelector("main h2");

    const dispatchIfLoaded = () => {
      const titleElement = getTitleElement();
      const artistElement = getArtistElement();
      if (titleElement && artistElement) {
        const title = titleElement.textContent.trim();
        const artist = artistElement.textContent.trim();
        callback(title, artist);
        return true;
      }
      return false;
    };
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const result = dispatchIfLoaded();
          if (result) {
            observer.disconnect();
            return;
          }
        }
      }
    });

    if (!dispatchIfLoaded()) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
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
        if (mutation.removedNodes.length !== 0) {
          const node = mutation.removedNodes[0];
          if (node.className.indexOf("MatchInterstitial") == -1) continue;

          // TODO: もう少しURL検知を高速化
          if (isChangedURL()) handleURLChange();
        }
      }
    }).observe(document.body.querySelectorAll(":scope > div")[1], {
      childList: true,
      subtree: false,
    });

    // ページ遷移を監視するためのMutationObserverを設定
    new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type !== "childList") continue;
        if (mutation.removedNodes.length !== 0) {
          const node = mutation.removedNodes[0];
          if (node?.classList?.toString().indexOf("Transition_bar") == -1)
            continue;

          if (isChangedURL()) handleURLChange();
        }
      }
    }).observe(document.body, {
      childList: true,
      subtree: false,
    });

    handleURLChange(); // 初回のURLチェックを実行

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
