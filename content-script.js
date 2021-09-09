/**
 * Note that content scripts are executed in an "isolated world" environment,
 * so we have to inject script.js into the "cjcx" page
 * Ref: https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions
 */
const style = document.createElement('link');
style.href = chrome.runtime.getURL('style.css');
style.rel = "stylesheet";
document.head.appendChild(style);

let script = document.createElement('script');
script.src = chrome.runtime.getURL('script.js');

document.body.appendChild(script);
