/* 비즈필터 측정 스크립트 — 설치: <script defer src="https://www.bizfilter.kr/t.js" data-code="진행코드"></script> */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var code = s.getAttribute("data-code");
  if (!code) return;
  var ep;
  try {
    ep = new URL(s.src).origin + "/api/t";
  } catch (e) {
    return;
  }
  var sid;
  try {
    sid = sessionStorage.getItem("bzf_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("bzf_sid", sid);
    }
  } catch (e) {
    sid = Math.random().toString(36).slice(2);
  }
  function send(type, label) {
    var body = JSON.stringify({
      c: code,
      t: type,
      l: label || null,
      s: sid,
      r: document.referrer || null,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ep, body);
        return;
      }
    } catch (e) {}
    try {
      fetch(ep, { method: "POST", body: body, keepalive: true, mode: "no-cors" });
    } catch (e) {}
  }
  send("pageview");
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var el = t.closest("a,button,[role=button],input[type=submit]");
      if (!el) return;
      var txt = (el.innerText || el.value || el.getAttribute("aria-label") || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 80);
      send("click", txt);
    },
    true
  );
})();
