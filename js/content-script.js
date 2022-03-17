/**
 * Note that content scripts are executed in an "isolated world" environment,
 * so we have to inject script.js into the "cjcx" page
 * Ref: https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions
 * Ref: https://developer.chrome.com/docs/extensions/mv3/content_scripts/
 */
// const style = document.createElement('link');
// style.href = chrome.runtime.getURL('css/style.css');
// style.rel = 'stylesheet';
// document.head.appendChild(style);

let echarts = document.createElement('script');
echarts.src = chrome.runtime.getURL('js/echarts.min.js');
document.head.appendChild(echarts);

let script = document.createElement('script');
script.src = chrome.runtime.getURL('js/script.js');
document.body.appendChild(script);