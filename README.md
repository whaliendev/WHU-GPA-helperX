<h1 align="center">WHU-GPA-helperX</h1>

<p align="center">一个简单的武大新教务系统GPA计算器, <a href="https://github.com/HackerLiye/WHU-GPA-helper" target="_blank">WHU-GPA-helper</a>的移植版本</p>

[English version](docs/README-en.md)

## 特性

- [HackerLiye](https://github.com/HackerLiye)（李叶）写的<a href="https://github.com/HackerLiye/WHU-GPA-helper" target="_blank">WHU-GPA-helper</a>的完整移植版。
- 增加了一些展示 GPA 统计数据的特性

## 用法

你可以手动的将 release 页面最新包添加到你的 chrome 浏览器中（在 chrome://extensions 里通过开发者模式）或者从 Chrome extension store 下载到你的浏览器。

### 通过 chrome 开发者模式

通过这种方式需要先将最新代码下载到你电脑本地 (`git clone` 或者从 [发布页面](https://github.com/whaliendev/WHU-GPA-helperX/releases)下载压缩包)。然后，把他们解压缩到你电脑的一个合适的路径下。之后，去 Chrome 扩展管理页面（地址栏输入 chrome://extensions）打开开发者模式，加载该路径到你的谷歌浏览器即可。

<img src="docs/manage.gif">

### chrome 扩展商店

去 [chrome 扩展商店](https://chrome.google.com/webstore/detail/%E6%AD%A6%E6%B1%89%E5%A4%A7%E5%AD%A6%E6%88%90%E7%BB%A9%E5%8A%A9%E6%89%8Bx/jopdhihepdphcbmbhkhjppilomdgdiaj) 添加本扩展到你的谷歌浏览器。值得一提的是，通过这种方式获取的本扩展有时候版本会低一些（由于上线 Chrome 扩展商店需要他们审核一段时间）。

当你通过上述两种方式之一安装本扩展后，在[武大新教务系统上](https://jwgl.whu.edu.cn/xtgl/index_initMenu.html)本扩展会自动触发。希望能够对你有点点帮助 😀

## 浏览器兼容性

<table>
<thead>
<tr>
<th><img alt="IE" title="null" src="https://cdn.jsdelivr.net/npm/@browser-logos/edge/edge_32x32.png"></th><th><img alt="Chrome" title="null" src="https://cdn.jsdelivr.net/npm/@browser-logos/chrome/chrome_32x32.png"></th>
</tr>
</thead>
<tbody>
<tr><td>最新两个版本</td><td>最新两个版本</td>
</tr>
</tbody>
</table>
一件有趣的事，我发现新版edge浏览器能够直接使用Chrome扩展而不需要做任何的porting。

## 说明

1. 本扩展移除了新教务系统的一些交互，比如左上角字符的点击事件等，介意可以停用。
2. 没有用新技术是因为谷歌对扩展引用外部 js 文件限制得比较严格，所以直接使用了教务系统自带的 jQuery。

## 致谢

非常感谢 [李叶](https://github.com/HackerLiye) 和他的 <a href="https://github.com/HackerLiye/WHU-GPA-helper" target="_blank">WHU-GPA-helper</a>项目。

感谢 [SalHe](https://github.com/SalHe) 同学对新教务系统成绩导出功能和排序功能的适配。

感谢 [Embrace](https://github.com/Asxjdb) 同学和 [Ll0veU](https://github.com/Ll0veU) 同学对教务系统更新做出的持续适配。

## 协议

[GPLv3](LICENSE)

<center>Copyright © 2025 Hwa</center>

---

<p align="center"><b>如果觉得本项目还不错，欢迎留个star :star: :arrow_up: 。 </b></p>
