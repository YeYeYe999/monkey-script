// ==UserScript==
// @name         ilabel test
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.0
// @description  ialbel test
// @author       You
// @match        https://ilabel.weixin.qq.com/mission/11538/label
// @require      https://scriptcat.org/lib/513/2.1.0/ElementGetter.js
// @require      https://scriptcat.org/lib/637/1.4.5/ajaxHooker.js
// @require      https://code.jquery.com/jquery-3.7.1.slim.min.js
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

function backup() {
  //  // @require     https://scriptcat.org/lib/513/2.1.0/ElementGetter.js
  // // @require      https://raw.githubusercontent.com/YeYeYe999/monkey-script/main/elmGetter.js

  // #app > div > div.main-container > section > div.container.hideSidebar > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div > div > div.el-table__body-wrapper.is-scrolling-none > table > tbody > tr:nth-child(31) > td.el-table_2_column_19.el-table__cell > div > ul > li:nth-child(1) > div
}

class AppManager {
  constructor(limitWords, assignments, missionConfig) {
    this.limitWords = limitWords;
    this.assignments = assignments;
    this.missionConfig = missionConfig;

    this.styleManager = new LabelPageStyleManager();

    this.missionManager = new MissionInfoManager();

    this.textHighlightManager = new TextHighlightManager();

    this.contentManager = new ContentManager(
      this.limitWords,
      this.styleManager,
      this.textHighlightManager
    );

    this.messageManager = new MessageManager();

    this.submitManager = new SubmissionManager(
      this.missionManager,
      this.textHighlightManager,
      this.messageManager
    );
  }

  async init() {
    await this.handleRouterChange();
    // this.styleManager.initStyle();
  }

  async handleRouterChange() {
    await delay(3000);
    const appElement = document.getElementById("app");
    if (appElement && appElement.__vue__) {
      const vueInstance = appElement.__vue__;
      vueInstance.$router.beforeEach((to, from, next) =>
        this.routerChangeHandler(to, from, next)
      );
    } else {
      console.log("Vue instance not found");
    }
  }

  async routerChangeHandler(to, from, next) {
    console.log(`${from.path} ===> ${to.path}`);
    if (to.path.includes("label")) {
      await this.runLabelPageLogic(to.path);
    } else {
      this.missionManager.toggleDisplay(false);
    }
    next();
  }

  async runLabelPageLogic(path) {
    // this.styleManager.initStyle();

    const missionId = getMidForPath(path);

    hookAssignments(missionId, this.assignments);

    this.missionManager.handleMissionInfo(this.missionConfig, missionId);

    this.submitManager.submitEvent();

    this.contentManager.updateContentBasedOnTask();
  }
}

class MultiTaskManager {
  constructor(limitWords, assignments, missionConfig) {
    this.limitWords = limitWords;
    this.assignments = assignments;
    this.missionConfig = missionConfig;

    this.styleManager = new LabelPageStyleManager();
    this.missionManager = new MissionInfoManager();
    this.textHighlightManager = new TextHighlightManager();
    this.contentManager = new ContentManager(
      this.limitWords,
      this.styleManager,
      this.textHighlightManager
    );
    this.messageManager = new MessageManager();
    this.submitManager = new SubmissionManager(
      this.missionManager,
      this.textHighlightManager,
      this.messageManager
    );
  }

  async init() {
    console.log("MultiTaskManager init");
    
    this.setupSearchButtonListener();
    // this.setupTaskSelectionListener();
  }

  // setupSearchButtonListener() {
  //   const searchButton = document.querySelector('.el-form-item__content > button:nth-child(1)');  // Modify to correct ID
  //   if (searchButton) {
  //     searchButton.addEventListener('click', async () => {
  //       await this.runTaskLoadingLogic();
  //     });
  //   }
  // }

  // elmGetter version
  setupSearchButtonListener() {
    elmGetter.get('.el-form-item__content > button:nth-child(1)').then(searchButton => {
      searchButton.addEventListener('click', async () => {
        await this.runTaskLoadingLogic();
        });
    })
  }
  

  // setupTaskSelectionListener() {
  //   const taskSelectDropdown = document.getElementById('taskSelectDropdown');  // Modify to correct ID
  //   if (taskSelectDropdown) {
  //     taskSelectDropdown.addEventListener('change', () => {
  //       // Optionally, reset or adjust UI based on task selection
  //     });
  //   }
  // }

  async runTaskLoadingLogic() {
    const missionId = getSelectedMissionId();  // Get the ID based on selected task
    console.log("Selected mission ID:", missionId);
    // hookAssignments(missionId, this.assignments);
    this.missionManager.handleMissionInfo(this.missionConfig, missionId);
    this.submitManager.submitEvent();
    this.contentManager.updateContentBasedOnTask(missionId);
    // this.monitorTaskListChanges();

    // 测试
     await changeLabelResultFontColor();
  }

  // monitorTaskListChanges() {
  //   const taskListContainer = document.getElementById('taskList');  // Modify to correct ID
  //   if (taskListContainer) {
  //     const observer = new MutationObserver((mutationsList) => {
  //       for (const mutation of mutationsList) {
  //         if (mutation.type === 'childList') {
  //           // When the task list is updated, run related logic
  //           this.handleTaskListUpdated();
  //         }
  //       }
  //     });

  //     observer.observe(taskListContainer, { childList: true });
  //   }
  // }

  // handleTaskListUpdated() {
  //   console.log('Task list updated');
  //   // Trigger any additional logic after task list is updated
  // }
}


// #region 辅助函数
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMidForPath(path) {
  const mid = path.split("/")[2];
  if (!isNaN(mid)) {
    return mid;
  }
}

function getSelectedMissionId() {
  const selectedTextElement = document.querySelector('.el-select__tags-text');
  if (selectedTextElement) {
    const selectedText = selectedTextElement.textContent.trim();
    const selectedMissionId = selectedText.split("-")[0];
    return selectedMissionId;
  }
}

