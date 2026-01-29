document.addEventListener('DOMContentLoaded', function () {
	const LICZBA_DNI = 14 // 2 tygodnie od jutra

	const miejscaWgMiasta = {
		Katowice: [
			'Marcepan',
			'Gravitacja',
			'NOSPR',
			'GoodMood',
			'LaClave',
			'MilPasos',
			'Taneczna Kompania',
			'Nowy Dekameron',
			'Tapas LaFirinda',
			'Królestwo',
			'Dolina trzech stawów',
		],
		Chorzów: ['Taneczne Kręgi', 'Pizzeria Róża'],
		Tychy: ['Przystań Kajakowa', 'Mohito', 'Dzika plaża'],
		Kraków: ['Sabrosa', 'Tropical spot', 'Tauron Arena', 'Forum Tańca'],
		'Bielsko-Biała': ['Festiwal Kubański', 'DANCE#LOVEit', 'Metrum', 'Grzyńskiego', 'Hotel Sahara', 'Cavatina Hall'],
		Gliwice: ['Mohito', 'LaClave', 'Rynek'],
		Bytom: ['Majowa'],
		Świętochłowice: ['Stylowa Willa'],
		'Tarnowskie Góry': ['Ocean Club'],
		Rybnik: ['Pink Bowling & Club'],
		'Dąbrowa Górnicza': ['Beach Bar Pogoria'],
	}

	const style = [
		'Salsa',
		'Bachata',
		'Kizomba',
		'Zouk',
		'Linia',
		'Cubana',
		'Rumba',
		'Afro',
		'Koncert',
		'Latino',
		'Reggeton',
	]
	const dniTygodnia = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA']

    // --- KONFIGURACJA MAPOWANIA ---
    const adresyMap = {
        'chorzowska 11': 'LaClave',
        'la clave': 'LaClave',
        'kamienna 4': 'MilPasos',
        'zwycięstwa 52': 'Mohito',
        'zwycięstwa 52a': 'Mohito',
        'good mood': 'GoodMood',
        'paderewskiego': 'GoodMood',
        'mariacka': 'Klub Pomarańcza',
        'plac grunwaldzki': 'NOSPR',
        'rynek': 'Rynek',
        'dworcowa 8': 'Stylowa Willa',
        'rondo mogilskie 1': 'Sabrosa',
        'dworkowa 2': 'Cavatina Hall',
        'gravitacja': 'Gravitacja',
        'zwycięstwa': 'Mohito', 
        'jana pawła': 'Mohito',
        'mohito gliwice': 'Mohito',
        'mohito tychy': 'Mohito',
    };

    const adresMiastoSztywne = {
        'zwycięstwa': 'Gliwice',
        'jana pawła': 'Tychy',
        'dworkowa 2': 'Bielsko-Biała',
        'mohito gliwice': 'Gliwice',
        'mohito tychy': 'Tychy'
    };

    const styleKeywords = {
        'salsa': 'Cubana', 'cuban': 'Cubana', 'casino': 'Cubana', 'rueda': 'Cubana', 'mambo': 'Salsa',
        'kubańskie': 'Cubana', 'wprawki': 'Cubana', 
        'bachata': 'Bachata', 'bachat': 'Bachata', 'dominicana': 'Bachata',
        'kizomba': 'Kizomba', 'kiz': 'Kizomba', 'semba': 'Kizomba', 'tarraxo': 'Kizomba', 'urban': 'Kizomba',
        'zouk': 'Zouk', 'lambada': 'Zouk',
        ' west ': 'Linia', ' wcs ': 'Linia', 'modern jive': 'Linia', 
        'cubana': 'Cubana',
        'rumba': 'Rumba',
        'afro': 'Afro',
        'koncert': 'Koncert',
        'reggaeton': 'Reggeton', 'reggeton': 'Reggeton'
    };

	function formatujDatePL(date) {
		const d = date.getDate().toString().padStart(2, '0')
		const m = (date.getMonth() + 1).toString().padStart(2, '0')
		return `${d}.${m}`
	}

	function dodajDni(date, ile) {
		const d = new Date(date)
		d.setDate(d.getDate() + ile)
		return d
	}

	function generujDniOdJutra(ileDni) {
		const dzis = new Date()
		const start = dodajDni(dzis, 1)
		const result = []
		for (let i = 0; i < ileDni; i++) {
			const d = dodajDni(start, i)
			const dzienTyg = dniTygodnia[d.getDay()]
			result.push({
				date: d,
				label: `${dzienTyg} (${formatujDatePL(d)})`,
				dzienTygIndex: d.getDay(),
			})
		}
		return result
	}

	const dni = generujDniOdJutra(LICZBA_DNI)
	const form = document.getElementById('form')

	// Generowanie pól formularza
	// Helper for DnD
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.event-container:not(.dragging)')]

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect()
            const offset = y - box.top - box.height / 2
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child }
            } else {
                return closest
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element
    }

	// Generowanie pól formularza
	dni.forEach(dzienObj => {
		const block = document.createElement('div')
		block.className = 'day-block'
		block.dataset.date = dzienObj.date.toISOString()
		block.dataset.dzienTygIndex = dzienObj.dzienTygIndex
		block.innerHTML = `<h3>${dzienObj.label}</h3>`

        // Drag Over for determining order
        block.addEventListener('dragover', e => {
            e.preventDefault()
            const afterElement = getDragAfterElement(block, e.clientY)
            const draggable = document.querySelector('.dragging')
            // Ensure we are dropping inside the correct day block (simple check: is draggable child of this block?)
            // Actually, we might want to allow moving between days? User said "miedzy soba", implies reordering. Moving between days might be complex (changing dates?).
            // Let's restrict to same day for now to avoid logic mess.
            if (draggable && block.contains(draggable)) {
                if (afterElement == null) {
                    block.appendChild(draggable)
                } else {
                    block.insertBefore(draggable, afterElement)
                }
            }
        })

		for (let i = 0; i < 5; i++) {
			const container = document.createElement('div')
            container.className = 'event-container' // Add class for CSS
            container.draggable = true // Enable Drag
            
            container.addEventListener('dragstart', () => {
                container.classList.add('dragging')
            })

            container.addEventListener('dragend', () => {
                container.classList.remove('dragging')
            })

			const checkbox = document.createElement('input')
			checkbox.type = 'checkbox'
            checkbox.className = 'toggle-checkbox' // Add class for selection

            // Promote button (moved to header)
			const promoteInput = document.createElement('input')
			promoteInput.type = 'checkbox'
			promoteInput.className = 'promowane'
			const promoteLabel = document.createElement('label')
            promoteLabel.style.cursor = 'pointer';
            promoteLabel.style.marginLeft = '10px';
            promoteLabel.style.marginRight = '5px';
            promoteLabel.style.display = 'none'; // Hidden by default
			promoteLabel.appendChild(promoteInput)
			promoteLabel.append(' ⭐') // Minimalist icon
            
            // Prevent expanding/collapsing when clicking promote
            promoteLabel.addEventListener('click', function(e) { e.stopPropagation(); });


			const toggle = document.createElement('label')
            toggle.style.display = 'flex';
            toggle.style.alignItems = 'center';
            toggle.style.cursor = 'pointer';

			toggle.appendChild(checkbox)
			toggle.append(` Wydarzenie taneczne ${i + 1} `) 
            toggle.appendChild(promoteLabel)



			const eventBlock = document.createElement('div')
			eventBlock.className = 'event-block'
			eventBlock.style.display = 'none'

			const selectMiasto = document.createElement('select')
			selectMiasto.className = 'miasto'
			selectMiasto.innerHTML =
				Object.keys(miejscaWgMiasta)
					.map(m => `<option value="${m}">${m}</option>`)
					.join('') + '<option value="Inne">Inne</option>'

			const inputMiastoInne = document.createElement('input')
			inputMiastoInne.className = 'miasto-inne'
			inputMiastoInne.placeholder = 'Wpisz miasto'
			inputMiastoInne.style.display = 'none'

			const selectMiejsce = document.createElement('select')
			selectMiejsce.className = 'miejsce'

			const inputMiejsceInne = document.createElement('input')
			inputMiejsceInne.className = 'miejsce-inne'
			inputMiejsceInne.placeholder = 'Wpisz miejsce'
			inputMiejsceInne.style.display = 'none'

			const inputLink = document.createElement('input')
			inputLink.type = 'text'
			inputLink.className = 'link'
			inputLink.placeholder = 'Link'

			const opisInput = document.createElement('input')
			opisInput.type = 'text'
			opisInput.className = 'opis'
			opisInput.placeholder = 'Krótki opis'
            
			const styleBox = document.createElement('div')
			styleBox.className = 'checkboxes'
			styleBox.innerHTML = style
				.map(s => `<label><input type="checkbox" class="styl" value="${s}"> ${s}</label>`)
				.join('')

			function updateMiejscaOptions(miasto) {
				if (miasto === 'Inne') {
					selectMiejsce.style.display = 'none'
					inputMiejsceInne.style.display = 'block'
					inputMiastoInne.style.display = 'block'
				} else {
					selectMiejsce.style.display = 'block'
					inputMiejsceInne.style.display = 'none'
					inputMiastoInne.style.display = 'none'
					selectMiejsce.innerHTML =
						(miejscaWgMiasta[miasto] || []).map(m => `<option value="${m}">${m}</option>`).join('') +
						'<option value="Inne">Inne</option>'
				}
			}

			selectMiasto.addEventListener('change', function () {
				updateMiejscaOptions(this.value)
			})
			selectMiejsce.addEventListener('change', function () {
				inputMiejsceInne.style.display = this.value === 'Inne' ? 'block' : 'none'
			})
			checkbox.addEventListener('change', function () {
				eventBlock.style.display = this.checked ? 'block' : 'none'
                promoteLabel.style.display = this.checked ? 'inline-block' : 'none'
                if (typeof updateEventCounter === 'function') updateEventCounter();
			})

			updateMiejscaOptions(selectMiasto.value)

			eventBlock.append(
				selectMiasto,
				inputMiastoInne,
				selectMiejsce,
				inputMiejsceInne,
				opisInput,
				styleBox,
				inputLink
			)
			container.append(toggle, eventBlock)
			block.appendChild(container)
		}
		form.appendChild(block)
	})

	// Filtrowanie
	const filterSelect = document.getElementById('filter-select')
	filterSelect.addEventListener('change', applyFilter)

	function applyFilter() {
		const value = filterSelect.value
		const blocks = document.querySelectorAll('.day-block')

		if (value === 'all') {
			blocks.forEach(block => {
				block.style.display = 'block'
			})
			return
		}

		if (value === 'thisweek') {
			const today = new Date()
			const currentDayOfWeek = today.getDay()

			blocks.forEach((block, index) => {
				const blockDay = parseInt(block.dataset.dzienTygIndex)
				const blockDate = new Date(block.dataset.date)

				// Oblicz, ile dni pozostało do najbliższego czwartku
				let daysUntilThursday
				if (currentDayOfWeek <= 4) {
					daysUntilThursday = 4 - currentDayOfWeek
				} else {
					daysUntilThursday = 4 + (7 - currentDayOfWeek)
				}

				const nextThursday = new Date(today)
				nextThursday.setDate(today.getDate() + daysUntilThursday + 1)
				nextThursday.setHours(0, 0, 0, 0)

				const nextSunday = new Date(nextThursday)
				nextSunday.setDate(nextThursday.getDate() + 3)

				const blockDateNormalized = new Date(blockDate)
				blockDateNormalized.setHours(0, 0, 0, 0)

				const show = blockDateNormalized >= nextThursday && blockDateNormalized <= nextSunday
				
				// Ukryj poniedziałek (dzienTygIndex == 1)
				const isMonday = block.dataset.dzienTygIndex == '1';
				
				block.style.display = (show && !isMonday) ? 'block' : 'none'
			})
			return
		}

		if (value === 'weekend') {
			let firstFridayIndex = null
			let fridayCount = 0

			dni.forEach((d, i) => {
				if (d.dzienTygIndex === 5) {
					fridayCount++
					if (fridayCount === 1) firstFridayIndex = i
				}
			})

			blocks.forEach((block, index) => {
				let show = false
				if (firstFridayIndex !== null) {
					show = [firstFridayIndex, firstFridayIndex + 1, firstFridayIndex + 2].includes(index)
				}
				block.style.display = show ? 'block' : 'none'
			})
		}
	}

	document.getElementById('generuj-btn').addEventListener('click', generujPost)
	document.getElementById('import-btn').addEventListener('click', importujZFacebooka)
	applyFilter()

    function importujZFacebooka() {
        const jsonText = document.getElementById('import-fb-data').value;
        if (!jsonText.trim()) {
            alert('Wklej najpierw JSON!');
            return;
        }

        try {
            const events = JSON.parse(jsonText);
            let importedCount = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Oblicz najbliższą niedzielę
            let nextSunday = new Date(today);
            if (today.getDay() === 0) {
                 nextSunday = new Date(today);
            } else {
                 nextSunday.setDate(today.getDate() + (7 - today.getDay()));
            }
            nextSunday.setHours(23, 59, 59, 999);

            // Helper do wyciągania ID
            const getIds = (url) => {
                if (!url) return [];
                const matches = url.match(/\d{8,}/g); 
                return matches || [];
            };

            // DEDUPLIKACJA INPUTU
            const uniqueEvents = [];
            events.forEach(ev => {
                const newIds = getIds(ev.url);
                const isDuplicate = uniqueEvents.some(existing => {
                    const existingIds = getIds(existing.url);
                    if (newIds.some(id => existingIds.includes(id))) return true;
                    if (existing.url === ev.url) return true;
                    return false;
                });
                
                if (!isDuplicate) {
                    uniqueEvents.push(ev);
                } else {
                    console.log(`Ignoruję duplikat wewnątrz JSONa: ${ev.title}`);
                }
            });

            uniqueEvents.forEach(ev => {
                let parsedDate = parsujDateFB(ev.rawDate);
                if (parsedDate && parsedDate < today) {
                    const descDate = parsujDateFB(ev.description);
                    if (descDate && descDate >= today) parsedDate = descDate;
                }
                if (!parsedDate) parsedDate = parsujDateFB(ev.title);
                if (!parsedDate) parsedDate = parsujDateFB(ev.description);
                
                if (!parsedDate) return;
                if (parsedDate < today || parsedDate > nextSunday) return;

                const dayBlock = Array.from(document.querySelectorAll('.day-block')).find(block => {
                    const d = new Date(block.dataset.date);
                    return d.getDate() === parsedDate.getDate() && d.getMonth() === parsedDate.getMonth();
                });

                if (dayBlock) {
                    const newIds = getIds(ev.url);
                    const alreadyExists = Array.from(dayBlock.querySelectorAll('.event-block')).some(eb => {
                        const linkInput = eb.querySelector('.link');
                        const linkVal = linkInput ? linkInput.value : '';
                        if (!linkVal || linkVal.trim() === "") return false;
                        const existingIds = getIds(linkVal);
                        if (newIds.some(id => existingIds.includes(id))) return true;
                        if (linkVal === ev.url) return true;
                        return false;
                    });

                    if (alreadyExists) {
                        console.log(`Pominięto duplikat na liście: ${ev.title}`);
                        return;
                    }

                    const freeSlot = Array.from(dayBlock.querySelectorAll('.event-block')).find(el => el.style.display === 'none');
                    
                    if (freeSlot) {
                        const checkbox = freeSlot.previousElementSibling.querySelector('.toggle-checkbox');
                        checkbox.checked = true;
                        freeSlot.style.display = 'block';

                        const promoteInput = freeSlot.previousElementSibling.querySelector('.promowane');
                        if (promoteInput && promoteInput.parentElement) {
                            promoteInput.parentElement.style.display = 'inline-block';
                        }
                        
                        const miastoInput = freeSlot.querySelector('.miasto-inne');
                        const miastoSelect = freeSlot.querySelector('.miasto');
                        const miejsceInput = freeSlot.querySelector('.miejsce-inne');
                        const miejsceSelect = freeSlot.querySelector('.miejsce');
                        const opisInput = freeSlot.querySelector('.opis');
                        const linkInput = freeSlot.querySelector('.link');



                        let znalezioneMiasto = 'Inne';
                        let dopasowaneMiejsce = null;

                        const locationLower = (ev.location || '').toLowerCase();
                        const titleLower = (ev.title || '').toLowerCase();
                        const descriptionLower = (ev.description || '').toLowerCase();
                        
                        const textForPlace = (locationLower + ' ' + titleLower + ' ' + descriptionLower);

                        for (const [adres, miejsce] of Object.entries(adresyMap)) {
                            if (textForPlace.includes(adres)) {
                                dopasowaneMiejsce = miejsce;
                                
                                let forcedCity = null;
                                for (const [key, city] of Object.entries(adresMiastoSztywne)) {
                                    if (adres.includes(key)) {
                                        forcedCity = city;
                                        break;
                                    }
                                }

                                if (forcedCity) {
                                    console.log(`[CITY FORCED] Address '${adres}' forces city '${forcedCity}'`);
                                    znalezioneMiasto = forcedCity;
                                } else {
                                    let bestCity = null;
                                    for (const [miasto, miejsca] of Object.entries(miejscaWgMiasta)) {
                                        if (miejsca.includes(miejsce)) {
                                            if (!bestCity) bestCity = miasto; 
                                            const miastoLower = miasto.toLowerCase();
                                            if (textForPlace.includes(miastoLower)) {
                                                bestCity = miasto;
                                                break;
                                            }
                                            if (miastoLower.endsWith('e') || miastoLower.endsWith('a')) {
                                                const stem = miastoLower.slice(0, -1);
                                                if (textForPlace.includes(stem)) {
                                                    bestCity = miasto;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    znalezioneMiasto = bestCity || 'Inne';
                                }
                                break;
                            }
                        }

                        if (!dopasowaneMiejsce) {
                            for (const m in miejscaWgMiasta) {
                                if (locationLower.includes(m.toLowerCase())) {
                                    znalezioneMiasto = m;
                                    break;
                                }
                            }
                        }

                        console.log(`[FINAL DECISION] City: "${znalezioneMiasto}", Place: "${dopasowaneMiejsce}"`);

                        miastoSelect.value = znalezioneMiasto;
                        miastoSelect.dispatchEvent(new Event('change'));

                        if (dopasowaneMiejsce) {
                            miejsceSelect.value = dopasowaneMiejsce;
                            miejsceSelect.dispatchEvent(new Event('change'));
                        } else if (znalezioneMiasto === 'Inne') {
                            miastoInput.value = ev.location || '';
                        } else {
                             miejsceInput.value = ev.location || '';
                             miejsceSelect.value = 'Inne';
                             miejsceSelect.dispatchEvent(new Event('change'));
                        }



                        const checkboxes = freeSlot.querySelectorAll('input.styl');
                        checkboxes.forEach(cb => cb.checked = false);

                        const textToSearch = (titleLower + ' ' + locationLower + ' ' + (ev.description || '')).toLowerCase();
                        
                        Object.entries(styleKeywords).forEach(([key, val]) => {
                            if (textToSearch.includes(key)) {
                                const cb = Array.from(checkboxes).find(c => c.value === val);
                                if (cb) cb.checked = true;
                            }
                        });


                        opisInput.value = ''; 
                        linkInput.value = ev.url;
                        importedCount++;
                    }
                }
            });

            document.getElementById('import-fb-data').value = ''; 
            alert(`Zaimportowano ${importedCount} wydarzeń!`);
            if (typeof updateEventCounter === 'function') updateEventCounter();

            // AUTO-COPY SCRAPER
            fetch('fb_scraper.js')
                .then(r => r.text())
                .then(text => {
                    navigator.clipboard.writeText(text).then(() => {
                        console.log('Scraper skopiowany do schowka!');
                    });
                })
                .catch(err => console.error('Nie udało się skopiować scrapera:', err));

        } catch (e) {
            console.error(e);
            alert('Błąd parsowania JSON. Sprawdź czy skopiowałeś poprawnie.');
        }
    }

    function parsujDateFB(text) {
        if (!text) return null;
        text = text.toUpperCase();
        
        const now = new Date();
        const currentYear = now.getFullYear();

        if (text.includes('DZISIAJ')) return now;
        if (text.includes('JUTRO')) return dodajDni(now, 1);
        if (text.includes('POJUTRZE')) return dodajDni(now, 2);

        // 1. Oczyszczanie ze śmieci typu "Popularne", "W trakcie"
        // Jeśli linia nie zawiera cyfry ani nazwy dnia, pewnie jest śmieciem. Szukamy w tytule? 
        // W scrapperze przekazujemy rawDate jako linię 0. Czasem data jest w tytце.
        // Tutaj spróbujmy wyłapać dni tygodnia.

        const dniTyg = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA'];
        const dniSkroty = ['NIE', 'PON', 'WTO', 'ŚRO', 'CZW', 'PIĄ', 'PT', 'SOB']; 
        
        // Mapowanie skrótów na index dnia (0-6)
        const dniMap = {
            'NIEDZIELA': 0, 'NIE': 0, 'ND': 0,
            'PONIEDZIAŁEK': 1, 'PON': 1, 'PN': 1,
            'WTOREK': 2, 'WTO': 2, 'WT': 2,
            'ŚRODA': 3, 'ŚRO': 3, 'SR': 3,
            'CZWARTEK': 4, 'CZW': 4,
            'PIĄTEK': 5, 'PIĄ': 5, 'PT': 5,
            'SOBOTA': 6, 'SOB': 6, 'SB': 6
        };

        // Obsługa "SOBOTA W TYM TYGODNIU" lub "SOB O ..." lub "SOB., 21:00"
        // Jeśli nie wykryto konkretnej daty (liczb), a jest dzień tygodnia i coś po nim
        const hasSpecificDate = /(\d{1,2})\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU)/.test(text) || /(\d{1,2})\.(\d{1,2})/.test(text);

        if (!hasSpecificDate) {
            for (const [key, val] of Object.entries(dniMap)) {
                if (text.includes(key)) {
                    // Znajdź datę tego dnia w najbliższej przyszłości (lub dziś)
                    const todayDay = now.getDay();
                    const targetDay = val;
                    let diff = targetDay - todayDay;
                    if (diff < 0) diff += 7; // Jeśli minął, to bierzemy następy (np. dziś Środa, szukamy Wtorku -> za 6 dni)
                    
                    // Jeśli text zawiera "W TYM TYGODNIU", a diff sugerowałby przeszłość (gdybyśmy nie dodali 7), to logicznie FB usunęłoby event.
                    // Ale dla "SOB., 21:00" zakładamy najbliższą sobotę.
                    return dodajDni(now, diff);
                }
            }
        }

        // Szukamy np. "2 LUT"
        const months = {
            'STY': 0, 'LUT': 1, 'MAR': 2, 'KWI': 3, 'MAJ': 4, 'CZE': 5,
            'LIP': 6, 'SIE': 7, 'WRZ': 8, 'PAŹ': 9, 'LIS': 10, 'GRU': 11
        };

        const regex = /(\d{1,2})\s+(STY|LUT|MAR|KWI|MAJ|CZE|LIP|SIE|WRZ|PAŹ|LIS|GRU)/;
        const match = text.match(regex);

        if (match) {
            const day = parseInt(match[1]);
            const monthCode = match[2];
            const month = months[monthCode];
            
            const d = new Date(currentYear, month, day);
            // Wykrywanie roku
            if (d < new Date(now.getTime() - 86400000 * 60)) { // Jeśli data jest > 2 miesiace temu, to pewnie przyszły rok
                 d.setFullYear(currentYear + 1);
            }
            return d;
        }

        // Obsługa formatu DD.MM (np. 31.01)
        const regexDot = /(\d{1,2})\.(\d{1,2})/;
        const matchDot = text.match(regexDot);
        if (matchDot) {
             const day = parseInt(matchDot[1]);
             const month = parseInt(matchDot[2]) - 1; // JS miesiące są 0-11
             const d = new Date(currentYear, month, day);
             
             // Rok check
             if (d < new Date(now.getTime() - 86400000 * 60)) { 
                 d.setFullYear(currentYear + 1);
            }
            return d;
        }

        return null;
    }

    function updateEventCounter() {
        const count = document.querySelectorAll('.event-block[style*="display: block"]').length;
        const counterEl = document.getElementById('event-counter');
        if (counterEl) counterEl.textContent = `Liczba wgranych wydarzeń: ${count}`;
    }

    // Obsługa Enter i Auto-Paste w textarea
    const importArea = document.getElementById('import-fb-data');
    if (importArea) {
        // Enter
        importArea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                importujZFacebooka();
            }
        });

        // Auto-import na wklejenie
        importArea.addEventListener('input', function(e) {
            const val = this.value.trim();
            if (val.startsWith('[') && val.endsWith(']')) {
                // Mały timeout żeby upewnić się że wklejanie się zakończyło
                setTimeout(() => {
                    importujZFacebooka();
                }, 300);
            }
        });

        // Auto-paste ze schowka po kliknięciu (jeśli puste)
        importArea.addEventListener('click', async function() {
            if (this.value.trim().length > 0) return; // Nie nadpisuj jeśli coś już jest

            try {
                const text = await navigator.clipboard.readText();
                const trimmed = text.trim();
                // Sprawdź czy wygląda jak nasz JSON z FB
                if (trimmed.startsWith('[') && trimmed.endsWith(']') && trimmed.includes('rawDate')) {
                    this.value = trimmed;
                    // Trigger import
                    importujZFacebooka();
                }
            } catch (err) {
                // Ignorujemy błędy uprawnień (np. użytkownik zablokował dostęp do schowka)
                console.log('Clipboard read failed or denied:', err);
            }
        });
    }

    // Przycisk kopiowania scrapera
    const btnCopyScraper = document.getElementById('copy-scraper-btn');
    if (btnCopyScraper) {
        btnCopyScraper.addEventListener('click', function(e) {
            e.preventDefault();
            fetch('fb_scraper.js?v=' + new Date().getTime())
                .then(r => r.text())
                .then(text => {
                     navigator.clipboard.writeText(text);
                     const originalText = btnCopyScraper.textContent;
                     btnCopyScraper.textContent = "✅ Skopiowano!";
                     setTimeout(() => btnCopyScraper.textContent = originalText, 1500);
                });
        });
    }

    updateEventCounter();
    updateTitle(); // Inicjalizacja tytułu
    initInbox();   // Inicjalizacja skrzynki odbiorczej
})

