/* 驾考通·授权版 —— 邀请码门禁 gate.js
 * 流程：
 *   1. 立即隐藏页面内容（防闪现）
 *   2. OAuth 回调分发（微信 / WorkBuddy，必须在门禁判断之前）
 *   3. 有会话 → check_access() 判权；无会话 → 走邀请码 + 登录
 *   4. 认领成功 / 管理员 / 权限有效 → 放行；否则显示对应提示
 * 规则：不做匿名登录、不做本地模拟会话；放行与否由云端函数决定。
 */
(function () {
  "use strict";

  var P = (function () {
    // 相对前缀：根页面 ./，子页面 ../
    var m = location.pathname.replace(/\/+$/, "").match(/\/([a-z-]+)$/i);
    var sub = m && /^(question-bank|mnemonics|answers)$/.test(m[1]);
    return sub ? "../" : "./";
  })();

  /* ---------- 1. 立即锁屏防闪现 ---------- */
  var style = document.createElement("style");
  style.textContent =
    "html.jk-locked body{visibility:hidden!important}" +
    "#jkGate{position:fixed;inset:0;z-index:99999;background:#f2f4f8;display:flex;" +
    "align-items:center;justify-content:center;padding:20px;visibility:visible!important;" +
    "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}" +
    "@media (prefers-color-scheme:dark){#jkGate{background:#161922}}";
  document.documentElement.appendChild(style);
  document.documentElement.classList.add("jk-locked");

  var gate = document.createElement("div");
  gate.id = "jkGate";
  (document.body || document.documentElement).appendChild(gate);
  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("jkGate")) document.documentElement.appendChild(gate);
  });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var UI = {
    head: '<div style="width:100%;max-width:380px">' +
      '<div style="text-align:center;margin-bottom:18px">' +
      '<div style="font-size:34px">🚗</div>' +
      '<div style="font-size:20px;font-weight:800;color:#1f2430">驾考通 · 授权版</div>' +
      '<div style="font-size:12px;color:#6b7280;margin-top:4px">本站内容仅限受邀用户访问</div></div>',
    msg: function (icon, text, tone) {
      var bg = tone === "bad" ? "#fdecec;color:#b42318" : tone === "ok" ? "#e6f6ee;color:#0a6b3c" : "#fff7e6;color:#9a6200";
      return '<div style="background:' + bg + ';border-radius:12px;padding:12px 14px;' +
        'font-size:14px;line-height:1.6;margin-bottom:14px"><b>' + icon + "</b> " + esc(text) + "</div>";
    },
    btn: function (id, label, primary) {
      return '<button id="' + id + '" style="width:100%;padding:12px;border:none;border-radius:12px;' +
        'font-size:15px;font-weight:700;cursor:pointer;margin-top:10px;' +
        (primary ? "background:#1f6feb;color:#fff" : "background:#fff;color:#1f2430;border:1px solid #e7eaf0") +
        '">' + esc(label) + "</button>";
    },
    foot: '<div style="text-align:center;font-size:11px;color:#9aa3b2;margin-top:16px">邀请链接由车主生成 · 一个链接仅可绑定一个账号</div>'
  };

  function showLoading(text) {
    gate.innerHTML = UI.head + '<div style="text-align:center;color:#6b7280;font-size:14px">⏳ ' + esc(text || "正在校验访问权限…") + "</div>";
  }
  function showError(text) {
    gate.innerHTML = UI.head + UI.msg("❌", text, "bad") +
      '<button onclick="location.reload()" style="width:100%;padding:12px;border:none;border-radius:12px;font-size:15px;font-weight:700;background:#1f6feb;color:#fff;cursor:pointer">重试</button>' + UI.foot + "</div>";
  }

  /* ---------- 2. 初始化云客户端 ---------- */
  var cloud = null;
  try {
    if (!window.WorkBuddyCloud || !window.CLOUD_CONFIG) throw new Error("SDK/配置未加载");
    cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
      endpoint: window.CLOUD_CONFIG.endpoint,
      oauthRelayBaseUrl: window.CLOUD_CONFIG.oauthRelayBaseUrl,
      publishableKey: window.CLOUD_CONFIG.publishableKey
    });
  } catch (e) {
    showError("访问组件加载失败，请检查网络后重试。");
    return;
  }

  /* ---------- 工具 ---------- */
  function getInv() {
    var v = new URLSearchParams(location.search).get("inv");
    return v ? String(v).trim().toUpperCase() : "";
  }
  function clearInvInUrl() {
    var u = new URL(location.href);
    u.searchParams.delete("inv");
    history.replaceState(null, "", u.pathname + (u.searchParams.toString() ? "?" + u.searchParams : "") + u.hash);
  }
  function rootWithInv(inv) {
    var u = new URL(location.origin + "/");
    if (inv) u.searchParams.set("inv", inv);
    return u.toString();
  }
  function sha256Hex(s) {
    // admin.html 用；gate 不需要
  }

  /* ---------- 3. 登录 UI ---------- */
  var pendingOtp = null; // { phone, verificationId, isExistingUser }
  var otpTimer = null;
  var IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  var IN_WECHAT = /MicroMessenger/i.test(navigator.userAgent);

  function showLogin(inv, preMsg, preTone) {
    var wechatLabel = IS_MOBILE ? "微信扫码（电脑端用）" : "微信扫码登录";
    var html = UI.head;
    if (preMsg) html += UI.msg("🎫", preMsg, preTone || "warn");
    html += '<div id="jkLoginBox">' +
      (IS_MOBILE ? '<div style="background:#e6f6ee;color:#0a6b3c;border-radius:10px;padding:9px 12px;font-size:13px;line-height:1.5;margin-bottom:12px">📱 手机端推荐用<b>手机验证码</b>登录，微信扫码仅电脑端可用</div>' : "") +
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
      '<button id="jkTabWechat" style="flex:1;padding:10px;border-radius:10px;border:1px solid #e7eaf0;background:#fff;color:#1f2430;font-weight:700;font-size:14px;cursor:pointer">' + wechatLabel + '</button>' +
      '<button id="jkTabPhone" style="flex:1;padding:10px;border-radius:10px;border:1px solid #e7eaf0;' + (IS_MOBILE ? "background:#1f6feb14;color:#1f6feb" : "background:#0fce5c14;color:#0a7a3d") + ';font-weight:700;font-size:14px;cursor:pointer">手机验证码</button>' +
      "</div>" +
      '<div id="jkPhoneBox" style="display:none">' +
      '<input id="jkPhone" type="tel" maxlength="11" placeholder="11 位手机号" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #e7eaf0;border-radius:10px;font-size:15px;margin-bottom:10px" />' +
      '<div id="jkPhoneErr" style="color:#b42318;font-size:12px;margin:-6px 0 8px;min-height:14px"></div>' +
      '<div style="display:flex;gap:8px">' +
      '<input id="jkCode" type="number" inputmode="numeric" maxlength="6" placeholder="验证码" style="flex:1;min-width:0;padding:12px;border:1px solid #e7eaf0;border-radius:10px;font-size:15px" />' +
      '<button id="jkSend" type="button" style="flex:none;width:104px;padding:12px;border:none;border-radius:10px;background:#eef2f8;color:#1f6feb;font-weight:700;font-size:13px;cursor:pointer">获取验证码</button>' +
      "</div>" +
      '<button id="jkPhoneGo" type="button" style="width:100%;margin-top:12px;padding:12px;border:none;border-radius:12px;font-size:15px;font-weight:700;background:#1f6feb;color:#fff;cursor:pointer">登录 / 注册</button>' +
      "</div>" +
      '<div id="jkWechatBox">' +
      '<button id="jkWechatGo" style="width:100%;padding:12px;border:none;border-radius:12px;font-size:15px;font-weight:700;background:#07c160;color:#fff;cursor:pointer">微信一键登录 / 扫码</button>' +
      '<div style="font-size:12px;color:#9aa3b2;margin-top:8px;text-align:center">将跳转微信授权，成功后自动返回</div>' +
      "</div>" +
      "</div>" + UI.foot + "</div>";
    gate.innerHTML = html;

    var tabW = document.getElementById("jkTabWechat");
    var tabP = document.getElementById("jkTabPhone");
    var boxW = document.getElementById("jkWechatBox");
    var boxP = document.getElementById("jkPhoneBox");
    tabW.onclick = function () {
      boxW.style.display = ""; boxP.style.display = "none";
      tabW.style.background = "#0fce5c14"; tabW.style.color = "#0a7a3d";
      tabP.style.background = "#fff"; tabP.style.color = "#1f2430";
    };
    tabP.onclick = function () {
      boxP.style.display = ""; boxW.style.display = "none";
      tabP.style.background = "#1f6feb14"; tabP.style.color = "#1f6feb";
      tabW.style.background = "#fff"; tabW.style.color = "#1f2430";
    };

    // 手机端默认展示「手机验证码」tab
    if (IS_MOBILE) { tabP.onclick(); }

    // 微信
    document.getElementById("jkWechatGo").onclick = async function () {
      if (IS_MOBILE) {
        alert("手机端请使用「手机验证码」登录；微信扫码仅电脑端可用。");
        return;
      }
      this.disabled = true; this.textContent = "正在跳转…";
      var back = new URL(location.origin + "/");
      if (inv) back.searchParams.set("inv", inv);
      var res = await cloud.auth.signInWithOAuth({ provider: "wechat", redirectTo: back.toString() });
      if (res.error) {
        this.disabled = false; this.textContent = "微信一键登录 / 扫码";
        alert(res.error.message || "微信登录暂不可用");
        return;
      }
      location.assign(res.data.url);
    };

    // 手机验证码
    var $phone = document.getElementById("jkPhone");
    var $code = document.getElementById("jkCode");
    var $err = document.getElementById("jkPhoneErr");
    var $send = document.getElementById("jkSend");
    var $go = document.getElementById("jkPhoneGo");
    $phone.addEventListener("input", function () { $err.textContent = ""; });

    $send.onclick = async function () {
      var phone = $phone.value.trim();
      if (!/^1\d{10}$/.test(phone)) { $err.textContent = "请输入正确的 11 位手机号"; return; }
      $err.textContent = "";
      $send.disabled = true; $send.textContent = "发送中…";
      var sent = await cloud.auth.sendOtp({ phone: phone });
      if (sent.error) {
        $send.disabled = false; $send.textContent = "获取验证码";
        $err.textContent = sent.error.message || "验证码发送失败";
        return;
      }
      pendingOtp = { phone: phone, verificationId: sent.data.verificationId, isExistingUser: sent.data.isExistingUser };
      var left = 60;
      $send.textContent = left + "s 后重发";
      otpTimer = setInterval(function () {
        left--; 
        if (left <= 0) { clearInterval(otpTimer); $send.disabled = false; $send.textContent = "重新获取"; }
        else $send.textContent = left + "s 后重发";
      }, 1000);
    };

    $go.onclick = async function () {
      var phone = $phone.value.trim();
      if (!/^1\d{10}$/.test(phone)) { $err.textContent = "请输入正确的 11 位手机号"; return; }
      if (!pendingOtp || pendingOtp.phone !== phone) { $err.textContent = "请先获取当前手机号的验证码"; return; }
      if (!$code.value.trim()) { $err.textContent = "请输入验证码"; return; }
      $go.disabled = true; $go.textContent = "登录中…";
      var done = await cloud.auth.verifyOtp({
        phone: pendingOtp.phone,
        verificationId: pendingOtp.verificationId,
        isExistingUser: pendingOtp.isExistingUser,
        token: $code.value.trim()
      });
      if (done.error) {
        $go.disabled = false; $go.textContent = "登录 / 注册";
        $err.textContent = done.error.message || "验证码错误";
        return;
      }
      pendingOtp = null;
      await afterLogin(inv);
    };
  }

  function showDenied(text) {
    gate.innerHTML = UI.head + UI.msg("🔒", text, "bad") +
      '<button id="jkOut" style="width:100%;padding:12px;border:none;border-radius:12px;font-size:14px;font-weight:700;background:#fff;color:#b42318;border:1px solid #f2c4c0;cursor:pointer">退出当前账号</button>' +
      '<a href="' + P + 'admin.html" style="display:block;text-align:center;font-size:12px;color:#9aa3b2;margin-top:10px">车主管理入口</a>' + UI.foot + "</div>";
    document.getElementById("jkOut").onclick = async function () {
      await cloud.auth.signOut();
      location.href = location.origin + "/";
    };
  }

  function unlock(isAdminUser) {
    document.documentElement.classList.remove("jk-locked");
    var g = document.getElementById("jkGate");
    if (g) g.remove();
    if (isAdminUser) {
      var btn = document.createElement("a");
      btn.href = P + "admin.html";
      btn.textContent = "⚙ 管理";
      btn.style.cssText = "position:fixed;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:99998;" +
        "background:#1f2430;color:#fff;font-size:12px;font-weight:700;padding:8px 12px;border-radius:999px;" +
        "text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)";
      document.body.appendChild(btn);
    }
  }

  /* ---------- 4. 登录后的判定 ---------- */
  async function afterLogin(inv) {
    showLoading("正在激活访问权限…");
    var uidName = null;
    try {
      var gu = await cloud.auth.getUser();
      if (gu.data && gu.data.user) uidName = gu.data.user.name || null;
    } catch (e) { /* 忽略 */ }

    if (inv) {
      var r = await cloud.database.rpc("claim_invite", { p_code: inv, p_name: uidName });
      if (r.error) { showError("校验失败：" + (r.error.message || "请稍后重试")); return; }
      var st = r.data && r.data.status;
      if (st === "ok") { clearInvInUrl(); unlock(await checkAdmin()); return; }
      if (st === "need_login") { showLogin(inv, "请先登录以绑定该邀请链接", "warn"); return; }
      if (st === "already_claimed") { showDenied("该邀请链接已被其他账号使用，已失效。请联系车主重新获取。"); return; }
      if (st === "expired") { showDenied("该邀请链接已过期，请联系车主重新获取。"); return; }
      showDenied("邀请链接无效，请核对链接是否完整。"); return;
    }

    var a = await cloud.database.rpc("check_access");
    if (a.error) { showError("校验失败：" + (a.error.message || "请稍后重试")); return; }
    if (a.data && a.data.allowed) { unlock(!!(a.data.is_admin || (await checkAdmin()))); return; }
    showDenied("当前账号未获得访问权限。请通过车主发给你的邀请链接打开本站。");
  }

  async function checkAdmin() {
    var r = await cloud.database.rpc("is_admin");
    return !!(r.data === true || (r.data && r.data === true));
  }

  /* ---------- 5. 启动：先分发 OAuth 回调，再判权 ---------- */
  async function start() {
    var url = new URL(location.href);
    var hasCb = url.searchParams.has("code") || url.searchParams.has("error");

    if (hasCb) {
      var provider = url.searchParams.get("provider");
      if (provider === "wechat" || provider === "workbuddy") {
        var handler = provider === "wechat" ? cloud.auth.handleWechatWebCallback : cloud.auth.handleWorkBuddyCallback;
        if (typeof handler === "function") {
          var res = await handler.call(cloud.auth);
          if (res.error) { showLogin(getInv(), "登录失败：" + res.error.message, "bad"); return; }
          if (res.data) {
            for (var k of ["code", "state", "provider"]) url.searchParams.delete(k);
            history.replaceState(null, "", url.pathname + (url.searchParams.toString() ? "?" + url.searchParams : "") + url.hash);
          }
        } else {
          showLogin(getInv(), "登录组件加载不完整，请刷新重试。", "bad"); return;
        }
      }
    }

    var inv = getInv();
    if (inv) {
      // 先查状态给用户预期（不泄露被谁绑定）
      var s = await cloud.database.rpc("invite_status", { p_code: inv });
      var stt = !s.error && s.data && s.data.status;
      showLoading();
      var sess = await cloud.auth.getSession();
      if (sess.error || !sess.data) {
        if (stt === "valid") showLogin(inv, "链接有效 · 登录后自动绑定到你的账号（仅限一个账号）", "ok");
        else if (stt === "claimed") showLogin(inv, "该邀请链接已被其他账号使用，已失效。", "bad");
        else if (stt === "expired") showLogin(inv, "该邀请链接已过期，请联系车主重新获取。", "bad");
        else showLogin(inv, "邀请链接无效，请核对链接。", "bad");
        return;
      }
      await afterLogin(inv);
      return;
    }

    var sess2 = await cloud.auth.getSession();
    if (sess2.error || !sess2.data) {
      gate.innerHTML = UI.head + UI.msg("🔑", "请通过车主发给你的专属邀请链接访问本站。", "warn") +
        '<a href="' + P + 'admin.html" style="display:block;text-align:center;font-size:12px;color:#9aa3b2;margin-top:10px">车主管理入口</a>' + UI.foot + "</div>";
      return;
    }
    await afterLogin("");
  }

  start();
})();
