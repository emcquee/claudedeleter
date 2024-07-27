console.log("Claude Chat Deleter extension loaded");

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Message received:", request);
  if (request.action === "deleteAll") {
    deleteAllChats();
  }
});

async function deleteAllChats() {
  try {
    log("Starting deleteAllChats function");
    updateProgress(0, 0, "Initializing deletion process...");

    log("Fetching organization ID");
    const orgId = await getOrganizationId();
    log(`Organization ID: ${orgId}`);

    log("Fetching chat list");
    updateProgress(10, 0, "Fetching chat list...");
    let chatLinks = await getChatLinks(orgId);
    log(`Found ${chatLinks.length} chats to delete`);

    if (chatLinks.length === 0) {
      log("No chats found to delete");
      updateProgress(100, 100, "No chats found to delete.");
      return;
    }

    for (let i = 0; i < chatLinks.length; i++) {
      log(`Deleting chat ${i + 1} of ${chatLinks.length}: ${chatLinks[i]}`);
      updateProgress(
        10 + (i / chatLinks.length) * 90, 
        0, 
        `Deleting chat ${i + 1} of ${chatLinks.length}...`
      );
      await deleteChat(orgId, chatLinks[i]);
    }

    log("All chats deleted successfully");
    updateProgress(100, 100, "All chats deleted successfully!");
    browser.runtime.sendMessage({action: "complete"});
  } catch (error) {
    console.error("An error occurred in deleteAllChats:", error);
    log(`Error in deleteAllChats: ${error.message}`);
    browser.runtime.sendMessage({action: "error", error: error.message});
  }
}

async function getOrganizationId() {
  const response = await fetch('https://claude.ai/api/organizations', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch organization ID. HTTP status: ${response.status}`);
  }

  const data = await response.json();
  if (data.length === 0) {
    throw new Error("No organizations found");
  }

  return data[0].uuid;
}

async function getChatLinks(orgId) {
  const response = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chat list. HTTP status: ${response.status}`);
  }

  const data = await response.json();
  return data.map(chat => chat.uuid);
}

async function deleteChat(orgId, chatId) {
  try {
    log(`Sending delete request for chat: ${chatId}`);
    updateProgress(null, 50, `Deleting chat ${chatId}...`);

    const response = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat. HTTP status: ${response.status}`);
    }

    log(`Chat ${chatId} deleted successfully`);
    updateProgress(null, 100, `Chat ${chatId} deleted successfully`);
  } catch (error) {
    log(`Error deleting chat ${chatId}: ${error.message}`);
    throw error;
  }
}

function updateProgress(overallProgress, currentProgress, status) {
  log(`Progress update - Overall: ${overallProgress}, Current: ${currentProgress}, Status: ${status}`);
  browser.runtime.sendMessage({
    action: "updateProgress", 
    overallProgress: overallProgress !== null ? overallProgress : undefined,
    currentProgress: currentProgress !== null ? currentProgress : undefined,
    status: status
  });
}

function log(message) {
  console.log(message);
  browser.runtime.sendMessage({
    action: "updateProgress",
    status: message
  });
}
