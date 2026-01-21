// ----- pomoćne funkcije -----
function parseDateDM(dateStr) {
  const [d, m] = dateStr.split('.').map(Number);
  return new Date(new Date().getFullYear(), m - 1, d);
}
function dateFromISO(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function inRange(d, a, b) { return d >= a && d <= b; }
function daysBetween(a, b) { return Math.ceil((a - b) / (1000 * 60 * 60 * 24)); }

// ----- opšti parametri -----
const today = new Date();
let monthOffset = 0;

// ----- raspored (po tvom planu) -----
// Napomena: ne menjam oznake za oktobar i novembar 2025 (preskačem ih)
// Radne subote (format dd.mm)
const radneSubote = [
  "15.11", "18.04", "25.04", "09.05", "30.05"
];
// Onlajn nastava (ISO ranges)
const onlineRanges = [
  { from: '2025-12-22', to: '2025-12-27', cls: 'online' },
  { from: '2026-05-18', to: '2026-05-23', cls: 'online' }
];
// Kolokvijumske nedelje
const kolokvijumi = [
  { from: '2025-12-15', to: '2025-12-19', cls: 'kolokvijum' },
  { from: '2026-02-07', to: '2026-02-13', cls: 'kolokvijum' },
  { from: '2026-05-11', to: '2026-05-15', cls: 'kolokvijum' },
  { from: '2026-06-05', to: '2026-06-09', cls: 'kolokvijum' }
];
// Ispitni rokovi (ISO ranges)
const examRanges = [
  { from: '2026-02-18', to: '2026-03-02', cls: 'januarski' },
  { from: '2026-03-03', to: '2026-03-15', cls: 'februarski' },
  { from: '2026-06-15', to: '2026-06-27', cls: 'junski' },
  { from: '2026-06-29', to: '2026-07-11', cls: 'julski' },
  { from: '2026-08-24', to: '2026-09-05', cls: 'septembarski' },
  { from: '2026-09-07', to: '2026-09-19', cls: 'oktobarski' }
];
// Dodatni konkretni neradni dani (ako želiš da ubaciš državne praznike)
// Format: 'YYYY-MM-DD'
const extraNeradni = [
   // primer: '2026-01-01'
   "2026-02-16",
   "2026-02-17",
   "2026-04-10",
   "2026-04-13",
   "2026-05-01",
   "2026-01-01",
   "2026-01-02",
   "2026-01-03",
   "2026-01-04",
   "2026-01-05",
   "2026-01-06",
   "2026-01-07",
   "2026-01-08",
   "2026-01-09"
];



// ----- gradnja kalendara -----
const grid = document.getElementById('calendarGrid');

function markToday() {
  const t = new Date();
  const sel = document.querySelectorAll('.day[data-date]');
  sel.forEach(el => {
    if (el.getAttribute('data-date') === `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`)
      el.classList.add('today');
  });
}

function buildCalendar(offset) {
  grid.innerHTML = "";
  const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);

  for (let i = 0; i < 3; i++) {
    const monthDate = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const year = monthDate.getFullYear();
    const m = monthDate.getMonth();

    const monthDiv = document.createElement('div');
    monthDiv.className = 'month';
    const monthName = monthDate.toLocaleString('sr', { month: 'long', year: 'numeric' });
    monthDiv.innerHTML = `<h3>${monthName}</h3>
      <div class="weekdays">` +
      ['Pon', 'Uto', 'Sre', 'Cet', 'Pet', 'Sub', 'Ned'].map(w => `<div>${w}</div>`).join('') +
      `</div><div class="days"></div>`;
    grid.appendChild(monthDiv);

    const daysContainer = monthDiv.querySelector('.days');
    const firstDay = new Date(year, m, 1);
    let shift = (firstDay.getDay() + 6) % 7; // pomeramo da ponedeljak bude prvi

    for (let s = 0; s < shift; s++) {
      const empty = document.createElement('div');
      empty.className = 'day out';
      daysContainer.appendChild(empty);
    }

    const daysInMonth = new Date(year, m + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, m, d);
      const iso = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dmShort = `${d}.${dateObj.getMonth()+1}`;

      const el = document.createElement('div');
      el.className = 'day';
      el.setAttribute('data-date', iso);
      el.innerHTML = `<span class="date">${d}</span>`;

      // Preskakamo eksplicitno bojenje za okt i nov 2025 rade��i samo default - ni��ta posebno
      if (dateObj.getFullYear() === 2025 && (dateObj.getMonth() === 9 || dateObj.getMonth() === 10)) {
        // okt = 9, nov = 10 -> ostavi bez dodatnih override-a (kao ��to si tra�_io)
        // Ipak ozna�?i vikend kao neradni
        if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
          el.classList.add('neradni');
          el.title = "Neradni dan";
        }
        if (dateObj.getDay() === 6 && radneSubote.includes(dmShort)) {
          el.classList.remove('neradni');
          el.classList.add('nastava');
          el.setAttribute("title", "Nastava (radna subota)");
        }
        daysContainer.appendChild(el);
        continue;
      }

      // po defaultu: vikend neradni, ostalo nastava
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
        el.classList.add('neradni');
        el.setAttribute("title", "Neradni dan");
      } else {
        el.classList.add('nastava');
        el.setAttribute("title", "Nastava");
      }

      // konkretne radne subote (ako datum poklapa)
      if (dateObj.getDay() === 6 && radneSubote.includes(dmShort)) {
        el.classList.remove('neradni');
        el.classList.add('nastava');
          el.setAttribute("title", "Nastava (radna subota)");
      }

      // dodatni neradni dani (D�D�D_ �?D, ih �_eli�� dodati)
      if (extraNeradni.includes(iso)) {
        el.classList.remove('nastava');
        el.classList.add('neradni');
        el.setAttribute("title", "Neradni dan (praznik)");
      }

      // ispitni rokovi
      for (const r of examRanges) {
        const start = dateFromISO(r.from);
        const end = dateFromISO(r.to);
        if (inRange(dateObj, start, end)) {
          el.classList.add('ispit', r.cls);
          el.classList.remove('neradni');
          el.classList.remove('nastava');
          el.setAttribute("title", (el.getAttribute("title") || "") + " - " + r.cls + " ispitni rok");
        }
      }

      // kolokvijumi
      for (const k of kolokvijumi) {
        const s = dateFromISO(k.from), e = dateFromISO(k.to);
        if (inRange(dateObj, s, e)) {
          el.classList.add('kolokvijum');
          if (dateObj.getDay() === 6) {
            el.classList.remove('neradni');
          }
          el.setAttribute("title", (el.getAttribute("title") || "") + " - kolokvijum");
        }
      }

      // onlajn nedelje
      for (const o of onlineRanges) {
        const s = dateFromISO(o.from), e = dateFromISO(o.to);
        if (inRange(dateObj, s, e)) {
          el.classList.add('online');
          el.setAttribute("title", (el.getAttribute("title") || "") + " - onlajn nastava");
        }
      }

      // event indikator (ako postoji event sa datumom dd.mm)
      if (events.some(ev => ev.datum === `${d}.${dateObj.getMonth()+1}`)) {
        const indicator = document.createElement('div');
        indicator.className = 'event-indicator';
        el.appendChild(indicator);
      }

      // klik na dan - selektovanje i highlight u tabeli
      el.addEventListener('click', () => {
        document.querySelectorAll('.day').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');

        document.querySelectorAll("#eventsTable tbody tr").forEach(row => row.classList.remove("highlight"));
        document.querySelectorAll("#eventsTable tbody tr").forEach(row => {
          if (row.children[1].textContent.trim() === `${d}.${dateObj.getMonth()+1}`) {
            row.classList.add("highlight");
            setTimeout(() => row.classList.remove("highlight"), 1000);
          }
        });
      });

      daysContainer.appendChild(el);
    }
  }

  markToday();
}