function getSelectedMissionName() {
  const selectedTextElement = document.querySelector('.el-select__tags-text');
  if (selectedTextElement) {
    const selectedText = selectedTextElement.textContent.trim();
    const selectedMissionName = selectedText.split("-")[1];
    return selectedMissionName;
  }
}

// 更改原审信息的原审结果的字体颜色
async function changeLabelResultFontColor(){
  
  const labelElementSelector = '.el-table__row > td:nth-child(8) > div > ul > li:nth-child(1) > div';
  elmGetter.each(labelElementSelector, document.querySelector('.el-table__row > td:nth-child(8)'), async labelElement => {

    const labelResult = labelElement.textContent.trim();
    // console.log(labelResult)

    // if(labelResult === '正常'){
    //   labelElement.style.color = 'green';
    // }
    // 未知(100) 提取括号内数字
    const label = labelResult.match(/\((\d+)\)/)[1];
    // console.log(label)
    // console.log(typeof label)

    if(label === '100'){
      // console.log('label === 100')

      await delay(1000)

      labelElement.style.color = 'green'; // 不生效
      // 强制修改颜色 !important
      // labelElement.style.setProperty('color', 'green', 'important'); // 生效

    }

  })
  console.log('changeLabelResultFontColor')
}




// #endregion

// 分配拦截
function hookAssignments(missionId, assignments) {
  const assignment = assignments[missionId];
  // console.log(assignment);
  if (!assignment) return; // 确保assignment存在

  const matchUrl = `assigned?mid=${assignment.mid}&amount=${assignment.amount}`;
  const modifiedUrl = `assigned?mid=${assignment.mid}&amount=${assignment.modifiedAmount}`;

  // 设置筛选条件以拦截对应的请求
  ajaxHooker.filter([{ type: "xhr", url: matchUrl, method: "GET" }]);

  // 拦截并修改请求
  ajaxHooker.hook((request) => {
    if (request.url.includes(matchUrl)) {
      request.url = `https://ilabel.weixin.qq.com/api/hits/${modifiedUrl}`;
      // console.log("拦截并修改请求:", request.url);
    }
  });
}

// #region 样式管理

class LabelPageStyleManager {
  constructor() {
    this.baseSelector = `div.container.hideSidebar * > `;
    this.stylesToApply = "";
    // this.commonStyle = {
    //   1: { width: "100px", fontSize: "5px" }, //120-100=20
    //   2: { width: "148px" }, // 248-148=100
    //   3: { width: "485px", color: "green", fontSize: "18px" }, // 244+100+144 = 488; -3
    //   4: { width: "100px" }, // 244-100=144
    //   5: { width: "100px" }, // 244-100=144
    //   6: { width: "800px" }, // 489+20+144+144 = 797; +3
    //   7: { width: "100px" }, // 244-100=144
    // };

    this.commonStyle = {
      1: { width: "80px", fontSize: "5px" }, //120-100=20 //120-80=40 //20
      2: { width: "80px" }, // 165-100=65; 165-80=85 //20
      3: { width: "100px" }, // 161-100=61
      4: { width: "100px" }, // 161-100=61
      5: { width: "318px", color: "green", fontSize: "18px"},  // 161+20+65+61+61 = 368 368-50=318 // 50
      6: { width: "100px" }, // 161-100=61
      7: { width: "100px" }, // 261-100=161; 261-80=181 //20
      8: { width: "161px" }, // 
      9: { width: "100px" }, //
      10: { width: "665px" }, // 323+61+161 = 555; 555+20=575; 575+20=595; 595+ 20 = 615; 615+50=665;
      11: { width: "100px" }, // 161-100=61
    };






// <colgroup>
  // <col name="el-table_2_column_12" width="120" /> ID
  // <col name="el-table_2_column_13" width="165" /> 队列ID
  // <col name="el-table_2_column_14" width="161" /> 队列名称
  // <col name="el-table_2_column_15" width="161" /> 用户昵称
  // <col name="el-table_2_column_16" width="161" /> 评论文本
  // <col name="el-table_2_column_17" width="161" /> 命中策略
  // <col name="el-table_2_column_18" width="261" /> 直播类型
  // <col name="el-table_2_column_19" width="161" /> 原审信息
  // <col name="el-table_2_column_20" width="100" /> 质检结果
  // <col name="el-table_2_column_21" width="323" /> 打标
  // <col name="el-table_2_column_22" width="161" /> 备注
// </colgroup>

    this.nickNameStyle = {
      2: { width: "332px", color: "green", fontSize: "18px" },
      3: { width: "100px" },
      4: { width: "100px" },
      5: { width: "100px" },
      6: { width: "933px" },
      7: { width: "144px" },
    };
  }

  colSelector(nth) {
    return `${this.baseSelector}.el-table__header > colgroup > col:nth-child(${nth}),
                ${this.baseSelector}.is-group.has-gutter > tr > th:nth-child(${nth}),
                ${this.baseSelector}.el-table__body > colgroup > col:nth-child(${nth}),
                ${this.baseSelector}.el-table__row > td:nth-child(${nth})`;
  }

  handleCommonStyle(styleSettings) {
    let style = Object.keys(styleSettings).reduce((acc, nth) => {
      return `${acc}
                ${this.colSelector(nth)}{
                    width: ${styleSettings[nth].width};
                    color: ${styleSettings[nth].color || "inherit"};
                    font-size: ${styleSettings[nth].fontSize || "inherit"};
                }`;
    }, "");

    // GM_addStyle(style);
    this.collectStyles(style);
  }

  collectStyles(style) {
    this.stylesToApply += style;
  }

  applyStyles() {
    GM_addStyle(this.stylesToApply);
    this.stylesToApply = ""; // Reset after applying
  }