// --- INBOX HELPER ---
function initInbox() {
    const urlInput = document.getElementById('google-sheet-url');
    const checkBtn = document.getElementById('check-inbox-btn');
    const container = document.getElementById('inbox-container');

    // Load saved URL
    const savedUrl = localStorage.getItem('party_inbox_url');
    if (savedUrl) urlInput.value = savedUrl;

    // Save URL on change
    urlInput.addEventListener('change', () => {
        localStorage.setItem('party_inbox_url', urlInput.value);
    });

    checkBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Wklej najpierw link do pliku CSV!');
            return;
        }

        checkBtn.disabled = true;
        checkBtn.textContent = '⏳ Pobieranie...';

        fetch(url)
            .then(r => r.text())
            .then(csvText => {
                const rows = csvText.split('\n').map(r => r.trim()).filter(r => r);
                // Assume Row 1 is header, skip it.
                // Rows structure: Timestamp, Link, ...
                
                const pendingItems = [];
                const processed = JSON.parse(localStorage.getItem('party_inbox_done') || '[]');

                // Start from index 1 (skip header)
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    // Smart split for CSV (handling quotes)
                    const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
                    
                    const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
                    
                    // Find Link Column
                    const linkIndex = cleanCols.findIndex(c => c.includes('facebook.com') || c.includes('fb.me'));
                    
                    if (linkIndex !== -1) {
                        const link = cleanCols[linkIndex];
                        
                        // Collect other info (skip Timestamp [0] and Link)
                        const extraInfo = cleanCols
                            .filter((c, idx) => idx !== 0 && idx !== linkIndex && c.length > 0)
                            .join(' | ');

                        if (!processed.includes(link)) {
                            pendingItems.push({ link, info: extraInfo });
                        }
                    }
                }

                renderInbox(pendingItems);
                checkBtn.disabled = false;
                checkBtn.textContent = '🔄 Sprawdź nowe zgłoszenia';
            })
            .catch(err => {
                console.error(err);
                alert('Błąd pobierania CSV. Sprawdź czy link jest poprawny (musi być opublikowany jako CSV).');
                checkBtn.disabled = false;
                checkBtn.textContent = '🔄 Sprawdź nowe zgłoszenia';
            });
    });

    function renderInbox(items) {
        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = '<div style="color: grey; font-style: italic;">Brak nowych zgłoszeń (lub wszystkie zatwierdzone).</div>';
            return;
        }

        items.forEach(item => {
            const link = item.link;
            const info = item.info;

            const div = document.createElement('div');
            div.className = 'inbox-item'; // Use CSS class
            div.style.padding = '10px';
            div.style.marginBottom = '5px';
            div.style.borderRadius = '5px';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.borderLeft = '4px solid var(--cuban-gold)'; // Use CSS var
            div.style.background = 'white';
            div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.flexDirection = 'column';

            const linkText = document.createElement('a');
            linkText.href = link;
            linkText.target = '_blank';
            linkText.textContent = link.length > 40 ? link.substring(0, 40) + '...' : link;
            linkText.style.fontWeight = 'bold';
            linkText.style.color = 'var(--cuban-blue)';
            linkText.style.textDecoration = 'none';

            contentDiv.appendChild(linkText);

            if (info) {
                const infoText = document.createElement('span');
                infoText.textContent = info;
                infoText.style.fontSize = '0.85em';
                infoText.style.color = '#666';
                infoText.style.marginTop = '2px';
                contentDiv.appendChild(infoText);
            }

            div.appendChild(contentDiv);

            const actions = document.createElement('div');
            
            const btnCopy = document.createElement('button');
            btnCopy.textContent = '📋';
            btnCopy.style.margin = '0 5px';
            btnCopy.title = 'Skopiuj link';
            btnCopy.onclick = () => {
                navigator.clipboard.writeText(link);
                btnCopy.textContent = '✅';
                setTimeout(()=>btnCopy.textContent='📋', 1000);
            };

            const btnDone = document.createElement('button');
            btnDone.textContent = '✔️ Zatwierdź';
            btnDone.style.background = '#2ed573';
            btnDone.style.margin = '0 5px';
            btnDone.title = 'Oznacz jako zrobione (znika z listy)';
            btnDone.onclick = () => {
                markAsDone(link);
                div.remove();
                if (container.children.length === 0) {
                    container.innerHTML = '<div style="color: grey; font-style: italic;">Wszystko zrobione! 🎉</div>';
                }
            };

            actions.append(btnCopy, btnDone);
            div.append(linkText, actions);
            container.append(div);
        });
    }

    function markAsDone(link) {
        const processed = JSON.parse(localStorage.getItem('party_inbox_done') || '[]');
        if (!processed.includes(link)) {
            processed.push(link);
            localStorage.setItem('party_inbox_done', JSON.stringify(processed));
        }
    }
}


