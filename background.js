chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.contentScriptQuery === 'exportGrades') {
      const url = 'https://purr.group/api/test/gpa';
      const data = JSON.stringify({
        grades: request.grades
      });
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: data
      })
        .then((response) => {
          if (!response.ok) {
            sendResponse(response.ok);
          }
          return response.json();
        })
        .then((json) => {
          sendResponse(json.success);
        })
        .catch((err) => {
          sendResponse(false);
        });
    }

    return true;
  }
);