buildCalendar(monthOffset);

const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    monthOffset -= 1;
    buildCalendar(monthOffset);
  });
  nextBtn.addEventListener("click", () => {
    monthOffset += 1;
    buildCalendar(monthOffset);
  });
}
// ----- popunjavanje tabele dešavanja (events) -----
(function renderEventsTable(){
  const tbody = document.querySelector("#eventsTable tbody");
  tbody.innerHTML = "";
  const now = new Date();
  const sorted = events.slice().sort((a,b) => {
    const pa = a.datum.split('.').map(Number), pb = b.datum.split('.').map(Number);
    // pretendujemo tekuću školsku godinu -> poređenje po MM-DD (simple)
    return (pa[1] - pb[1]) || (pa[0] - pb[0]);
  });

  sorted.forEach(ev => {
    const tr = document.createElement('tr');
    const daysLeft = (() => {
      try {
        const [d,m] = ev.datum.split('.').map(Number);
        let y = now.getFullYear();
        // ako je datum već prošao ove godine, pretpostavi sledeća godina (minimalno)
        const candidate = new Date(y, m-1, d);
        if (candidate < now) candidate.setFullYear(y+1);
        return daysBetween(candidate, now);
      } catch (e) { return "-"; }
    })();

    tr.innerHTML = `
      <td padding:6px;">${ev.naziv}</td>
      <td padding:6px;">${ev.datum}</td>
      <td padding:6px;">${ev.napomena || ''}</td>
      <td padding:6px;">${daysLeft === "-" ? "-" : daysLeft + " дана"}</td>
    `;
    tbody.appendChild(tr);
  });
})();

// ----- prikaz predmeta (isti kod koji već imaš) -----
(function setupPredmetiTable(){
  const predmetiBody = document.querySelector("#predmetiTable tbody");
  const totalEspbEl = document.getElementById("totalEspb");
  const avgOcenaEl = document.getElementById("avgOcena");

  function prikaziPredmete(predmeti) {
    predmetiBody.innerHTML = "";
    let totalEspb = 0;
    let ocenaZbir = 0;
    let brojPolozenih = 0;

    predmeti.forEach(p => {
       const tr = document.createElement("tr");
       tr.innerHTML = `
          <td>${p.naziv}</td>
          <td style="text-align:center">${p.espb}</td>
          <td style="text-align:center">${p.ocena !== null ? p.ocena : "-"}</td>
       `;
       predmetiBody.appendChild(tr);

       if (p.ocena !== null) {
          totalEspb += p.espb;
          ocenaZbir += p.ocena;
          brojPolozenih++;
       }
    });

    totalEspbEl.textContent = totalEspb;
    avgOcenaEl.textContent = brojPolozenih > 0 ? (ocenaZbir / brojPolozenih).toFixed(2) : "-";
  }

  // inicijalno prikazujemo postojece predmete iz predmeti.js
  const predmetiData = (typeof predmeti !== "undefined") ? predmeti : window.predmeti;
  if (predmetiData) prikaziPredmete(predmetiData);
})();