  // Configurable method to apply styles based on settings
  configureAndApplyStyles(styleConfig) {
    this.handleCommonStyle(styleConfig.styles);
    this.applyStringStrongStyle(styleConfig.stringStrongColumnIndex);
    this.applyFooterStyle();
    this.applyRadioButtonStyle(
      styleConfig.isToggleRadioButton,
      styleConfig.radioButtonIndexs
    );
    // this.applyRadioButtonsCheckedStyle();
    this.changeRadioButtonsCheckedStyle();
    this.applyBorderStyle();

    this.applyStyles();
  }

  // 原始样式
  // <colgroup>
  //   <col name="el-table_2_column_11" width="120">
  //   <col name="el-table_2_column_12" width="248">
  //   <col name="el-table_2_column_13" width="244">
  //   <col name="el-table_2_column_14" width="244">
  //   <col name="el-table_2_column_15" width="244">
  //   <col name="el-table_2_column_16" width="489">
  //   <col name="el-table_2_column_17" width="244">
  //   <col name="gutter" width="0">
  // </colgroup>

// 第二版

// <colgroup>
  // <col name="el-table_2_column_12" width="120" />
  // <col name="el-table_2_column_13" width="165" />
  // <col name="el-table_2_column_14" width="161" />
  // <col name="el-table_2_column_15" width="161" />
  // <col name="el-table_2_column_16" width="161" />
  // <col name="el-table_2_column_17" width="161" />
  // <col name="el-table_2_column_18" width="261" />
  // <col name="el-table_2_column_19" width="161" />
  // <col name="el-table_2_column_20" width="100" />
  // <col name="el-table_2_column_21" width="323" />
  // <col name="el-table_2_column_22" width="161" />
// </colgroup>
 

  // 通用样式(评论任务)
  applyCommonStyle() {
    const styleConfig = {
      isToggleRadioButton: false,
      // radioButtonIndexs: [17, 21, 23, 24],
      radioButtonIndexs: [21, 23, 24, 25, 26, 27, 28],
      // radioButtonIndexs: ["不宜放出", "严重色情赌博流", "仿冒官方"],
      stringStrongColumnIndex: 5,
      styles: this.commonStyle,
    };

    this.configureAndApplyStyles(styleConfig);
  }

  /* 昵称任务 radioButton: {nth: text}

    {"1": "正常"},
    {"2": "低俗"},
    {"3": "赌博"},
    {"4": "其他"},
    {"5": "引流"},
    {"6": "引流-手机号"},
    {"7": "引流-微信号"},
    {"8": "引流-QQ号"},
    {"9": "引流-视频号、公众号、小程序"},
    {"10": "引流-竞品"},
    {"11": "引流-URl"},
    {"12": "引流-其他"},
    {"13": "辱骂"},
    {"14": "维权"},
    {"15": "宗教"},
    {"16": "不友善"},
    {"17": "低俗"},
    {"18": "无意义文本"},
    {"19": "涉政"},
    {"20": "黑灰产"},
    {"21": "不宜放出"},
    {"22": "隐私"},
    {"23": "严重色情赌博流"},
    {"24": "仿冒官方"},
    {"25": "不合规昵称"},
    {"26": "小语种"},
    {"27": "外链"},
    {"28": "售卖违禁品"}

  */

  // 昵称任务样式
  applyNicknameStyle() {
    const styleConfig = {
      isToggleRadioButton: true,
      radioButtonIndexs: [14, 16, 17, 18, 19, 20, 21, 22, 23, 28],
      stringStrongColumnIndex: 2,
      styles: this.nickNameStyle,
    };
    this.configureAndApplyStyles(styleConfig);
  }

  // mid: 8684 任务样式(隐藏按钮的切换)
  applyMid8684Style() {
    const styleConfig = {
      isToggleRadioButton: false,
      radioButtonIndexs: [17, 21, 23, 24],
      stringStrongColumnIndex: 3,
      styles: this.commonStyle,
    };

    this.configureAndApplyStyles(styleConfig);
    console.log("mid8684 style applied");
  }

  // 文本高亮样式
  applyStringStrongStyle(columnIndex) {
    const style = /*css*/ `
        ${this.baseSelector}.el-table__row > td:nth-child(${columnIndex}) > div > strong {
            background-color: yellow;
            color: black;
        }`;

    this.collectStyles(style);
  }
  //document.querySelector('div.container.hideSidebar * >.el-table__row > td:nth-child(5)')

  // 底部样式(提交按钮居中)
  applyFooterStyle() {
    const style = /*css*/ `${this.baseSelector}div.footer {
            display: flex;
            justify-content: center;
        }`;
    this.collectStyles(style);
  }

  // 标签单选按钮样式
  applyRadioButtonStyle(toggle = true, buttons = []) {
    this.toggleYinLiuRadioButton(toggle);

    if (buttons.length > 0) {
      this.hideRadioButtons(buttons);
    }
  }

  // 引流：YinLiu
  toggleYinLiuRadioButton(toggle = true) {
    const displayFor5 = toggle ? "inline-block" : "none"; // 当flag为true时，显示第5个，否则隐藏
    const displayForRange = toggle ? "none" : "inline-block"; // 当flag为true时，隐藏6到12，否则显示

    let style = /*css*/ `
  ${this.baseSelector}.el-radio-group > label:nth-child(5) {
      display: ${displayFor5};
  }
  ${this.baseSelector}.el-radio-group > label:nth-child(n+6):nth-child(-n+12) {
      display: ${displayForRange};
  
  }`;

    this.collectStyles(style);
  }



  async hideRadioButtons(buttons = []) {
    let style = "";

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const generateSelector = (indices) => {
      return (
        indices
          .map((index, i) => {
            return `${
              this.baseSelector
            }.el-radio-group > label:nth-child(${index})${
              i === indices.length - 1 ? "" : ",\n"
            }`;
          })
          .join("") + " {\n  display: none; \n}"
      );
    };

    if (buttons.every((item) => typeof item === "string")) {
      await delay(2000);

      const group = document.querySelector(".el-radio-group");
      const labels = Array.from(group.querySelectorAll("label"));
      console.log(labels);
      const selectedIndices = labels
        .map((label, index) =>
          buttons.includes(label.textContent.trim()) ? index + 1 : null
        )
        .filter((index) => index !== null);

      style = generateSelector(selectedIndices);
    } else if (buttons.every((item) => typeof item === "number")) {
      style = generateSelector(buttons);
    }
    // console.log(style);

    this.collectStyles(style);
  }

