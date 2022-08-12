var uiState = 'idle';

var UI = {
  status: function(color, text, timed) {
    if (color == null) {
      return;
    } else if (color == 'green') {
      uiState = 'completed';
      chrome.browserAction.setBadgeBackgroundColor({ color: [0, 255, 0, 255] });
    } else if (color == 'red') {
      uiState = 'error';
      chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
    } else if (color == 'orange' ) {
      uiState = 'busy';
      chrome.browserAction.setBadgeBackgroundColor({ color: [255, 128, 0, 255] });
    } else if (color == 'azure' ) {
      uiState = 'making';
      chrome.browserAction.setBadgeBackgroundColor({ color: [0, 128, 255, 255] });
    }
    chrome.browserAction.setBadgeText({ text: text });

    // *** Triggered if the message will be shown just for a short amout of time (specified)
    if (timed > 0) {
      setTimeout(function() {
        chrome.browserAction.setBadgeText({ text: "" });
      }, timed);
    }
  }
}


chrome.browserAction.onClicked.addListener(function(tab) {
  if (uiState === 'busy') {
    uiState = 'stopping';
    chrome.windows.getCurrent(function(win) {
      chrome.tabs.query({ active: true, windowId: win.id }, function(tabs) {
        var tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, { action: 'screenshotStop' }, function(response) {
          if (!response) {
            UI.status('red', "!", 1000);
            alert("Stopping screenshot failed.");
          } else {
            console.log("Stopped screenshot.");
          }
        });
      })
    });
    return;
  }
  UI.status('orange', "grab");

  Screenshotter.grab();
  //chrome.extension.sendMessage({ action: 'grab' });
});
