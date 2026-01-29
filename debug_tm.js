// ==UserScript==
// @name         TEST 123
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Test czy Tampermonkey w ogole dziala
// @author       Test
// @match        *://*.facebook.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    alert("🔴 CZY WIDZISZ TEN NAPIS? 🔴");
    console.log("🔴 TEST LOGU 🔴");
})();
