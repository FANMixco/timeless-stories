"use strict";

(function initDeferredAnalyticsLoader() {
    function loadAnalytics() {
        if (document.getElementById("ga_loader")) {
            return;
        }

        const script = document.createElement("script");
        script.id = "ga_loader";
        script.src = "js/gAnalyticsLoad.min.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadAnalytics, { timeout: 1500 });
        return;
    }

    window.setTimeout(loadAnalytics, 1);
})();
