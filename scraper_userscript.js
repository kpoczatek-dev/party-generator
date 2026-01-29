// ==UserScript==
// @name         Party Generator Scraper
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Pobiera wydarzenia z Facebooka do Party Generatora (1 kliknięcie)
// @author       Kpoczatek
// @match        https://www.facebook.com/*
// @match        https://web.facebook.com/*
// @match        https://facebook.com/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    console.log("👻 Party Generator Scraper: Start (Mode: GM_setClipboard)");
    // alert("👻 Skrypt załadowany!"); // Debug

    // --- CONFIG ---
    const BTN_ID = 'party-gen-scraper-btn';
    const KEYWORDS_TO_CUT = [
        "proponowane wydarzenia", "popularne wśród znajomych", "goście", 
        "poznaj organizatora", "transparentność wydarzeń", "informacje o wydarzeniu",
        "szczegóły", "pokaż wszystkich", "pokaż mniej", "zaproszenie", "udostępnij"
    ];
    const EXCLUDED_TITLES = ["WARSZTATY", "KURS", "ZAJĘCIA"];

    // --- UTILS ---
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function createButton() {
        if (document.getElementById(BTN_ID)) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.innerText = '💃 POBIERZ IMPREZY';
        btn.style.position = 'fixed';
        btn.style.top = '100px'; 
        btn.style.left = '20px';
        btn.style.zIndex = '2147483647';
        btn.style.padding = '12px 20px';
        btn.style.backgroundColor = '#ff4757';
        btn.style.color = '#fff';
        btn.style.border = '2px solid white';
        btn.style.borderRadius = '50px';
        btn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '14px';
        btn.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        btn.style.cursor = 'pointer';

        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; btn.style.backgroundColor = '#ff6b81'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.backgroundColor = '#ff4757'; };

        btn.onclick = async () => {
            btn.innerText = '⏳ Pobieranie...';
            try {
                await runScraper();
                btn.innerText = '✅ Skopiowano!';
                btn.style.backgroundColor = '#2ed573';
                setTimeout(() => { btn.innerText = '💃 POBIERZ IMPREZY'; btn.style.backgroundColor = '#ff4757'; }, 3000);
            } catch (e) {
                console.error(e);
                alert('Błąd: ' + e.message);
                btn.innerText = '💃 POBIERZ IMPREZY';
            }
        };

        (document.body || document.documentElement).appendChild(btn);
        console.log("👻 Button appended!");
    }

    // --- CORE LOGIC ---
    function parseFBDate(text) {
        if (!text) return null;
        text = text.toUpperCase();
        const now = new Date();
        const currentYear = now.getFullYear();

        if (text.includes('DZISIAJ')) return now;
        if (text.includes('JUTRO')) { const d = new Date(now); d.setDate(d.getDate() + 1); return d; }
        if (text.includes('POJUTRZE')) { const d = new Date(now); d.setDate(d.getDate() + 2); return d; }

        const months = {'STY':0, 'LUT':1, 'MAR':2, 'KWI':3, 'MAJ':4, 'CZE':5, 'LIP':6, 'SIE':7, 'WRZ':8, 'PAŹ':9, 'PAZ':9, 'LIS':10, 'GRU':11};
        const regex = /(\d{1,2})\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|PAZ|LIS|GRU)/;
        const match = text.match(regex);
        if (match) {
             const day = parseInt(match[1]);
             const month = months[match[2]];
             const d = new Date(currentYear, month, day);
             if (d < new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)) d.setFullYear(currentYear + 1);
             return d;
        }

        const regexDot = /(\d{1,2})\.(\d{1,2})/;
        const matchDot = text.match(regexDot);
        if (matchDot) {
             const day = parseInt(matchDot[1]);
             const month = parseInt(matchDot[2]) - 1;
             const d = new Date(currentYear, month, day);
             if (d < new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)) d.setFullYear(currentYear + 1);
             return d;
        }
        return null;
    }

    function cleanDescription(text) {
        let cleanText = text;
        const lowerText = cleanText.toLowerCase();
        let cutIndex = cleanText.length;
        KEYWORDS_TO_CUT.forEach(kw => {
            const idx = lowerText.indexOf(kw.toLowerCase());
            if (idx !== -1 && idx < cutIndex) cutIndex = idx;
        });
        return cleanText.substring(0, cutIndex).trim();
    }

    async function runScraper() {
        const events = [];
        const isSingleEventPage = /\/events\/\d+/.test(window.location.href);

        if (isSingleEventPage) {
            let container = document.querySelector('div[role="main"]');
            const h1 = container ? container.querySelector('h1') : document.querySelector('h1');
            if (!container && h1) container = h1.parentElement.parentElement.parentElement;
            if (!container) container = document.body;

            if (container) {
                container.querySelectorAll('div[role="button"], span[role="button"]').forEach(btn => {
                    if (btn.innerText.includes("Wyświetl więcej") || btn.innerText.includes("See more")) try { btn.click(); } catch(e){}
                });
                await sleep(500);

                let title = h1 ? h1.innerText : "Bez tytułu";
                if (["Wydarzenia", "Events"].includes(title)) {
                    const realTitle = container.querySelector('h1') || container.querySelector('span[style*="font-size: 20"]');
                    if(realTitle) title = realTitle.innerText;
                }

                let detailsText = "";
                const xpath = "//*[contains(text(), 'Szczegółowe informacje') or contains(text(), 'Details')]";
                const detailsHeaderSnap = document.evaluate(xpath, container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (detailsHeaderSnap.snapshotLength > 0) {
                    const node = detailsHeaderSnap.snapshotItem(0);
                    const wrapper = node.closest('div.x1yztbdb') || node.closest('div[class*="x1"]');
                    if (wrapper) detailsText = wrapper.innerText;
                }
                if (detailsText.length < 50) detailsText = container.innerText;

                const lines = container.innerText.split('\n').filter(l => l.trim().length > 1);
                let date = "";
                let location = "";

                for(let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line === title || KEYWORDS_TO_CUT.some(k => line.toLowerCase().includes(k))) continue;
                    
                    if (!date) {
                        if (parseFBDate(line)) { date = line; continue; } 
                        else if (/^\d{1,2}$/.test(line.trim()) && i+1 < lines.length) {
                             if (parseFBDate(line + " " + lines[i+1])) { date = line + " " + lines[i+1]; i++; continue; }
                        }
                    }
                    if (!location && !date && (line.includes(',') || line.includes('ul.') || /Katowice|Gliwice|Sosnowiec|Bytom|Chorzów|Świętochłowice/i.test(line))) {
                        if (!line.toLowerCase().includes("wydarzenie") && line.length < 150) location = line;
                    }
                }
                if (!date && lines.length > 0) date = lines[0];

                if (!EXCLUDED_TITLES.some(t => title.toUpperCase().includes(t))) {
                    events.push({
                        url: window.location.href.split('?')[0],
                        rawDate: date,
                        title: title,
                        location: location || "Adres w opisie",
                        description: cleanDescription(detailsText)
                    });
                }
            }
        } else {
             const links = Array.from(document.querySelectorAll('a[href*="/events/"]'));
            const uniqueLinks = new Set();
            links.forEach(link => {
                const href = link.href.split('?')[0];
                if(uniqueLinks.has(href) || !href.match(/\/events\/\d+/)) return;
                uniqueLinks.add(href);
                let container = link.closest('div[style*="border-radius"], div[class*="x1"]');
                if(!container) container = link.parentElement.parentElement.parentElement;
                if (container) {
                    if (container.querySelectorAll('a[href*="/events/"]').length > 2) container = link.parentElement.parentElement;
                    const lines = container.innerText.split('\n').filter(l => l.trim().length > 0);
                    let dateStr = "";
                    let title = "";
                    let location = "";
                    const isDateLine = (txt) => parseFBDate(txt) !== null;
                    if (isDateLine(lines[0])) { dateStr = lines[0]; title = lines[1] || ""; location = lines[2] || ""; } 
                    else if (isDateLine(lines[1])) { title = lines[0]; dateStr = lines[1]; location = lines[2] || ""; } 
                    else { title = link.innerText; dateStr = lines.find(l => isDateLine(l)) || ""; }
                    if(dateStr && dateStr.toUpperCase().includes("INTERESUJE")) dateStr = lines.find(l => isDateLine(l)) || dateStr;
                    if (!title) title = "Bez tytułu";
                    const eventDate = parseFBDate(dateStr);
                    if (eventDate && !EXCLUDED_TITLES.some(t => title.toUpperCase().includes(t))) {
                        events.push({ url: href, rawDate: dateStr, title: title, location: location, description: container.innerText });
                    }
                }
            });
        }

        if (events.length > 0) {
            const json = JSON.stringify(events, null, 2);
            GM_setClipboard(json); // NOWE - OFICJALNE
            console.log(`✅ Skopiowano ${events.length} wydarzeń.`);
        } else {
            throw new Error("Nie znaleziono wydarzeń");
        }
    }

    // --- KEYBOARD SHORTCUT (Alt+P) ---
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyP') {
            console.log("🎹 Skrót Alt+P wykryty!");
            runScraper().then(() => alert("✅ Skopiowano (Skrót)!")).catch(err => alert("Błąd: " + err.message));
        }
    });

    // --- INIT ---
    console.log("🚀 Init Userscript (GM Mode)...");
    createButton();
    setInterval(createButton, 1000);

})();
