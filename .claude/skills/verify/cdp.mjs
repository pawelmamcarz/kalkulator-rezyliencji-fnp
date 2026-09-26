// Minimal CDP driver: node cdp.mjs <script.mjs>; script exports default async (page) => {}
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9333 + Math.floor(Math.random() * 500);
const dir = mkdtempSync(tmpdir() + "/cdp-");
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch { await sleep(200); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const listeners = [];
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else listeners.forEach((l) => l(m)); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }).then((m) => { if (m.error) throw new Error(method + ": " + m.error.message); return m.result; });
await send("Page.enable"); await send("Runtime.enable");
const page = {
  sleep,
  async headers(h) { await send("Network.enable"); await send("Network.setExtraHTTPHeaders", { headers: h }); },
  async viewport(width, height, mobile = false) { await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile }); },
  async goto(url) { const loaded = new Promise((r) => { const l = (m) => { if (m.method === "Page.loadEventFired") { listeners.splice(listeners.indexOf(l), 1); r(); } }; listeners.push(l); }); await send("Page.navigate", { url }); await loaded; await sleep(600); },
  async eval(expr) { const r = await send("Runtime.evaluate", { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; },
  async click(sel) { const box = await this.eval(`const e=document.querySelector(${JSON.stringify(sel)}); if(!e) throw new Error("no el "+${JSON.stringify(sel)}); e.scrollIntoView({block:"center"}); const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2};`); for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 }); await sleep(150); },
  async type(sel, text) { await this.click(sel); await send("Input.insertText", { text }); await sleep(100); },
  async key(key) { for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key, text: type === "keyDown" ? key : undefined }); await sleep(150); },
  async waitFor(expr, ms = 20000) { const t = Date.now(); while (Date.now() - t < ms) { if (await this.eval(`return !!(${expr})`)) return true; await sleep(250); } throw new Error("timeout: " + expr); },
  async shot(path, full = false) { const opts = { format: "png" }; if (full) { const h = await this.eval("return document.documentElement.scrollHeight"); const w = await this.eval("return document.documentElement.clientWidth"); opts.clip = { x: 0, y: 0, width: w, height: h, scale: 1 }; opts.captureBeyondViewport = true; } const r = await send("Page.captureScreenshot", opts); writeFileSync(path, Buffer.from(r.data, "base64")); },
};
try { const mod = await import(process.argv[2]); await mod.default(page); } catch (e) { console.log("DRIVER ERROR:", e.message); process.exitCode = 1; } finally { ws.close(); chrome.kill(); }
