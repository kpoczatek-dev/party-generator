
export function formatujDatePL(date) {
    const d = date.getDate().toString().padStart(2, '0')
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${d}.${m}`
}

export function dodajDni(date, ile) {
    const d = new Date(date)
    d.setDate(d.getDate() + ile)
    return d
}

export function generujDniOdJutra(ileDni, dniTygodnia) {
    const dzis = new Date()
    const start = dodajDni(dzis, 1) // Start from tomorrow
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

export function parsujDateFB(text) {
    if (!text) return null;
    text = text.toUpperCase();
    const now = new Date();
    const currentYear = now.getFullYear();

    // -1. ISO Date (from JSON-LD)
    if (text.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(text);
    }

    // 0. Relative dates
    if (text.includes('DZISIAJ')) return now;
    if (text.includes('JUTRO')) return dodajDni(now, 1);
    if (text.includes('POJUTRZE')) return dodajDni(now, 2);

    // 1. Explicit Date: "6 LUTEGO", "6 LUT"
    const miesiacMap = {
        'STYCZNIA': 0, 'STY': 0,
        'LUTEGO': 1, 'LUT': 1,
        'MARCA': 2, 'MAR': 2,
        'KWIETNIA': 3, 'KWI': 3,
        'MAJA': 4, 'MAJ': 4,
        'CZERWCA': 5, 'CZE': 5,
        'LIPCA': 6, 'LIP': 6,
        'SIERPNIA': 7, 'SIE': 7,
        'WRZEŚNIA': 8, 'WRZ': 8,
        'PAŹDZIERNIKA': 9, 'PAŹ': 9,
        'LISTOPADA': 10, 'LIS': 10,
        'GRUDNIA': 11, 'GRU': 11
    };
    
    // Match day + month name (full or short)
    const regexMonth = /(\d{1,2})\s+(STYCZNIA|STY|LUTEGO|LUT|MARCA|MAR|KWIETNIA|KWI|MAJA|MAJ|CZERWCA|CZE|LIPCA|LIP|SIERPNIA|SIE|WRZEŚNIA|WRZ|PAŹDZIERNIKA|PAŹ|LISTOPADA|LIS|GRUDNIA|GRU)/i;
    const matchMonth = text.match(regexMonth);

    if (matchMonth) {
        const day = parseInt(matchMonth[1], 10);
        const monthStr = matchMonth[2].toUpperCase();
        const monthIndex = miesiacMap[monthStr]; // 0-11

        let year = currentYear;
        // Roll over year logic: if current is Dec and event is Jan -> Next Year.
        // Simplified: if event month is < current month - 2, assume next year.
        const currentMonthIndex = now.getMonth();
        if (monthIndex < currentMonthIndex - 2) {
            year++;
        }
        return new Date(year, monthIndex, day);
    }

    // 2. Dot Format: "31.01"
    const regexDot = /(\d{1,2})\.(\d{1,2})/;
    const matchDot = text.match(regexDot);
    if (matchDot) {
        const day = parseInt(matchDot[1], 10);
        const monthIndex = parseInt(matchDot[2], 10) - 1;
        let year = currentYear;
        if (monthIndex < now.getMonth() - 2) year++;
        return new Date(year, monthIndex, day);
    }

    // 3. Day + Weekday: "31 SOBOTA", "31 SOB"
    const regexDayWeekday = /(\d{1,2})\s+(NIEDZIELA|NIE|ND|PONIEDZIAŁEK|PON|PN|WTOREK|WTO|WT|ŚRODA|ŚRO|SR|CZWARTEK|CZW|PIĄTEK|PIĄ|PT|SOBOTA|SOB|SB)/i;
    const matchDW = text.match(regexDayWeekday);
    
    if (matchDW) {
        const day = parseInt(matchDW[1], 10);
        const weekdayStr = matchDW[2].toUpperCase();
        
        const dniMap = {
            'NIEDZIELA': 0, 'NIE': 0, 'ND': 0,
            'PONIEDZIAŁEK': 1, 'PON': 1, 'PN': 1,
            'WTOREK': 2, 'WTO': 2, 'WT': 2,
            'ŚRODA': 3, 'ŚRO': 3, 'SR': 3,
            'CZWARTEK': 4, 'CZW': 4,
            'PIĄTEK': 5, 'PIĄ': 5, 'PT': 5,
            'SOBOTA': 6, 'SOB': 6, 'SB': 6
        };
        const targetWeekday = dniMap[weekdayStr];

        // Search range: Today to +90 days
        let candidate = new Date(now);
        candidate.setDate(candidate.getDate() - 1); 
        candidate.setHours(0,0,0,0);

        for(let i=0; i<120; i++) { 
            if (candidate.getDate() === day && candidate.getDay() === targetWeekday) {
                return new Date(candidate); 
            }
            candidate.setDate(candidate.getDate() + 1);
        }
    }
    
    // 4. Weekday Only: "SOBOTA" (implies next occurance)
    const regexWeekdayOnly = /(NIEDZIELA|NIE|ND|PONIEDZIAŁEK|PON|PN|WTOREK|WTO|WT|ŚRODA|ŚRO|SR|CZWARTEK|CZW|PIĄTEK|PIĄ|PT|SOBOTA|SOB|SB)/i;
    const matchW = text.match(regexWeekdayOnly);
    if (matchW) {
         const weekdayStr = matchW[1].toUpperCase();
         const dniMap = { 'NIEDZIELA':0, 'PONIEDZIAŁEK':1, 'WTOREK':2, 'ŚRODA':3, 'CZWARTEK':4, 'PIĄTEK':5, 'SOBOTA':6,
                          'NIE':0, 'PON':1, 'WTO':2, 'ŚRO':3, 'CZW':4, 'PIĄ':5, 'PT':5, 'SOB':6, 'SB':6, 'ND':0, 'WT':2, 'SR':3 };
         
         const targetDay = dniMap[weekdayStr];
         if (targetDay !== undefined) {
             const todayDay = now.getDay();
             let diff = targetDay - todayDay;
             if (diff < 0) diff += 7;
             return dodajDni(now, diff);
         }
    }

    return null;
}
