document.addEventListener('DOMContentLoaded', function() {
  const deleteButton = document.getElementById('deleteAll');
  const confirmYesButton = document.getElementById('confirmYes');
  const confirmNoButton = document.getElementById('confirmNo');
  const status = document.getElementById('status');
  const error = document.getElementById('error');
  const log = document.getElementById('log');
  const overallProgress = document.getElementById('overallProgress');
  const currentProgress = document.getElementById('currentProgress');
  const overallProgressText = document.getElementById('overallProgressText');
  const currentProgressText = document.getElementById('currentProgressText');
  const mainPage = document.getElementById('mainPage');
  const confirmPage = document.getElementById('confirmPage');

  function addLog(message) {
    const logEntry = document.createElement('div');
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    log.appendChild(logEntry);
    log.scrollTop = log.scrollHeight;
  }

  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0].url.startsWith('https://claude.ai')) {
      deleteButton.disabled = true;
      status.textContent = "Please navigate to Claude.ai before using this extension.";
      addLog("Not on Claude.ai. Extension disabled.");
    } else {
      addLog("Extension ready on Claude.ai");
    }
  });

  deleteButton.addEventListener('click', function() {
    mainPage.style.display = 'none';
    confirmPage.style.display = 'block';
    addLog("Delete button clicked. Showing confirmation.");
  });

  confirmYesButton.addEventListener('click', function() {
    confirmPage.style.display = 'none';
    mainPage.style.display = 'block';
    deleteButton.disabled = true;
    status.textContent = "Initializing deletion process...";
    error.textContent = "";
    addLog("Deletion confirmed. Starting process.");
    
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {action: "deleteAll"});
    });
  });

  confirmNoButton.addEventListener('click', function() {
    confirmPage.style.display = 'none';
    mainPage.style.display = 'block';
    addLog("Deletion cancelled.");
  });

  browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    addLog(`Received message: ${JSON.stringify(request)}`);
    if (request.action === "updateProgress") {
      if (request.overallProgress !== undefined) {
        overallProgress.style.width = request.overallProgress + "%";
        overallProgressText.textContent = Math.round(request.overallProgress) + "%";
      }
      if (request.currentProgress !== undefined) {
        currentProgress.style.width = request.currentProgress + "%";
        currentProgressText.textContent = Math.round(request.currentProgress) + "%";
      }
      status.textContent = request.status;
      addLog(`Progress update: ${request.status}`);
    } else if (request.action === "complete") {
      deleteButton.disabled = false;
      status.textContent = "All chats deleted successfully!";
      addLog("Deletion process completed successfully.");
    } else if (request.action === "error") {
      deleteButton.disabled = false;
      error.textContent = "An error occurred: " + request.error;
      addLog(`Error occurred: ${request.error}`);
    }
  });
});
