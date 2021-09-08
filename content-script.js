/**
 * Note that content scripts are executed in an "isolated world" environment, 
 * so we have to inject script.js into the "cjcx" page
 * Ref: https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions
 */
let s = document.createElement('script');
s.src = chrome.runtime.getURL('script.js');

(document.head || document.documentElement).appendChild(s);