  // 选中单选按钮样式(背景颜色)
  applyRadioButtonsCheckedStyle() {
    const style = /*css*/ `
        ${this.baseSelector}.el-radio-group > label:not(:first-child).is-checked {        
          background-color: gold !important;
        }      
      `;
    this.collectStyles(style);
  }
  changeRadioButtonsCheckedStyle() {
    const styleConfig = {
      1: {
        // 正常
        backgroundColor: "#98FB98",
        labelColor: "#006400",
      },
      2: {
        // 低俗
        backgroundColor: "#FFA500",
        labelColor: "#505050",
      },
      5: {
        // 引流
        backgroundColor: "#FFFF00",
        labelColor: "#505050",
      },
      13: {
        // 辱骂
        backgroundColor: "#FF0000",
        labelColor: "#FFFFFF",
      },
      16: {
        // 不友善
        backgroundColor: "#8B5A00",
        labelColor: "#FFFFFF",
      },
    };

    const styles = Object.keys(styleConfig)
      .map((key) => {
        return `
        ${this.baseSelector}.el-radio-group > label:nth-child(${key}).is-checked {
          background-color: ${styleConfig[key].backgroundColor} !important;
        }
        ${this.baseSelector}.el-radio-group > label:nth-child(${key}).is-checked > .el-radio__label {
          color: ${styleConfig[key].labelColor} !important;
        }`;
      })
      .join("\n");

    // console.log(styles);

    this.collectStyles(styles);
  }

  // Method to apply border style
  applyBorderStyle() {
    const style = /*css*/ `${this.baseSelector}.el-table__cell {
              border: 1px solid #ebeef5;
          }`;
    this.collectStyles(style);
  }


}

// #endregion

// #region 提交相关功能

class SubmissionManager {
  constructor(missionManager, textHighlightManager, messageManager) {
    this.keyPressCount = 0;

    this.missionManager = missionManager;
    this.textHighlightManager = textHighlightManager;
    this.messageManager = messageManager;

    this.subButtonSelector = "div.footer > button";
    this.fristButtonSelector = "div.footer > button:nth-child(1)";
    this.submitContainerSelector = ".container.hideSidebar";
    this.monitorParentElement = document.querySelector(
      this.submitContainerSelector
    );

    this.initEventHandlers();
  }

  initEventHandlers() {
    this.preventDefaultActions();
    this.bindSubmitTriggers();
  }

  preventDefaultActions() {
    let timer = null;
    let countDownMessage = null;

    document.addEventListener("keydown", (event) => {
      if (event.key !== "c" || !event.ctrlKey) {
        event.preventDefault();
      }
      if (event.key === " ") {
        this.keyPressCount++;

        if (this.keyPressCount === 1) {
          timer = setTimeout(() => (this.keyPressCount = 0), 5000);

          countDownMessage = this.messageManager.countDown(
            "5秒内按下【space】键提交",
            5
          );
        }

        if (this.keyPressCount === 2) {
          this.submitClick();

          clearTimeout(timer);

          this.keyPressCount = 0;

          countDownMessage.stopCountDown();
        }
      }
    });

    document.oncontextmenu = (event) => {
      const selectedText = document.getSelection().toString();
      if (!selectedText) {
        event.preventDefault();
      }
    };
  }

  bindSubmitTriggers() {
    document.addEventListener("mousedown", (event) => {
      if (event.button === 2 && event.detail === 2) {
        this.submitClick();
      }
    });
  }

  submitClick() {
    elmGetter.get(this.fristButtonSelector).then((button) => {
      button.click();
      button.disabled = true;

      this.textHighlightManager.highlight.clear();
    });
  }

  submitEvent() {
    // 提交后页面会重载，使用elmGetter持续监听
    elmGetter.each(
      // "div.footer > button",
      this.subButtonSelector,
      // document.querySelector(this.submitContainerSelector),
      this.monitorParentElement,
      (button) => {
        button.addEventListener("click", () => {
          this.missionManager.updateSubmittedAmount();
        });
      }
    );
  }
}

// #endregion

// #region 标注信息相关功能

class MissionInfoManager {
  constructor() {
    this.missionInfo = null; // 初始时不创建元素
  }

  createMissionInfoElements() {
    const missionInfo = document.createElement("span");
    missionInfo.className = "mission_info";
    missionInfo.style.color = "#D2B48C";
    missionInfo.innerHTML = `
          <span>当前mid: <span class="mission-id">0000</span></span>
          <span style="padding-right: 20px;"></span>
          <span>当前标注: <span class="submitted-amount" data-initial-amount="0">0</span></span>
          <span style="padding-right: 100px;"></span>
      `;
    const insertionPoint = document.querySelector(".g-flex-end")?.firstChild;
    if (insertionPoint) {
      insertionPoint.insertAdjacentElement("afterend", missionInfo);
      this.missionInfo = missionInfo; // 保存创建的元素引用
      return missionInfo;
    } else {
      console.error("插入点未找到，可能当前页面不是'label'页面。");
      return null;
    }
  }

  ensureMissionInfoElements() {
    if (!this.missionInfo) {
      return this.createMissionInfoElements();
    }
    return this.missionInfo;
  }

  updateMissionInfo(mid, amount) {
    if (!this.ensureMissionInfoElements()) return; // 确保元素已创建

    const midElement = this.missionInfo.querySelector(".mission-id");
    const amountElement = this.missionInfo.querySelector(".submitted-amount");
    midElement.textContent = mid;
    amountElement.dataset.initialAmount = amount;
  }

  updateSubmittedAmount() {
    if (!this.ensureMissionInfoElements()) return; // 确保元素已创建

    const amountElement = this.missionInfo.querySelector(".submitted-amount");
    const initialAmount = parseInt(amountElement.dataset.initialAmount, 10);
    const currentAmount = parseInt(amountElement.textContent, 10);
    amountElement.textContent = currentAmount + initialAmount;
  }