// --- HELPERS TYTUŁOWE ---

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
}

function updateTitle() {
    const today = new Date();
    if (today.getDay() === 0) {
        today.setDate(today.getDate() + 1); // Jeśli Niedziela, liczymy dla Poniedziałku
    }
    
    // Ustal datę docelową (zazwyczaj bierze się datę "następnego" początku tygodnia jeśli jesteśmy na końcu)
    // Założenie: Generujemy post dla nadchodzącego tygodnia.
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1); 
    
    const weekNum = getWeekNumber(targetDate);
    
    // Odmienianie "tydzień" ? Nie, "na tydzień X".
    let weekString = weekNum.toString();
    // Opcjonalnie słownie dla małych liczb? Nie, "tydzień 5" jest OK. 
    // User chciał "tydzień czwarty".
    // 1 -> pierwszy, 2 -> drugi...
    const liczebniki = ["zerowy", "pierwszy", "drugi", "trzeci", "czwarty", "piąty", "szósty", "siódmy", "ósmy", "dziewiąty", "dziesiąty",
                        "jedenasty", "dwunasty", "trzynasty", "czternasty", "piętnasty"];
    
    let numerTekst = weekNum;
    if (weekNum < liczebniki.length) numerTekst = liczebniki[weekNum];

    const title = `🎉 Zestawienie imprezowe na tydzień ${numerTekst}`;
    
    const titleInput = document.getElementById('post-title');
    if (titleInput) titleInput.value = title;
}

