/**
 * 关闭modal，注意这里用到了plots全局变量来进行资源释放
 */
function closeModal() {
    plots.forEach(plot => plot.dispose());
    $('#x-modal-overlay').removeClass('x-open');
}

/**
 * 画统计图
 * @returns {Array}  数组，存储已经绘制图像的 echartInstance 实例，方便进行资源释放
 */
function drawStatisticPlot() {
    let creditPlot = drawCreditsPlot();
    let trendingPlot = drawScoreTrendingPlot();
    return [creditPlot, trendingPlot];
}

/**
 * 更新统计图需要的数据
 */
function updateStatistics() {
    const creditsMap = new Map();
    const trendingArray = [];
    $('table:eq(1)')
        .find('tr:gt(0)')
        .each(function () {
            // category, credits
            const record = $(this).find(
                `td:eq(${COL_INDEX.COURSE_CATEGORY}), td:eq(${COL_INDEX.COURSE_CREDITS})`
            );

            if (record.length === 0) {
                // x-sem-row
                const emArr = $(this).find('em').toArray();
                const scoreArr = $(this).find('span').toArray();
                trendingArray.push([
                    emArr[0].textContent + '-' + emArr[1].textContent,
                    parseFloat(scoreArr[0].textContent),
                    parseFloat(scoreArr[1].textContent),
                    parseFloat(scoreArr[2].textContent),
                ]);
            } else {
                if (
                    $(this).find('input[name="x-course-select"]').is(':checked')
                ) {
                    // record row
                    const cat = record[0].textContent;
                    const credits = parseFloat(record[1].textContent);
                    if (creditsMap.has(cat)) {
                        creditsMap.set(cat, creditsMap.get(cat) + credits);
                    } else {
                        creditsMap.set(cat, credits);
                    }
                }
            }
        });
    processData(creditsMap, trendingArray);
}

/**
 * 将creditsMap和trendingArray处理成合适的格式
 * @param {Map} creditsMap 学分按课程类别的map
 * @param {Array} trendingArray 每学期各种成绩信息的趋势数组
 */
function processData(creditsMap, trendingArray) {
    let cumGPA = 0,
        cumScore = 0,
        cumCredits = 0;
    for (let i = 0; i < trendingArray.length; i++) {
        const credits = trendingArray[i][1];
        const GPA = trendingArray[i][2];
        const score = trendingArray[i][3];
        cumCredits += credits;
        cumGPA += credits * GPA;
        cumScore += credits * score;
        trendingArray[i].push(cumGPA / cumCredits);
        trendingArray[i].push(cumScore / cumCredits);
    }

    creditsDataset = Array.from(creditsMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(cat => [cat[0], cat[1].toFixed(1)]);
    recordDataset = trendingArray.map(sem => [
        sem[0],
        sem[1].toFixed(1), // 学期学分数
        sem[2].toFixed(3), // 学期GPA
        sem[3].toFixed(2), // 学期平均分
        sem[4].toFixed(3), // 累积GPA
        sem[5].toFixed(2), // 累积平均分
    ]);
}

/**
 * 绘制学分按课程类别分类的bar图，方便选课的时候用
 * @returns {echartInstance} 当前图像的示例对象
 */
function drawCreditsPlot() {
    var creditChart = echarts.init(document.getElementById('x-graph1'));

    let option = {
        animationDuration: 1000,
        title: {
            text: 'Credits by Category',
        },
        tooltip: {
            show: true,
        },
        toolbox: {
            show: true,
            feature: {
                saveAsImage: {
                    title: 'Save',
                },
            },
            right: '8px',
        },
        dataset: [
            {
                dimensions: ['category', 'credits'],
                sourceHeader: false,
                source: creditsDataset /* .sort((a, b)=> a[0].length - b[0].length) */,
            },
        ],
        xAxis: {
            type: 'category',
            axisLabel: {
                show: true,
                rotate: 30,
            },
        },
        yAxis: {
            type: 'value',
            name: 'credits',
        },
        series: [
            {
                name: 'Credits',
                type: 'bar',
                label: {
                    show: true,
                    position: 'top',
                },
            },
        ],
    };

    creditChart.setOption(option);
    return creditChart;
}

/**
 * 绘制成绩随semester的趋势line图，娱乐用
 * @returns {echartInstance} 当前图像的实例
 */
function drawScoreTrendingPlot() {
    var scoreChart = echarts.init(document.getElementById('x-graph2'));
    option = {
        animationDuration: 1000,
        title: { text: 'Scores Trending Plot' },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
        },
        toolbox: {
            show: true,
            feature: {
                saveAsImage: {
                    title: 'Save',
                },
            },
            right: '8px',
        },
        legend: {
            // orient: 'vertical',
            bottom: '80px',
            left: 'center',
        },
        dataset: {
            dimensions: [
                'sem',
                'semCredits',
                'semGPA',
                'semScore',
                'cumGPA',
                'cumScore',
            ],
            sourceHeader: false,
            source: recordDataset,
        },
        xAxis: [
            {
                type: 'category',
                axisLabel: {
                    show: true,
                    rotate: 30,
                },
                axisTick: {
                    alignWithLabel: true,
                },
            },
        ],
        yAxis: [
            {
                type: 'value',
                name: 'GPA',
                min: 0,
                max: 4.0,
                position: 'left',
            },
            {
                type: 'value',
                name: 'Score',
                min: 55,
                max: 100,
                position: 'right',
            },
        ],
        series: [
            {
                name: '学期GPA',
                type: 'line',
                yAxisIndex: 0,
                encode: {
                    x: 'sem',
                    y: 'semGPA',
                },
            },
            {
                name: '累积GPA',
                type: 'line',
                yAxisIndex: 0,
                encode: {
                    x: 'sem',
                    y: 'cumGPA',
                },
            },
            {
                name: '学期平均分',
                type: 'line',
                yAxisIndex: 1,
                encode: {
                    x: 'sem',
                    y: 'semScore',
                },
            },
            {
                name: '累积平均分',
                type: 'line',
                yAxisIndex: 1,
                encode: {
                    x: 'sem',
                    y: 'cumScore',
                },
            },
        ],
    };
    scoreChart.setOption(option);
    scoreChart.on('legendselectchanged', function (params) {
        let cnt = 0,
            onlyKey = '';
        for (const [key, value] of Object.entries(params.selected)) {
            if (value) {
                cnt++;
                onlyKey = key;
            }
        }
        // there may be a more elegant way
        if (cnt !== 1) {
            scoreChart.setOption({
                series: [
                    {
                        name: '学期GPA',
                        label: {
                            show: false,
                        },
                    },
                    {
                        name: '累积GPA',
                        label: {
                            show: false,
                        },
                    },
                    {
                        name: '学期平均分',
                        label: {
                            show: false,
                        },
                    },
                    {
                        name: '累积平均分',
                        label: {
                            show: false,
                        },
                    },
                ],
            });
            return;
        }
        scoreChart.setOption({
            series: [
                {
                    name: onlyKey,
                    label: {
                        show: true,
                    },
                },
            ],
        });
    });
    return scoreChart;
}