  toggleDisplay(show = true) {
    if (!this.ensureMissionInfoElements()) return; // 确保元素已创建

    this.missionInfo.style.display = show ? "block" : "none";
  }

  handleMissionInfo(missionConfig, missionId) {
    if (!this.ensureMissionInfoElements()) return; // 确保元素已创建

    const { amount } = missionConfig[missionId] || missionConfig.default;
    this.updateMissionInfo(missionId, amount);
    this.toggleDisplay(true);
  }
}

// #endregion

// #region 禁止词汇和昵称校验相关功能

// 定义用于处理禁止词汇和昵称校验的工具函数
const textUtils = {
  calculateByteLength(str) {
    let byteLength = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charAt(i);
      if (
        /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(char + (str.charAt(i + 1) || ""))
      ) {
        byteLength += 4;
        i++; // 跳过扩展字符的第二个部分
      } else {
        byteLength += /[^\x00-\xff]/.test(char) ? 2 : 1;
      }
    }
    return byteLength;
  },

  containsSensitiveWord(nickName) {
    const sensitiveWords = ["卐", "卍", ".com", ".cn"];
    return sensitiveWords.some((word) => nickName.includes(word));
  },

  isValidNickName(nickName) {
    if (typeof nickName !== "string" || !nickName.trim()) {
      return "empty"; // 对空白文本返回特定标记
    }

    const byteLength = this.calculateByteLength(nickName);
    const spaceCount = (nickName.match(/ /g) || []).length;
    const containsValidChars =
      /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0030-\u0039a-zA-Z]/.test(
        nickName
      );
    const containsPhoneNumber = /(^\+86)?[1][3456789][0-9]{9}$/.test(
      nickName.replace(/[^0-9\+]/gi, "")
    );

    if (this.containsSensitiveWord(nickName)) {
      return "sensitive"; // 敏感词汇检查
    }

    // return (
    //   byteLength <= 16 &&
    //   spaceCount < 4 &&
    //   containsValidChars &&
    //   !containsPhoneNumber
    // );

    if (
      byteLength > 16 ||
      spaceCount >= 4 ||
      !containsValidChars ||
      containsPhoneNumber
    )
      return "incompatible";
  },

  highlightLimitWords(limitMap, text) {
    limitMap.forEach((value, key) => {
      if (value instanceof Map) {
        // 递归处理嵌套的Map
        text = this.highlightLimitWords(value, text);
      } else if (value.pattern instanceof RegExp) {
        // 应用正则表达式高亮
        text = text.replace(value.pattern, "<strong>$&</strong>");
      }
    });

    return text;
  },
};

class ContentManager {
  constructor(limitWords, styleManager, textHighlightManager) {
    this.limitWords = limitWords; // 初始化禁止词汇表
    this.styleManager = styleManager;
    this.textHighlightManager = textHighlightManager;
  }

  async updateContentBasedOnTask() {
    // const desc = await elmGetter.get(".desc > pre");
    // console.log(desc);

    // if (!desc) return;


    // const taskName = desc.textContent.trim();
    // this.applyStylesBasedOnTask(taskName);

    const taskName = getSelectedMissionName();
    console.log("taskName", taskName);
    this.applyStylesBasedOnTask(taskName);

    const containerElement = document.querySelector(
      "div.container.hideSidebar"
    );
    if (!containerElement) return;

    if (taskName.includes("昵称折叠策略")) {
      this.validateNicknames(containerElement);
    } else {
      this.processForbiddenWords(taskName, containerElement);
    }
  }

  applyStylesBasedOnTask(taskName) {
    if (taskName.includes("昵称折叠策略")) {
      this.styleManager.applyNicknameStyle();
    } else if (taskName.includes("引流策略")) {
      this.styleManager.applyMid8684Style();
    } else {
      this.styleManager.applyCommonStyle();
      console.log("common style applied");
    }
  }

  validateNicknames(containerElement) {
    elmGetter.each(
      ".el-table__row > td:nth-child(4) > div",
      containerElement,
      (element) => {
        const validation = textUtils.isValidNickName(
          element.textContent.trim()
        );
        this.updateNicknameElement(element, validation);
      }
    );
  }


  processForbiddenWords(taskName, containerElement) {
    this.setLimitWordsBasedOnTask(taskName);

    elmGetter.each(
      ".el-table__row > td:nth-child(5) > div",
      containerElement,
      (element) => {
        this.addNumberPhonePattern(element.textContent, this.limitWords);

        const rangeOffsets = this.textHighlightManager.calculateRangeOffsets(
          element.textContent,
          this.limitWords
        );

        // console.log("rangeOffsets", rangeOffsets);

        if (!rangeOffsets.length) return;

        this.textHighlightManager.textHighlighter.addHighlightToText(
          element,
          rangeOffsets
        );
      }
    );
  }

  setLimitWordsBasedOnTask(taskName) {
    if (taskName.includes("直播预告") || taskName.includes("上墙")) {
      this.limitWords.set("诱导文本", {
        pattern:
          /好友|朋友|已有|已预约|\+人|万人|万\+|人预约|微信|加群|入群|企微/,
      });
    }
    if (taskName.includes("政务") || taskName.includes("新闻")) {
      this.limitWords.set("表情", {
        pattern:
          /\[傲慢]|\[白眼]|\[凋谢]|\[尴尬]|\[裂开]|\[难过]|\[敲打]|\[衰]|\[猪头]|\[旺柴]/,
      });
      this.limitWords.set("政务·不友善", {
        pattern: /牛逼|卡|声音|杂音|打广告|录播/,
      });
    }
  }


