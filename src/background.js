chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "COMMUNICATE_TO_SERVER") {
    console.log(
      "Received request from content script to communicate with server."
    );

    sendDataToLocalServer(request.payload)
      .then(() =>
        sendResponse({ status: "success", message: "Data sent successfully." })
      )
      .catch((error) =>
        sendResponse({ status: "error", message: error.message })
      );

    return true;
  }
});

async function sendDataToLocalServer(data) {
  const serverUrl = "http://127.0.0.1:8000/api/endpoint";

  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("Success (from background script):", responseData);
    return responseData;
  } catch (error) {
    console.error(
      "Error sending data to local server (from background script):",
      error
    );
    throw error;
  }
}
