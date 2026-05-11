function loadAnalyticsScripts() {
    if (document.getElementById("gtag_script") || document.getElementById("custom_ga_script")) {
        return;
    }

    let gaScript = document.createElement("script");
    gaScript.id = "gtag_script";
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-L3K2NVBX01";
    gaScript.async = true;
    gaScript.defer = true;
    document.body.appendChild(gaScript);

    let customScript = document.createElement("script");
    customScript.id = "custom_ga_script";
    customScript.src = "js/gAnalytics.js";
    document.body.appendChild(customScript);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAnalyticsScripts, { once: true });
} else {
    loadAnalyticsScripts();
}