  updateNicknameElement(element, validation) {
    const styles = {
      empty: {
        textContent: "nickname cannot be empty!",
        backgroundColor: "red",
      },
      sensitive: { color: "red" },
      incompatible: { backgroundColor: "yellow" },
    };

    const labelText = "不合规昵称";

    const style = styles[validation];
    if (style) {
      Object.assign(element.style, style);
      this.autoSelectLabelForIncorrectNickname(element, labelText);
    }
  }

  autoSelectLabelForIncorrectNickname(nickNameElement, buttonText) {
    elmGetter.each(
      ".el-radio-group > label",
      nickNameElement
        .closest(".el-table__row")
        .querySelector(".el-radio-group"),
      (label) => {
        if (label.textContent.trim() === buttonText) {
          const radioButton = label.querySelector("input[type='radio']");
          if (radioButton) {
            radioButton.checked = true;
            radioButton.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    );
  }

  addNumberPhonePattern(text, keywordMap) {
    const phoneNumberRegex = /^(?:\+86)?1[3456789]\d{9}$/;

    if (phoneNumberRegex.test(text)) {
      keywordMap.set("phoneNumber", { pattern: phoneNumberRegex });
    } else {
      const phoneNumbers = text.match(/\d+/g);
      const isPhoneNumber = /^(?:\+86)?1[3456789]\d{9}$/.test(
        phoneNumbers?.join("")
      );

      if (!isPhoneNumber) return;

      const phoneNumberPattern = new RegExp(phoneNumbers.join("|"), "g");
      keywordMap.set("phoneNumber", { pattern: phoneNumberPattern });
    }
  }


}

class TextHighlightManager {
  static HighlightConfiguration = class {
    constructor() {
      this.configurationName = "highlight-default";
      this.configurationProperties = {
        color: "black",
        "background-color": "yellow",
        "text-decoration": "",
        "text-shadow": "",
      };
    }

    setName(name) {
      if (name) this.configurationName = name;
      return this; // Enable method chaining
    }

    setColor(color) {
      if (color) this.configurationProperties.color = color;
      return this; // Enable method chaining
    }

    setBackgroundColor(backgroundColor) {
      if (backgroundColor)
        this.configurationProperties["background-color"] = backgroundColor;
      return this; // Enable method chaining
    }

    setTextDecoration(textDecoration) {
      if (textDecoration)
        this.configurationProperties["text-decoration"] = textDecoration;
      return this; // Enable method chaining
    }

    setTextShadow(textShadow) {
      if (textShadow) this.configurationProperties["text-shadow"] = textShadow;
      return this; // Enable method chaining
    }

    generateConfigurationAttributes() {
      return Object.entries(this.configurationProperties)
        .filter(([_, value]) => value)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join("\n");
    }

    generateConfiguration() {
      if (!this.configurationName) {
        throw new Error("Style name must be set before generating the style.");
      }
      const configAttributes = this.generateConfigurationAttributes();
      return `::highlight(${this.configurationName}) {\n${configAttributes}\n}`;
    }
  };
  static TextHighlighter = class {
    constructor(highlight, highlightConfiguration) {
      this.highlight = highlight;
      this.highlightConfiguration = highlightConfiguration;
    }

    applyHighlightConfiguration() {
      const style = document.createElement("style");
      style.textContent = this.highlightConfiguration.generateConfiguration();
      document.head.appendChild(style);
      return this;
    }

    createRange(element, start, end) {
      if (!element) console.error("Element is required to create a range.");
      const range = new Range();
      range.setStart(element.firstChild, start);
      range.setEnd(element.firstChild, end);
      return range;
    }

    createRangesFromOffsets(element, rangeOffsets) {
      const ranges = rangeOffsets.map((offset) =>
        this.createRange(element, offset.start, offset.end)
      );
      ranges.forEach((range) => this.highlight.add(range));
      return this;
    }

    addHighlightToText(element, rangeOffsets) {
      this.createRangesFromOffsets(element, rangeOffsets);
    }

    registerHighlightConfiguration() {
      this.applyHighlightConfiguration();
      CSS.highlights.set(
        this.highlightConfiguration.configurationName,
        this.highlight
      );
    }
  };

  constructor() {
    this.highlight = new Highlight();
    this.highlightConfiguration = new this.constructor.HighlightConfiguration();
    this.textHighlighter = new this.constructor.TextHighlighter(
      this.highlight,
      this.highlightConfiguration
    );
    this.textHighlighter.registerHighlightConfiguration();
  }

  static generateOffsets(match) {
    return { start: match.index, end: match.index + match[0].length };
  }

  static calculateRangeOffset(text, pattern) {
    const matches = pattern.global
      ? text.matchAll(pattern)
      : [text.match(pattern)];

    return Array.from(matches).flatMap((match) =>
      match ? this.generateOffsets(match) : []
    );
  }

  calculateRangeOffsets(text, keywordMap) {
    const rangeOffsets = [];
    keywordMap.forEach((value, key) => {
      if (value instanceof Map) {
        const nestedRangeOffsets = this.calculateRangeOffsets(text, value);
        rangeOffsets.push(...nestedRangeOffsets);
      } else if (value.pattern instanceof RegExp) {
        const rangeOffset = this.constructor.calculateRangeOffset(
          text,
          value.pattern
        );
        if (rangeOffset.length > 0) {
          rangeOffsets.push(...rangeOffset);
        }
      }
    });
    return rangeOffsets;
  }
}

// #endregion

// My Message 实现类似this.$message的效果
class MessageManager {
  constructor() {
    this.container = document.createElement("div");
    this.container.id = "messageContainer";
    this.applyStyles(this.container, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "9999",
    });
    document.body.appendChild(this.container);
    this.icons = {
      tick: {
        color: "green",
        svg: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.2l-3.6-3.6c-.8-.8-.8-2 0-2.8s2-.8 2.8 0L9 11.6l6.2-6.2c.8-.8 2-.8 2.8 0s.8 2 0 2.8L11.8 16.2c-.4.4-.8.6-1.3.6-.5 0-.9-.2-1.3-.6z" fill="white"></path></svg>',
      },
      warning: {
        color: "yellow",
        svg: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2c.6 0 1 .4 1 1v10.5c0 .6-.4 1-1 1-.6 0-1-.4-1-1V3c0-.6.4-1 1-1zm1 15.5c0-.3-.2-.5-.5-.5s-.5.2-.5.5V19c0 .3.2.5.5.5s.5-.2.5-.5v-1.5z" fill="black"></path></svg>',
      },
      info: {
        color: "grey",
        svg: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8zm-1 10h2v2h-2v-2zm0-8h2v6h-2V6z"/></svg>',
      },
    };
  }

  applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  createIcon(type) {
    const { color, svg } = this.icons[type] || {};
    const icon = document.createElement("span");
    this.applyStyles(icon, {
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      marginRight: "10px",
      backgroundColor: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    icon.innerHTML = svg;
    return icon;
  }

  showMessage(message, type = "info", duration = 3000) {
    const messageElement = document.createElement("p");
    this.applyStyles(messageElement, {
      margin: "10px",
      padding: "10px",
      backgroundColor: "#f5f5f5",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
    });
    const icon = this.createIcon(type);
    messageElement.appendChild(icon);
    messageElement.appendChild(document.createTextNode(message));
    this.container.appendChild(messageElement);
    setTimeout(() => this.container.removeChild(messageElement), duration);
    return messageElement; // Return the message element for further use
  }

  countDown(message, duration) {
    let secondsRemaining = duration;
    const messageElement = document.createElement("p");

    this.applyStyles(messageElement, {
      margin: "5px",
      padding: "5px",
      backgroundColor: "#f5f5f5",
      borderRadius: "5px",
      display: "flex",
      alignItems: "center",
    });

    const icon = document.createElement("span");
    this.applyStyles(icon, {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#F8C471",
      color: "white",
      marginRight: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    icon.textContent = secondsRemaining;
    messageElement.appendChild(icon);
    messageElement.appendChild(document.createTextNode(message));
    this.container.appendChild(messageElement);

    const intervalId = setInterval(() => {
      secondsRemaining -= 1;
      icon.textContent = secondsRemaining;
      if (secondsRemaining <= 0) {
        clearInterval(intervalId);
        this.container.removeChild(messageElement);
      }
    }, 1000);
    // Adding a method to stop the countdown.
    messageElement.stopCountDown = () => {
      clearInterval(intervalId);
      this.container.removeChild(messageElement);
    };
    return messageElement;
  }
}

(function () {
  "use strict";

  const limitWords = new Map([
    // ["test", { pattern: /520/ }],
    [
      "引流",
      new Map([
        // ["手机号码", { pattern: /1[3-9]\d{9}/g }],
        ["普通", { pattern: /扫码|进群|找我|微信转|公众号|小程序/ }],
        [
          "恶意",
          {
            pattern:
              /(加)(v|V|威|微|薇|徽|lv)|(\+)(v|V|威|微|薇|徽)|迦V|(➕)(v|V|威|微|薇)/,
          },
        ],
        ["竞品", { pattern: /抖音|快手|小红书|淘宝|京东|拼多多|b站/ }],
        [
          "URL",
          { pattern: /http|https|www|com|cn|com.cn|net|org|edu|gov|xn--/ },
        ],
        [
          "其他",
          { pattern: /搬砖|手柄下载|乱斗手游|搬换米|隐藏助力|装备回收/ },
        ],
      ]),
    ],
    [
      "辱骂",
      new Map([
        ["part1", { pattern: /(傻)(逼|比|子|狗|蛋|瓜|吊|叼|屌|缺|刁|批|帽)/ }],
        ["part2", { pattern: /笨|蠢|逼|(s|2)(b|B)|(S|2)(b|B)/ }],
        [
          "part3",
          {
            pattern:
              /脑残|脑瘫|沙雕|废物|去死|草拟|操|你妹|你妈|尼玛|畜(生|牲)|杂种|弱智|禽兽|渣男|渣女/,
          },
        ],
        [
          "part4",
          {
            pattern:
              /俄杂|俄狗|个狗|狗东西|鬼子|汉奸|垃圾|杂碎|砸碎|傻叉|傻波一|纱笔|智障|沙币|叼毛|mlgb|屌毛/,
          },
        ],
        [
          "part5",
          {
            pattern: /麻痹|有病|神经|煞笔|王八(蛋|旦)|太监|人渣|饭桶|屌丝|婊子/,
          },
        ],
        [
          "part6",
          {
            pattern: /(f|F)(u|U)(c|C)(k|K)/,
          },
        ],
        [
          "part7",
          { pattern: /(你|他|她|它)(娘|妈|爸|爹|大爷|妹)|踏马|(t|T)(m|M)/ },
        ],
      ]),
    ],
    [
      "不友善",
      new Map([
        [
          "part1",
          {
            pattern:
              /骗子|骗人|诈骗|滚|(胡|瞎|乱)(说)|(我)(艹|操|擦|日|丢|去|靠)|坏|特么/,
          },
        ],
        [
          "part2",
          {
            pattern:
              /(好|很|太)(假)|假的|恶心|故意|什么鬼|个鬼|墨迹|啰嗦|废话|费话|难看/,
          },
        ],
        [
          "part3",
          {
            pattern:
              /是托|个托|难听|不好听|魔怔|啥也不是|个屁|放屁|狗屁|毛线|过分|急眼/,
          },
        ],
        [
          "part4",
          {
            pattern:
              /没意思|打脸|磨叽|(吹)(牛|牛逼|牛皮|牛批)|可笑|浪费|欺骗|撒谎|忽悠|拉跨|邪恶/,
          },
        ],
        [
          "part5",
          {
            pattern:
              /闭嘴|举报|太菜|好菜|菜鸟|讨厌|母老虎|耍横|丢人|卧槽|又当又立|造谣|话太多/,
          },
        ],
        [
          "part6",
          {
            pattern:
              /卑鄙|无耻|丑|看不起|误导|无知|窝囊废|耍猴|失望|败家|洗脑|噱头|不公平/,
          },
        ],
        [
          "part7",
          {
            pattern:
              /没人管|没人理|个嘚|胡扯|套路|扯淡|上当|受骗|负能量|小人|二百五|250|狠人|没排面|没主见|凉凉/,
          },
        ],
        [
          "part8",
          {
            pattern:
              /玩不起|拉倒|不要脸|无良|白活|个球|锤子|不专业|烦人|智商税|韭菜|疯子|说瞎话|尴尬|好尬|事多|事儿多|不好看|鬼才信/,
          },
        ],
        [
          "part9",
          {
            pattern:
              /口嗨|有点假|小心眼|暴揍|糊涂|不尊重|蹭流量|鸡毛|看不惯|笑话|哟西|嫉妒|水军|太差|鄙视|不靠谱|耍赖|解散|莽夫|黑哨/,
          },
        ],
        [
          "成语类",
          {
            pattern:
              /一丘之貉|恬不知耻|自讨没趣|自以为是|崇洋媚外|一派胡言|胡言乱语|欺软怕硬|自作多情|口是心非|吃里扒外|见钱眼开|挑拨离间/,
          },
        ],
      ]),
    ],
    [
      "黑灰产",
      {
        pattern: /占榜|战榜|暖场|代打/,
      },
    ],
    [
      "其他",
      {
        pattern: /(打|揍|干|弄|盘)(你|他|她|架)|金瓶梅|潘金莲|马化腾/,
      },
    ],
    [
      "低俗",
      new Map([
        [
          "身体部位",
          {
            pattern:
              /屄|尻|小穴|胸|乳房|奶子|奶晕|奶头|屁股|臀|腰|肚脐|肚子|嘴|舌头|腿|脚|(j|J)(b|B)|(鸡|几)(巴)|鸡儿|唧唧|鸡鸡|寄吧|(阴)(道|部)|腋(窝|毛|下)|前凸后翘|骚/,
          },
        ],
        [
          "性行为类",
          {
            pattern: /口活|老汉推车|观音坐莲|69式|跳蛋|日比|车震|肏/,
          },
        ],
        [
          "恶俗类",
          {
            pattern: /屎|屁|尿/,
          },
        ],
        [
          "衣物类",
          {
            pattern:
              /(丁字|内|三角)(裤)|裤衩|(奶|胸|罩)(罩)|内衣|(黑|白)丝|丝袜/,
          },
        ],
        [
          "隐晦类",
          {
            pattern:
              /鲍鱼|馒头|包子|(两)(个|座)(山|大山|山峰)|葡萄|(18|20|22)(cm|CM|厘米)|磨豆腐|湿了|车库|吹箫|活好|香蕉|大棒|床上功夫/,
          },
        ],
        [
          "侮辱类",
          {
            pattern:
              /鸡婆|做鸡|做鸭|站街|妓女|老鸨|舞女|骚货|荡妇|淫娃|卖淫|淫货|龟公|淫荡|骚妞/,
          },
        ],
        [
          "行为类",
          {
            pattern:
              /(亲)(亲|吻|你|一下|一个)|舔|洞房|开房|做爱|爱爱|摸你|扭跨|扭腰|撸管|导管|炉管|打飞机|裸奔|撩骚|日批|嫖娼|接吻|娇喘|吃奶|呻吟/,
          },
        ],
        ["身份类", { pattern: /少妇|熟妇|人妻|处女|处男|嫖客|炮友/ }],
        ["舞蹈类", { pattern: /钢管舞|后背摇/ }],
        [
          "其他类",
          {
            pattern:
              /没穿|发情|骚气|春宫图|爆菊|18摸|包养|聊骚|性欲|性生活|日一下|双飞|舌吻|招嫖|七次郎|排卵/,
          },
        ],
      ]),
    ],
    [
      "宗教",
      {
        pattern: /佛|禅|菩萨|上帝|耶稣|风水|算命|易经|八卦|卐|卍/,
      },
    ],
    [
      "涉政",
      {
        pattern:
          /台独|港独|藏独|日本|美国|乌克兰|台湾|以色列|习近平|胡锦涛|贪官|贪腐|腐败|下台|不作为/,
      },
    ],
    [
      "表情",
      {
        pattern:
          /\[鄙视]|\[闭嘴]|\[便便]|\[打脸]|\[发怒]|\[撇嘴]|\[弱]|\[失望]|\[吐]|\[咒骂]|\[抓狂]|\[翻白眼]/,
      },
    ],
  ]);

  const assignments = {
    // 8727: { mid: 8727, amount: 50, modifiedAmount: 12 },
    // 8737: { mid: 8737, amount: 50, modifiedAmount: 34 },
    8690: { mid: 8690, amount: 10, modifiedAmount: 50 },
    // 8687: { mid: 8687, amount: 50, modifiedAmount: 17 },
  };

  const missionConfig = {
    default: {
      mid: null,
      amount: 50,
    },
    8649: {
      mid: 8649,
      amount: 10,
    },
    8684: {
      mid: 8684,
      amount: 10,
    },
    8685: {
      mid: 8685,
      amount: 10,
    },
    8689: {
      mid: 8689,
      amount: 10,
    },
    // 8690: {
    //   mid: 8690,
    //   amount: 10,
    // },
    8736: {
      mid: 8736,
      amount: 10,
    },
  };

  // 实例化并使用

  // const appManager = new AppManager(limitWords, assignments, missionConfig);
  // appManager.init();

  // Initialize the MultiTaskManager
  const multiTaskManager = new MultiTaskManager(limitWords, assignments, missionConfig);
  multiTaskManager.init();

  // function getButtonInfo() {
  //   const group = document.querySelector(".el-radio-group");
  //   const labels = group.querySelectorAll("label");

  //   const buttonInfo = Array.from(labels).map((label, index) => {
  //     return {
  //       [index+1]: label.textContent.trim(),
  //     };
  //   });

  //   console.log(buttonInfo);
  // }
  // getButtonInfo();
})();
