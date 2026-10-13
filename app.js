/* 驾考通 · 精选题库刷题
   模式：practice(顺序练习 500题) / exam(随机模考 每次纯随机抽100题·100分制) / review(错题复习) */
(function () {
  "use strict";
  var DATA = window.APP_DATA;
  var $ = function (id) { return document.getElementById(id); };

  var EXAM_N = 100;      // 模考抽题数
  var PASS_LINE = 90;    // 及格线
  var EXAM_TIME = 100 * 60; // 模考限时（秒）：100 分钟，时间到自动交卷

  var S = {
    sub: null,        // '1' | '4'
    mode: "practice", // 'practice' | 'exam' | 'review'
    list: [],
    idx: 0,
    selected: {},     // id -> 已选键（字符串，多选可多字符）
    answered: {},     // id -> true/false（答对/答错）
    correct: 0,
    wrong: 0,
    deadline: 0,      // 模考截止时间戳（ms），以时间戳为准，切后台回来也准
    timeLeft: 0,      // 剩余秒数（展示与测试用）
    timeUp: false,    // 是否因"时间到"自动交卷
    timerId: null,
  };

  function wrongKey(sub) { return "jk_wrong_" + sub; }
  function getWrong(sub) {
    try { return JSON.parse(localStorage.getItem(wrongKey(sub)) || "[]"); }
    catch (e) { return []; }
  }
  function setWrong(sub, arr) { localStorage.setItem(wrongKey(sub), JSON.stringify(arr)); }
  function addWrong(sub, id) {
    var a = getWrong(sub); if (a.indexOf(id) < 0) { a.push(id); setWrong(sub, a); }
  }
  function removeWrong(sub, id) {
    var a = getWrong(sub); var i = a.indexOf(id); if (i >= 0) { a.splice(i, 1); setWrong(sub, a); }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function typeClass(t) { return t === "多选" ? "multi" : (t === "判断" ? "judge" : "single"); }
  /* 是否多选题。
     注意：题库里 type 是中文字段（"单选"/"判断"/"多选"），
     不能拿英文 "multiple" 去比 —— 那样多选题会被当成单选，点一下就直接判错。
     这里以「答案是否多于一个字母」为准，最可靠，同时兼容两种写法。 */
  function isMulti(q) {
    if (!q) return false;
    if (q.type === "多选" || q.type === "multiple") return true;
    return String(q.answer || "").length > 1;
  }

  function show(view) {
    ["home", "quiz", "end"].forEach(function (v) {
      $(v).classList.toggle("hidden", v !== view);
    });
  }

  /* 纯随机洗牌（Fisher–Yates） */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function idsKey(list) {
    return list.map(function (q) { return q.id; }).sort(function (a, b) { return a - b; }).join(",");
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    stopTimer();                       // 离开模考务必停表
    $("wrong1").textContent = "错题 " + getWrong("1").length;
    $("wrong4").textContent = "错题 " + getWrong("4").length;
    show("home");
  }

  /* ---------- 开始 ---------- */
  function subName(sub) { return sub === "1" ? "科目一" : "科目四"; }

  function startPractice(sub) {
    S.sub = sub; S.mode = "practice";
    S.list = DATA[sub].slice();
    resetRun();
    $("quizTitle").textContent = subName(sub);
    $("qTotal").textContent = S.list.length;
    show("quiz"); render();
  }

  /* 随机模考：每次进入从本学科题库纯随机抽 EXAM_N 题（并保证与上一次不重复） */
  function startExam(sub) {
    S.sub = sub; S.mode = "exam";
    var pool = DATA[sub].slice();
    var n = Math.min(EXAM_N, pool.length);
    var picked = shuffle(pool).slice(0, n);
    var key = idsKey(picked);
    try {
      var lastKey = "jk_last_exam_" + sub;
      if (localStorage.getItem(lastKey) === key) {      // 极小概率完全相同 → 重抽一次
        picked = shuffle(pool).slice(0, n);
        key = idsKey(picked);
      }
      localStorage.setItem(lastKey, key);
    } catch (e) { /* 隐私模式等忽略 */ }
    S.list = picked;
    resetRun();
    startTimer();     // 模考限时 100 分钟，时间到自动交卷
    $("quizTitle").textContent = subName(sub) + " · 随机模考";
    $("qTotal").textContent = S.list.length;
    show("quiz"); render();
  }

  function startReview(sub) {
    var ids = getWrong(sub);
    if (!ids.length) { alert("这一科暂时没有错题，去练练题吧～"); return; }
    S.sub = sub; S.mode = "review";
    S.list = DATA[sub].filter(function (q) { return ids.indexOf(q.id) >= 0; });
    resetRun();
    $("quizTitle").textContent = subName(sub) + " · 错题复习";
    $("qTotal").textContent = S.list.length;
    show("quiz"); render();
  }

  function resetRun() {
    S.idx = 0; S.selected = {}; S.answered = {}; S.correct = 0; S.wrong = 0;
    S.justAnswered = false;
    S.timeUp = false;
  }

  /* ---------- 模考倒计时（100 分钟） ----------
     以「截止时间戳」为准而非累加，页面切到后台被浏览器节流后回来依然准确。
     时间归零 → 立即结束考试，按当前成绩计分（未作答的题不扣分）。 */
  function startTimer() {
    stopTimer();
    S.timeUp = false;
    S.deadline = Date.now() + EXAM_TIME * 1000;
    tickTimer();
    S.timerId = setInterval(tickTimer, 250);
  }
  function stopTimer() {
    if (S.timerId) { clearInterval(S.timerId); S.timerId = null; }
  }
  function tickTimer() {
    var left = Math.max(0, Math.round((S.deadline - Date.now()) / 1000));
    S.timeLeft = left;
    updateTimerUI();
    if (left <= 0) {
      stopTimer();
      S.timeUp = true;
      endScreen();          // 时间到：不管做到第几题，直接交卷
    }
  }
  function updateTimerUI() {
    var el = $("sbTime");
    if (!el) return;
    var m = Math.floor(S.timeLeft / 60), sec = S.timeLeft % 60;
    el.textContent = (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
    var box = $("sbTimeBox");
    if (box) {
      box.classList.toggle("warn", S.timeLeft <= 300 && S.timeLeft > 60);   // 最后 5 分钟
      box.classList.toggle("danger", S.timeLeft <= 60);                     // 最后 1 分钟
    }
  }

  /* 当前得分（100 分制）：错 1 题扣 1 分 */
  function currentScore() {
    var total = S.list.length;
    if (!total) return 100;
    return Math.round((total - S.wrong) / total * 100);
  }

  /* ---------- 渲染题目 ---------- */
  function render() {
    var q = S.list[S.idx];
    if (!q) { return; }
    var card = $("qcard");
    card.innerHTML = "";

    var t = document.createElement("span");
    t.className = "q-type " + typeClass(q.type);
    t.textContent = q.type;
    card.appendChild(t);

    var qt = document.createElement("p");
    qt.className = "q-text";
    qt.innerHTML = escapeHtml(q.question);
    card.appendChild(qt);

    if (q.image) {
      var img = document.createElement("img");
      img.className = "q-img";
      img.src = q.image;
      img.alt = "题目配图";
      img.loading = "lazy";
      card.appendChild(img);
    }

    var opts = document.createElement("div");
    opts.className = "options";
    var answered = S.answered[q.id] != null;
    var sel = S.selected[q.id] || "";
    q.options.forEach(function (o) {
      var el = document.createElement("div");
      el.className = "opt";
      el.dataset.key = o.key;
      // 答后：正确项圆圈换 ✓，选错项换 ✗，其余保持字母
      // 多选题的正确答案是多个字母，必须用「包含」判断，不能直接相等
      var isCorrect = answered && String(q.answer).indexOf(o.key) >= 0;
      var isWrong = answered && !isCorrect && sel.indexOf(o.key) >= 0;
      if (!answered && sel.indexOf(o.key) >= 0) el.classList.add("selected");
      if (answered) {
        el.classList.add("locked");
        if (isCorrect) el.classList.add("correct");
        else if (isWrong) el.classList.add("wrong");
      }
      // 答后：正确项圆圈换 ✓，选错项换 ✗，其余保持字母
      var kTxt = o.key;
      if (isCorrect) kTxt = "✓";
      else if (isWrong) kTxt = "✗";
      el.innerHTML = '<div class="k">' + kTxt + '</div><div class="v">' + escapeHtml(o.text) + '</div>';
      el.onclick = function () { onPick(o.key); };
      opts.appendChild(el);
    });
    card.appendChild(opts);

    // 多选：未作答时显示「确认答案」
    if (isMulti(q) && !answered && sel.length > 0) {
      var cf = document.createElement("button");
      cf.className = "confirm-btn";
      cf.textContent = "确认答案";
      cf.onclick = confirmMultiple;
      card.appendChild(cf);
    }

    // 已作答：弹出「答案 + 解析」卡片
    if (answered) {
      var ex = document.createElement("div");
      ex.className = "explain";
      var ok = S.answered[q.id];
      ex.innerHTML =
        '<div class="ans-head">答案 <b>' + q.answer + "</b>" +
        '<span class="res ' + (ok ? "ok" : "err") + '">' + (ok ? "✓ 回答正确" : "✗ 回答错误") + "</span></div>" +
        '<div class="exp-body"><span class="lbl">解析</span>' +
        escapeHtml(q.explanation || "（暂无解析）") + "</div>";
      card.appendChild(ex);
      if (S.justAnswered) {
        S.justAnswered = false;
        setTimeout(function () { ex.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 60);
      }
    }

    // 进度
    $("qIdx").textContent = S.idx + 1;
    $("progBar").style.width = ((S.idx + 1) / S.list.length * 100) + "%";

    // 导航按钮状态
    $("btnPrev").disabled = S.idx === 0;
    $("btnNext").textContent = S.idx === S.list.length - 1 ? "完成" : "下一题";
    $("btnNext").disabled = !answered;

    // 模考计分条
    renderScoreBar();
  }

  function renderScoreBar() {
    var bar = $("scoreBar");
    if (!bar) return;
    if (S.mode !== "exam") { bar.classList.add("hidden"); return; }
    bar.classList.remove("hidden");
    var done = Object.keys(S.answered).length;
    $("curScore").textContent = currentScore();
    $("sbDone").textContent = done;
    $("sbTotal").textContent = S.list.length;
    $("sbWrong").textContent = S.wrong;
    updateTimerUI();
  }

  /* ---------- 交互 ---------- */
  function onPick(key) {
    var q = S.list[S.idx];
    if (S.answered[q.id] != null) return; // 已作答锁定
    if (isMulti(q)) {
      var sel = S.selected[q.id] || "";
      sel = sel.indexOf(key) >= 0 ? sel.replace(key, "") : sel + key;
      S.selected[q.id] = sel;
      render(); // 重新渲染以显示勾选 + 确认按钮
    } else {
      S.selected[q.id] = key;
      judge(q);
    }
  }
  function confirmMultiple() {
    var q = S.list[S.idx];
    if (S.answered[q.id] != null) return;
    if (!(S.selected[q.id] || "").length) return;
    judge(q);
  }
  function judge(q) {
    var picked = (S.selected[q.id] || "").split("").sort().join("");
    var ans = q.answer.split("").sort().join("");
    var ok = picked === ans;
    S.answered[q.id] = ok;
    if (ok) {
      S.correct++;
      if (S.mode === "review") removeWrong(S.sub, q.id); // 复习答对即清零
    } else {
      S.wrong++;
      addWrong(S.sub, q.id);  // 错题入本（练习/模考/复习一致）
    }
    S.justAnswered = true; // 本次刚作答：渲染后把解析卡片滚入视野
    render();
  }

  function next() {
    var q = S.list[S.idx];
    if (S.answered[q.id] == null) { alert("请先选择答案"); return; }
    if (S.idx >= S.list.length - 1) { endScreen(); return; }
    S.idx++; render();
    window.scrollTo(0, 0);
  }
  function prev() {
    if (S.idx === 0) return;
    S.idx--; render();
    window.scrollTo(0, 0);
  }

  /* ---------- 结束页 ---------- */
  function endScreen() {
    stopTimer();                       // 结束即停表（正常做完 / 时间到 都会走这里）
    var total = S.list.length;
    var rate = total ? Math.round(S.correct / total * 100) : 0;
    var ring = document.querySelector(".score-ring");

    if (S.mode === "exam") {
      var score = currentScore();
      ring.style.setProperty("--p", score + "%");
      var color = score >= PASS_LINE ? "#14a44d" : (score >= 60 ? "#d97706" : "#e5484d");
      ring.style.setProperty("--ring-c", color);
      if (S.timeUp) {
        // 时间到自动交卷：按当前成绩计分，未作答的题不扣分
        $("endEmoji").textContent = "⏰";
        $("endTitle").textContent = "时间到 · 自动交卷";
      } else {
        $("endEmoji").textContent = score >= PASS_LINE ? "🏆" : (score >= 60 ? "💪" : "📖");
        $("endTitle").textContent = "模考结束";
      }
      $("endRate").textContent = score + "分";
      $("endRateLbl").textContent = "本次得分";
      var pass = $("endPass");
      pass.className = "end-pass " + (score >= PASS_LINE ? "ok" : "err");
      var passTxt = score >= PASS_LINE
        ? "✓ 已达合格线（" + PASS_LINE + " 分）"
        : "✗ 未达合格线（" + PASS_LINE + " 分），再练练！";
      if (S.timeUp) {
        var un = total - Object.keys(S.answered).length;
        passTxt = "⏰ 100 分钟已到，按当前成绩交卷" + (un > 0 ? "（未作答 " + un + " 题不扣分）" : "") + "<br />" + passTxt;
        pass.className = "end-pass " + (score >= PASS_LINE ? "ok" : "err");
      }
      pass.innerHTML = passTxt;
      $("btnRestart").textContent = "再抽一套（换 " + EXAM_N + " 题）";
    } else {
      ring.style.setProperty("--p", rate + "%");
      ring.style.setProperty("--ring-c", "#1f6feb");
      if (S.mode === "review") {
        $("endEmoji").textContent = "📚";
        $("endTitle").textContent = "错题复习完成";
      } else {
        $("endEmoji").textContent = rate >= 90 ? "🏆" : (rate >= 60 ? "🎉" : "💪");
        $("endTitle").textContent = "本轮完成";
      }
      $("endRate").textContent = rate + "%";
      $("endRateLbl").textContent = "正确率";
      $("endPass").textContent = "";
      $("endPass").className = "end-pass";
      $("btnRestart").textContent = S.mode === "review" ? "重新复习错题" : "重新答题";
    }

    $("endCorrect").textContent = S.correct;
    $("endWrong").textContent = S.wrong;
    $("endTotal").textContent = total;
    // 未作答统计（仅模考显示，帮助看清"没做完"的部分）
    var unBox = $("endUnansweredBox");
    if (unBox) {
      $("endUnanswered").textContent = total - Object.keys(S.answered).length;
      unBox.style.display = S.mode === "exam" ? "" : "none";
    }
    var remain = getWrong(S.sub).length;
    $("endWrongCnt").textContent = remain;
    $("btnReview").style.display = remain > 0 ? "" : "none";
    show("end");
  }

  /* ---------- 事件绑定 ---------- */
  document.querySelectorAll(".act-btn").forEach(function (b) {
    b.onclick = function () {
      if (b.dataset.mode === "exam") startExam(b.dataset.sub);
      else startPractice(b.dataset.sub);
    };
  });
  $("btnBack").onclick = function () { if (confirm("返回首页？当前进度不保留")) renderHome(); };
  $("btnQuit").onclick = function () { if (confirm("退出？当前进度不保留")) renderHome(); };
  $("btnPrev").onclick = prev;
  $("btnNext").onclick = next;
  $("btnReview").onclick = function () { startReview(S.sub); };
  $("btnRestart").onclick = function () {
    if (S.mode === "exam") startExam(S.sub);        // 模考：再随机抽一套新的
    else if (S.mode === "review") startReview(S.sub);
    else startPractice(S.sub);
  };
  $("btnHome").onclick = renderHome;

  /* 供自动化测试驱动（浏览器里也无副作用，仅读状态/模拟时间到） */
  window.__JK_TEST__ = {
    examTime: EXAM_TIME,
    timeLeft: function () { return S.timeLeft; },
    expire: function () { S.deadline = Date.now() - 1; tickTimer(); },
  };

  // 启动
  renderHome();
})();

/* ---------- PWA：注册 Service Worker ---------- */
/* 作用：① 断网也能刷题（题目和题图已缓存在本地）
        ② iPhone「添加到主屏幕」后以独立 App 全屏运行
   失败也不影响正常使用，只是没有离线能力。 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { /* 静默忽略 */ });
  });
}

