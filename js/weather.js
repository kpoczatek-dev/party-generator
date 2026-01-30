
export function initWeather(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Katowice Coords
    const LAT = 50.2649;
    const LON = 19.0238;

    // Calculate dates: Next Friday, Saturday, Sunday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-Sun, 1-Mon...
    
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    // Special case: If today is Saturday(6), simple math gives 6. Correct.
    // If today is Sunday(0), simple math gives 5. Correct.
    
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    
    // We need 3 days: Fri, Sat, Sun
    const dates = [];
    for(let i=0; i<3; i++) {
        const d = new Date(nextFriday);
        d.setDate(nextFriday.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const startDate = dates[0];
    const endDate = dates[2];

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max&timezone=Europe%2FBerlin&start_date=${startDate}&end_date=${endDate}`;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data.daily) return;
            
            const { time, weathercode, temperature_2m_max } = data.daily;
            
            let html = '';
            
            time.forEach((t, i) => {
                const dateObj = new Date(t);
                const dayName = dateObj.toLocaleDateString('pl-PL', { weekday: 'short' }).toUpperCase().replace('.', ''); 
                const dd = dateObj.getDate().toString().padStart(2, '0');
                const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const dateLabel = `(${dd}.${mm})`;

                const temp = Math.round(temperature_2m_max[i]);
                const code = weathercode[i];
                let icon = '❓';
                
                // WMO Codes Mapping (Simplified)
                if (code === 0) icon = '☀️';
                else if (code >= 1 && code <= 3) icon = '⛅';
                else if (code >= 45 && code <= 48) icon = '🌫';
                else if (code >= 51 && code <= 67) icon = '🌧';
                else if (code >= 71 && code <= 77) icon = '❄️';
                else if (code >= 80 && code <= 82) icon = '🌧';
                else if (code >= 95) icon = '⚡';
                
                html += `
                    <div style="background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #ddd; text-align: center; min-width: 50px;">
                        <div style="font-size: 0.7em; color: #555; font-weight: bold; margin-bottom: 2px;">${dayName} ${dateLabel}</div>
                        <div style="font-size: 1.1em; color: #333;">${icon} ${temp}°</div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        })
        .catch(err => {
            console.error('Weather error:', err);
            container.innerHTML = '<span style="color:red; font-size: 0.8em;">⚠️ Błąd pogody</span>';
        });
}