function kopiujTytul() {
    const titleVal = document.getElementById('post-title').value;
    navigator.clipboard.writeText(titleVal);
    alert('Tytuł skopiowany!');
}

function generujPost() {
    updateTitle();
	const blocks = document.querySelectorAll('.day-block')
	let wynik = '🎉 Zestawienie imprezowe:\n\n'
	let wynikAnkieta = ''

	blocks.forEach(block => {
		if (block.style.display === 'none') return

		const containers = block.querySelectorAll('.event-block')
		const dzienTekst = block.querySelector('h3').textContent
		let dzienWiersz = ''

		containers.forEach(eventBlock => {
            // Checkbox: toggle-checkbox jest w labelu, który jest poprzednikiem eventBlocka?
            // Struktura DOM:
            // div > label(toggle) > checkbox
            // div > eventBlock
            // Nie. W generowaniu (linia 85): container (div) -> toggle (label) -> checkbox
            //                                               -> eventBlock
            // Więc eventBlock.previousElementSibling to toggle.
            
            const toggleLabel = eventBlock.previousElementSibling;
			const checkbox = toggleLabel.querySelector('input[type=checkbox]')
            
			if (!checkbox || !checkbox.checked) return

			const miasto = eventBlock.querySelector('.miasto')
			const miastoInne = eventBlock.querySelector('.miasto-inne')
			const miejsce = eventBlock.querySelector('.miejsce')
			const miejsceInne = eventBlock.querySelector('.miejsce-inne')
			const opis = eventBlock.querySelector('.opis')
			const link = eventBlock.querySelector('.link')
			const styleCbs = eventBlock.querySelectorAll('input.styl:checked')
			// Promote checkbox teraz jest w headerze (toggle-checkbox sibling)
			const promote = toggleLabel.querySelector('.promowane').checked

			const finalMiasto = miasto.value === 'Inne' ? miastoInne.value.trim() : miasto.value
			const finalMiejsce = miejsce.value === 'Inne' ? miejsceInne.value.trim() : miejsce.value
			const styleTekst = [...styleCbs].map(cb => cb.value).join('/')

			const prefix = promote ? '⭐ ' : '➡️ '
			dzienWiersz += `${prefix}${finalMiasto}: ${finalMiejsce} (${styleTekst})${
				opis.value.trim() ? ` – ${opis.value.trim()}` : ''
			}\n`
			if (link.value.trim()) dzienWiersz += `${link.value.trim()}\n`

			wynikAnkieta += `${dzienTekst}: ${finalMiasto} - ${finalMiejsce} (${styleTekst})\n`
		})

		if (dzienWiersz) wynik += `🗓️ ${dzienTekst}:\n${dzienWiersz}\n`
	})

	wynik += 'Do zobaczenia! 💃🕺\n@wszyscy\n\n'
    wynik += 'PS: Chcesz zgłosić imprezę taneczną, która odbędzie się w najbliższym czasie? Nic prostszego! Wystarczy, że wypełnisz ten formularz. Dzięki Twojej pomocy nie przegapimy żadnej okazji do tańca! ❤️\nhttps://tiny.pl/2bc8z7649\n\n'
    wynik += document.getElementById('hashtagi').value
	document.getElementById('wynik').value = wynik
	document.getElementById('ankieta').value = wynikAnkieta

	const ankietaDiv = document.getElementById('kopiuj-ankiete') || document.createElement('div')
	ankietaDiv.id = 'kopiuj-ankiete'
    // Clear previous
    ankietaDiv.innerHTML = '<h4>Kliknij, aby skopiować linię ankiety:</h4>';
	document.body.appendChild(ankietaDiv)
	// ankietaDiv.innerHTML = '<h4>Kliknij, aby skopiować linię ankiety:</h4>' // Powtórzenie

	wynikAnkieta
		.trim()
		.split('\n')
		.filter(l => l)
		.forEach(l => {
			const div = document.createElement('div')
			div.className = 'copy-line'
			div.style.marginBottom = '5px'
			const btn = document.createElement('button')
			btn.textContent = '📋 ' + l
			btn.onclick = () => {
				navigator.clipboard.writeText(l)
				btn.textContent = '✅ Skopiowano!'
				setTimeout(() => (btn.textContent = '📋 ' + l), 1000)
			}
			div.appendChild(btn)
			ankietaDiv.appendChild(div)
		})
}



function kopiujWynik() {
	const text = document.getElementById('wynik').value
	navigator.clipboard.writeText(text)
	alert('Skopiowano cały post!')
}
