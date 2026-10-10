// 网站更新后，浏览器偶尔还拿着旧的脚本，新页面配旧脚本会出错黑屏。
// 页面启动完成前出现脚本错误时：清掉离线缓存、注销 service worker，重新加载一次（同一个标签页只试一次，不会反复刷新）。
// 每个页面最先加载本文件，并用 zAppGuard.mount(app, '#app') 挂载 Vue。
(function () {
    var KEY = 'z-dnd-stale-heal';
    var ready = false; var failed = false;
    var heal = function () {
        failed = true;
        if (ready) return;
        try { if (sessionStorage.getItem(KEY)) return; sessionStorage.setItem(KEY, '1'); } catch (e) { return; }
        var jobs = [];
        if (window.caches) jobs.push(caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); }));
        if (navigator.serviceWorker) jobs.push(navigator.serviceWorker.getRegistrations().then(function (regs) { return Promise.all(regs.map(function (r) { return r.unregister(); })); }));
        Promise.all(jobs).catch(function () {}).then(function () { location.reload(); });
    };
    // 只管本站脚本的错误（页面内联脚本的 filename 就是页面地址）
    window.addEventListener('error', function (e) { if (e.filename && e.filename.indexOf(location.origin) === 0) heal(); });
    window.zAppGuard = {
        heal: heal,
        mount: function (app, selector) {
            app.config.errorHandler = function (err, vm, info) { console.error(err, info); heal(); };
            failed = false;
            var vm = app.mount(selector);
            if (!failed) { ready = true; try { sessionStorage.removeItem(KEY); } catch (e) {} }
            return vm;
        },
    };
})();
