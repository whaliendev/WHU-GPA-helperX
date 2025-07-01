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

// 加载 echarts 库
let echarts = document.createElement('script');
echarts.src = chrome.runtime.getURL('js/echarts.min.js');
document.head.appendChild(echarts);

// 按依赖顺序加载模块化脚本
const scripts = [
    'js/util.js', // 工具函数 (最先加载)
    'js/config.js', // 配置和全局变量 (次优先加载)
    'js/calculator.js', // GPA计算功能
    'js/sort.js', // 排序功能
    'js/ui-builder.js', // UI构建功能
    'js/charts.js', // 图表功能
    'js/events.js', // 事件绑定功能
    'js/core.js', // 核心业务逻辑 (最后加载)
];

// 顺序加载脚本以保证依赖关系
scripts.forEach((scriptPath, _) => {
    let script = document.createElement('script');
    script.src = chrome.runtime.getURL(scriptPath);
    document.body.appendChild(script);
});
