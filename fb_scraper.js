/**
 * SKRYPT DO POBIERANIA WYDARZEŃ Z FACEBOOKA
 * 
 * INSTRUKCJA:
 * 1. Wejdź na stronę z wydarzeniami (np. zakładka "Wydarzenia" na fanpage'u lub lista wydarzeń).
 * 2. Otwórz Konsolę Deweloperską (F12 -> zakładka Console).
 * 3. Wklej cały poniższy kod i naciśnij ENTER.
 * 4. Pobrane dane zostaną skopiowane do schowka.
 * 5. Wklej je w polu "Import z Facebooka" w Generatorze Imprez.
 */

(async function() {
    console.log("🚀 Rozpoczynam pobieranie wydarzeń...");

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const events = [];
    
    // ---------------------------------------------------------
    // TRYB: POJEDYNCZE WYDARZENIE (Priorytet, jeśli jesteśmy na stronie wydarzenia)
    // ---------------------------------------------------------
    const isSingleEventPage = /\/events\/\d+/.test(window.location.href);
    
    if (isSingleEventPage) {
        console.log("🔍 Wykryto stronę pojedynczego wydarzenia. Próba pobrania szczegółów...");
        
        // Szukamy nagłówka H1 (tytuł) lub H2
        const h1 = document.querySelector('h1') || document.querySelector('h2');
        if (h1) {
            const title = h1.innerText;
            // Szukamy kontenera - zazwyczaj 'main' lub po prosu body jeśli to modal
            const container = h1.closest('div[role="main"]') || document.body;
            
            if (container) {
                // Próba automatycznego rozwinięcia "Wyświetl więcej" / "See more"
                // Szukamy przycisków w pobliżu, które mogą rozwijać opis
                const expandButtons = document.querySelectorAll('div[role="button"], span[role="button"]');
                let clicked = false;
                expandButtons.forEach(btn => {
                    if (btn.innerText.includes("Wyświetl więcej") || btn.innerText.includes("See more")) {
                        try { 
                            btn.click(); 
                            clicked = true;
                            console.log("🖱️ Kliknięto 'Wyświetl więcej'...");
                        } catch(e) {}
                    }
                });
                
                if (clicked) {
                    console.log("⏳ Czekam 2 sekundy na załadowanie opisu...");
                    await sleep(2000);
                }

                // Szukamy sekcji "Szczegółowe informacje" używając XPath
                let detailsText = "";
                const xpath = "//*[contains(text(), 'Szczegółowe informacje') or contains(text(), 'Details')]";
                const detailsHeader = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                
                if (detailsHeader) {
                    console.log("Found Details Header:", detailsHeader);
                    // Strategia: Nagłówek jest zazwyczaj w jakimś kontenerze.
                    // Treść jest w kolejnym elemencie (sibling) lub w rodzicu->dziecko.
                    
                    // Próbujemy kilku podejść:
                    // 1. Next Sibling nagłówka (częste w prostych strukturach)
                    let contentNode = detailsHeader.nextElementSibling;
                    
                    // 2. Jeśli header jest w wrapperze (np. span w div), idziemy wyżej i szukamy siblinga wrappera
                    if (!contentNode || contentNode.innerText.length < 10) {
                         contentNode = detailsHeader.parentElement.nextElementSibling;
                    }
                    if (!contentNode || contentNode.innerText.length < 10) {
                         contentNode = detailsHeader.parentElement.parentElement.nextElementSibling;
                    }

                    // 3. Jeśli nadal nic, szukamy kontenera "x1yztbdb" (częsta klasa FB) w dół od wspólnego rodzica
                    if (!contentNode || contentNode.innerText.length < 10) {
                        const wrapper = detailsHeader.closest('div.x1yztbdb') || detailsHeader.closest('div[style*="border-radius"]');
                        if (wrapper) {
                            detailsText = wrapper.innerText; // Bierzemy cały wrapper sekcji
                        }
                    } else {
                        detailsText = contentNode.innerText;
                    }
                } else {
                    console.log("Details Header NOT found. Searching global descriptors...");
                    // Fallback: szukamy po prostu dużego bloku tekstu, który zawiera "Muzycznie" lub "Wstęp"
                    const paragraphs = document.querySelectorAll('div[dir="auto"]'); // FB używa dir="auto" dla treści postów/opisów
                    paragraphs.forEach(p => {
                        if (p.innerText.length > 50 && (p.innerText.includes("Muzycznie") || p.innerText.includes("Salsa") || p.innerText.includes("Wstęp"))) {
                            detailsText += "\n" + p.innerText;
                        }
                    });
                }

                const text = container.innerText;
                // Combine text from main container and details container (deduplicate? usually unnecessary for simple scraper)
                // Note: detailsText might be subset of text, or text might be subset. 
                // Let's rely on detailsText if found (since it's specific), otherwise text.
                // Or concat to be safe.
                
                const fullText = (text.length > detailsText.length ? text : detailsText) + "\n" + detailsText; 
                
                const lines = fullText.split('\n').filter(l => l.trim().length > 0);
                
                let date = "";
                let location = "";
                
                // Regex daty: szukamy formatów typu "SOB., 21 PAŹ" albo "PIĄTEK, 15:00"
                const dateRegex = /(\d{1,2}\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU))|(PON|WTO|ŚRO|CZW|PIĄ|SOB|NIE)/i;
                
                for(let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line === title) continue;
                    if (line.includes("Zaproszenie") || line.includes("Szczegóły") || line.includes("Udostępnij")) continue;
                    
                    // 1. Standardowy regex (w jednej linii)
                    if (!date && dateRegex.test(line) && line.length < 50) {
                        date = line;
                        continue;
                    }

                    // 2. Data w dwóch liniach (np. "31" [enter] "STY")
                    // Sprawdzamy czy obecna linia to liczba (1-31)
                    if (!date && /^\d{1,2}$/.test(line.trim())) {
                        // Sprawdzamy czy następna linia to miesiąc
                        if (i + 1 < lines.length) {
                            const nextLine = lines[i+1].trim().toUpperCase();
                            if (/^(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU)/.test(nextLine)) {
                                date = line + " " + nextLine;
                                i++; // Przeskocz kolejną linię bo ją zużyliśmy
                                continue;
                            }
                        }
                    }
                    
                    // Szukamy lokalizacji
                    if (!location && (line.includes(',') || line.includes('ul.') || /Katowice|Gliwice|Sosnowiec|Bytom|Chorzów|Świętochłowice/i.test(line)) && line.length < 150) {
                        if (!line.toLowerCase().includes("wydarzenie") && !line.toLowerCase().includes("organizator")) {
                             location = line;
                        }
                    }
                }
                
                // Fallback daty
                if (!date && lines.length > 0) date = lines[0];

                const isExcluded = title.toUpperCase().includes("WARSZTATY") || title.toUpperCase().includes("KURS") || title.toUpperCase().includes("ZAJĘCIA");

                if (!isExcluded) {
                     events.push({
                        url: window.location.href.split('?')[0],
                        rawDate: date,
                        title: title,
                        location: location || "Adres w opisie",
                        description: fullText || ""
                    });
                }
            }
        }
    }


    // ---------------------------------------------------------
    // TRYB: LISTA WYDARZEŃ (uzupełnienie)
    // ---------------------------------------------------------
    
    // Pobieramy linki, ale sprawdzamy czy nie duplikujemy tego co już mamy (Main Event)
    const links = Array.from(document.querySelectorAll('a[href*="/events/"]'));

    const uniqueLinks = new Set();
    // Dodaj URL eventu głównego (jeśli istnieje), żeby go nie dublować
    if (events.length > 0) uniqueLinks.add(events[0].url);

    links.forEach(link => {
        const href = link.href.split('?')[0]; // Usuń parametry trackingu
        if(uniqueLinks.has(href)) return;
        
        // Pomijamy linki, które nie kończą się ID (np. /events/top)
        if(!href.match(/\/events\/\d+/)) return;

        uniqueLinks.add(href);

        // Znajdź najbliższy sensowny kontener (często to kilka poziomów wyżej)
        let container = link.closest('div[style*="border-radius"], div[class*="x1"], div[role="article"]');
        if(!container) container = link.parentElement.parentElement.parentElement;

        if (container) {
            // ZABEZPIECZENIE: Sprawdź czy kontener nie jest za duży (czy nie zawiera innych linków do wydarzeń)
            // Jeśli tak, to znaczy że złapaliśmy całą listę, a nie pojedynczą kartę.
            const otherLinks = container.querySelectorAll('a[href*="/events/"]');
            if (otherLinks.length > 2) { 
                 // Próbujemy zejść niżej - szukamy wspólnego rodzica tylko dla tego linku
                 container = link.closest('div.x1yztbdb'); // Częsta klasa w FB dla wrapperów
                 if (!container) container = link.parentElement.parentElement;
            }

            const textContent = container ? container.innerText : "";
            const lines = textContent.split('\n').filter(l => l.trim().length > 0);
            
            let date = lines[0] || "";
            let title = lines[1] || "";
            let location = lines[2] || "";

            // Jeśli pierwsza linia to "INTERESUJE MNIE", przesuń
            if(date.toUpperCase().includes("INTERESUJE") || date.toUpperCase().includes("WEZMĘ")) {
                date = lines[1] || "";
                title = lines[2] || "";
                location = lines[3] || "";
            }
            
            // Czasem tytuł jest w linku, a data obok
            // Spróbujmy wyciągnąć tytuł z linku (często ma aria-label lub innerText)
            const linkTitle = link.innerText || link.getAttribute('aria-label');
            if(linkTitle && linkTitle.length > title.length) {
                title = linkTitle;
            }

            // FILTER: Pomiń warsztaty, kursy i zajęcia
            if (title.toUpperCase().includes("WARSZTATY") || title.toUpperCase().includes("KURS") || title.toUpperCase().includes("ZAJĘCIA")) {
                return;
            }

            events.push({
                url: href,
                rawDate: date,
                title: title,
                location: location,
                description: textContent || ""
            });
        }
    });


    if (events.length > 0) {
        const json = JSON.stringify(events, null, 2);
        copyToClipboard(json);
        console.log(`✅ Znaleziono ${events.length} wydarzeń!`);
        console.table(events);
        alert(`✅ Sukces! Skopiowano ${events.length} wydarzeń do schowka.\nTeraz wklej to w Generatorze.`);
    } else {
        console.warn("⚠️ Nie znaleziono wydarzeń. Sprawdź czy jesteś na poprawnej stronie lub czy FB nie zmienił kodu.");
        alert("⚠️ Nie znaleziono wydarzeń. Spróbuj przewinąć stronę niżej i uruchom skrypt ponownie.");
    }

    function copyToClipboard(text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

})();
