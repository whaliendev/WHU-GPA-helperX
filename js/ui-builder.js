/**
 * optional: 隐藏教务系统给出的GPA计算结果
 */
function disableGPAByJWGL() {
    const candidateDivs = document.querySelectorAll('div.col-md-2.col-sm-2');

    for (const div of candidateDivs) {
        if (div.textContent.includes('平均学分绩点')) {
            div.style.display = 'none';
            break;
        }
    }
}

/**
 * 添加控制Button
 */
function addButtons() {
    $('#search_go').before(`
          <button class="x-button btn btn-primary btn-sm" id="x-sel-all">全不选</button>
          <button class="x-button btn btn-primary btn-sm" id="x-sel-rev">反选</button>
          <button class="x-button btn btn-primary btn-sm" id="x-sel-revert">复原</button>
          <button class="x-button btn btn-primary btn-sm" id="x-show-graph">图表</button>
      `);
}

/**
 * 添加图表Modal
 */
function addGraphModal() {
    // Add graph modal
    $('header.navbar-inverse.top2').before(`
    <div class="x-overlay" id="x-modal-overlay">
      <div class="x-modal">
          <header>
              <span>统计信息</span>
              <span id="x-revert">
                  复原
              </span>
              <button class="x-icon" title="关闭">
                  <div class="x-line x-line1"></div>
                  <div class="x-line x-line2"></div>
              </button>
          </header>
          <main>
              <div id="x-graph1"></div>
              <div id="x-graph2"></div>
          </main>
      </div>
    </div>
  `);
}

/**
 * 配置课程计算选项组
 * @param {Array} catsList 课程类别列表，注意未去重
 * @returns 无返回值
 */
function addCourseSelectBox(catsList) {
    if (catsList.length === 0) return;
    const unique = [...new Set(catsList)].sort((a, b) => a.localeCompare(b));
    let catContent = '';
    for (let i = 0; i < unique.length; i++) {
        catContent += `
              <div class="x-check-wrapper">
                  <label for="cat${i}">${unique[i]}</label>
                  <input type="checkbox" name="x-selbox" value="${unique[i]}" id="x-cat${i}" checked>
              </div>
          `;
    }
    $('#btn_sortSetting').before(`
          <div class="x-controls-container">
              <div class="x-select">
                  <label for="" class="x-hint">请选择计算项：</label>
                  <div class="x-container">
                      <div class="x-check-container">
                          ${catContent}
                      </div>
                  </div>
              </div>
              <div class="x-show-info">
                  <div class="x-info-wrapper">
                      <strong>总学分数：</strong><span class="x-info" id="x-credits">0.0</span>
                  </div>
                  <div class="x-info-wrapper">
                      <strong>平均GPA：</strong><span class="x-info" id="x-gpa">0.000</span>
                  </div>
                  <div class="x-info-wrapper">
                      <strong>平均成绩：</strong><span class="x-info" id="x-average-score">0.00</span>
                  </div>
              </div>
          </div>
    `);
    addHeaderPanel();
}

/**
 * 添加控制container的悬浮显示效果
 */
function addHeaderPanel() {
    // add shadow to controls container, when controls container is positioned stuck.
    // https://css-tricks.com/how-to-detect-when-a-sticky-element-gets-pinned/
    // https://stackoverflow.com/questions/16302483/event-to-detect-when-positionsticky-is-triggered
    const headerInfo = $('.x-controls-container')[0];
    const observer = new IntersectionObserver(
        ([e]) =>
            e.target.classList.toggle('is-pinned', e.intersectionRatio < 1),
        {
            rootMargin: '-28px 0px 0px',
            threshold: [1],
        }
    );
    observer.observe(headerInfo);
}

/**
 * 配置选项按钮，选项多选框等静态控件
 * @param {Array} catsList 未去重课程类别列表。因为配置动态UI可能会执行多次，所以不在配置动态UI进行去重
 */
function customStaticUI(catsList) {
    $('#topButton')[0].onclick = null;
    // remove unintended captcha overlay
    $('#dx_captcha_basic_overlay_1').css('display', 'none');
    disableGPAByJWGL();

    // 如果没有添加Button控件和图表Modal
    if ($('#x-sel-all').length === 0) {
        addButtons();
        addGraphModal();
    }

    /**
     * 说明：绝对不要交换当前这段代码和下段代码。
     * 因为.x-controls-container的位置变化会触发intersection observer的单向添加is-pinned类。
     * 当然这里有更好的解决办法，不过先这样fix一下。
     */
    if ($('#div-data .col-md-10.col-sm-10').length !== 0) {
        let fmBlock = $('#div-data .col-md-10.col-sm-10');
        fmBlock.before(fmBlock.contents());
        fmBlock.css('display', 'none');
    }

    // 如果没有添加课程选项框
    if ($('input[name="x-selbox"]').length === 0) {
        addCourseSelectBox(catsList);
    } else {
        $('input[name="x-selbox"]').prop('checked', true);
    }
}
