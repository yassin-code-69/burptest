// --- GLOBAL VARIABLES ---
let courseMapping = {}; 
let teacherMapping = {}; 
let rawExcelData = []; 
let currentFilteredData = []; 

// 🔥 FIX: Local Routine File Connection
const ROUTINE_FILE_URL = "routine.xlsx"; 

const initialCourses = `CSE-1101: Introduction of Computer Science
CSE-1102: Analog Electronics
CSE-1103: Analog Electronics (Lab)
CSE-1104: Math-I (Differential Calculus & Coordinate Geometry)
CSE-1105: English I
CSE-1106: Business Organization
CSE-1201: Structural Programming Language
CSE-1202: Structural Programming Language Lab
CSE-1204: Digital Logic
CSE-1205: Digital Logic (Lab)
CSE-1203: Integral Calculus & Differential Equation
CSE-1206: English II
CSE-1301: Physics
CSE-1302: Physics (Lab)
CSE-1303: Electronic Device & Circuit
CSE-1304: Electronic Device & Circuit (Lab)
CSE-1305: Object Oriented Programming
CSE-1306: Object Oriented Programming (Lab)
CSE-1307: Government
CSE-2101: Programming Language (Java)
CSE-2102: Programming Language (Java) Lab
CSE-2103: Data Structure
CSE-2104: Data Structure (Lab)
CSE-2105: Discrete Mathematics
CSE-2106: Linear Algebra, Complex Variable
CSE-2201: Algorithm
CSE-2202: Algorithm (Lab)
CSE-2203: Microprocessor & Assembly Language
CSE-2204: Microprocessor & Assembly Language (Lab)
CSE-2205: Statistics & Probability
CSE-2301: Theory of Computation
CSE-2302: Data Communication
CSE-2303: Electrical Drives and Instrumentation
CSE-2304: Electrical Drives and Instrumentation (Lab)
CSE-2305: Web Programming
CSE-3101: Database System
CSE-3102: Database System (Lab)
CSE-3103: Operating System
CSE-3104: Operating System (Lab)
CSE-3105: Accounting
CSE-3106: VLSI Design
CSE-3201: Compiler Design
CSE-3202: Compiler Design (Lab)
CSE-3203: Digital System Design
CSE-3204: Digital System Design (Lab)
CSE-3205: Digital Electronics & Pulse Technique
CSE-3206: Software Engineering
CSE-3301: Pattern Recognition
CSE-3302: Pattern Recognition (Lab)
CSE-3303: Computer Network
CSE-3304: Computer Network (Lab)
CSE-3305: E-Commerce
CSE-3306: Numerical Method
CSE-4101: Project & Thesis I
CSE-4102: Artificial Intelligence
CSE-4103: Artificial Intelligence (Lab)
CSE-4104: Accounting & Introduction to Finance & International Trade
CSE-4105: Elective Major I
CSE-4201: Project & Thesis II
CSE-4202: Computer Graphics
CSE-4203: Computer Graphics (Lab)
CSE-4204: System Analysis & Design
CSE-4205: System Analysis & Design (Lab)
CSE-4301: Project & Thesis III
CSE-4302: Elective Major II (System Programming)
CSE-4303: Peripheral and Interfacing
CSE-4304: Computer Organization & Architecture`;

const initialTeachers = `AK: Ashraful Kabir
AKP: Akash Kumar Pal
ARK: Mohammad Arifin Rahman Khan
AS: Antor Sarkar
DZH: Dr. Zakir Hossain
FAN: Faria Afrin Niha
FH: Md. Fahad Hossain
IHS: Md. Ibrahim Hosen Sojib
KTT: Khandaker Tanha Tasnia
MH: Md. Mesbahuddin Hasib
MM: Mohammad Mamun
MMA: Mohammad Mamun
MN: Mahmud Naeem
NAN: Nurul Amin Nahid
PSC: Pabon Shaha Chowdhury
QJA: Quazi Jamil Azher
RAS: Reshma Ahmed Swarna
RK: Rokeya Khatun
RU: Md. Riaz Uddin
RUZ: Rifat Uz Zaman
SAM: Sarah Mohsin
SI: Md. Sadiq Iqbal
SJ: Sumaia Jahan
SM: Shishir Mallick
SSN: Siam Sadik Nayem
TH: Tanveer Hasan
UKP: Prof Dr. Uzzal Kumar Prodhan
US: Umme Salma`;

function normalizeKey(str) {
    if (!str) return "";
    return str.toString().toUpperCase().replace(/[\s-]/g, ''); 
}

let userPrefs = { compact: false, use12Hour: true, showRoom: true, showTeacher: true };

window.onload = async () => {
    document.getElementById('courseMapData').value = localStorage.getItem('course_map') || initialCourses;
    document.getElementById('teacherMapData').value = localStorage.getItem('teacher_map') || initialTeachers;
    
    const savedTheme = localStorage.getItem('routine_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').innerText = savedTheme === 'dark' ? '☀️' : '🌙';
    
    const savedView = localStorage.getItem('routine_view') || 'list';
    updateToggleUI(savedView);
    
    loadPreferences();
    syncMappings();


    // 🔥 FIX: এন্টার (Enter) বাটন চাপলে অটোমেটিক সার্চ হওয়ার কোড
    document.querySelectorAll('.search-bar input').forEach(input => {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // পেজ রিলোড হওয়া আটকাবে
                searchRoutine();        // সার্চ ফাংশন চালু করবে
            }
        });
    });

    
    // 🔥 অটো লোড ফাংশন কল
    await autoLoadRoutine();
    
    setInterval(() => {
        updateLiveStatus();
        updateLiveBanner();
    }, 60000); 
};

function loadPreferences() {
    const saved = localStorage.getItem('routine_prefs');
    if (saved) userPrefs = JSON.parse(saved);
    document.getElementById('prefCompact').checked = userPrefs.compact;
    document.getElementById('pref12Hour').checked = userPrefs.use12Hour;
    document.getElementById('prefRoom').checked = userPrefs.showRoom;
    document.getElementById('prefTeacher').checked = userPrefs.showTeacher;
    applyPreferencesToBody();
}

function updatePreferences() {
    userPrefs.compact = document.getElementById('prefCompact').checked;
    userPrefs.use12Hour = document.getElementById('pref12Hour').checked;
    userPrefs.showRoom = document.getElementById('prefRoom').checked;
    userPrefs.showTeacher = document.getElementById('prefTeacher').checked;
    
    localStorage.setItem('routine_prefs', JSON.stringify(userPrefs));
    applyPreferencesToBody();
    
    const activeTab = document.querySelector('.day-tab.active');
    const activeDay = activeTab ? activeTab.innerText.split(' (')[0] : "All Days";
    if (currentFilteredData.length > 0) {
        renderRoutineForDay(activeDay);
        updateLiveBanner();
    }
}

function applyPreferencesToBody() {
    const body = document.body;
    userPrefs.compact ? body.classList.add('pref-compact') : body.classList.remove('pref-compact');
    !userPrefs.showRoom ? body.classList.add('pref-hide-rooms') : body.classList.remove('pref-hide-rooms');
    !userPrefs.showTeacher ? body.classList.add('pref-hide-teachers') : body.classList.remove('pref-hide-teachers');
}

// 🔥 FIX: ওয়েবসাইট লোড হলেই লোকাল routine.xlsx অটো লোড হবে
async function autoLoadRoutine() {
    const statusDiv = document.getElementById('fileStatus');
    statusDiv.innerHTML = "⏳ Loading Database...";
    try {
        const response = await fetch(ROUTINE_FILE_URL);
        if (!response.ok) throw new Error("Routine File not found in folder");
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {type: 'array'});
        rawExcelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});
        
        statusDiv.innerHTML = "✅ Database Connected!";
        statusDiv.style.color = "#10b981";
        
    } catch (error) {
        statusDiv.innerHTML = "⚠️ Auto-load failed. Please upload manually.";
        statusDiv.style.color = "#ef4444";
        console.error(error);
    }
}

document.getElementById('themeToggle').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').innerText = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('routine_theme', newTheme);
};

function updateToggleUI(mode) {
    const btnList = document.getElementById('btnListView');
    const btnGrid = document.getElementById('btnGridView');
    if (mode === 'matrix') {
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
    } else {
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
    }
}

function switchViewMode(mode) {
    localStorage.setItem('routine_view', mode);
    updateToggleUI(mode);
    const activeTab = document.querySelector('.day-tab.active');
    const activeDay = activeTab ? activeTab.innerText.split(' (')[0] : "All Days";
    if (currentFilteredData.length > 0) renderRoutineForDay(activeDay);
}
document.getElementById('btnListView').onclick = () => switchViewMode('list');
document.getElementById('btnGridView').onclick = () => switchViewMode('matrix');

function syncMappings() {
    courseMapping = {}; teacherMapping = {};
    document.getElementById('courseMapData').value.split('\n').forEach(l => {
        const [k, ...vParts] = l.split(':'); 
        const v = vParts.join(':');
        if(k) courseMapping[normalizeKey(k)] = v?.trim() || "";
    });
    document.getElementById('teacherMapData').value.split('\n').forEach(l => {
        const [k, ...vParts] = l.split(':'); 
        const v = vParts.join(':');
        if(k) teacherMapping[normalizeKey(k)] = v?.trim() || "";
    });
}

function saveMappings() {
    localStorage.setItem('course_map', document.getElementById('courseMapData').value);
    localStorage.setItem('teacher_map', document.getElementById('teacherMapData').value);
    syncMappings();
    alert("Configurations Saved!");
    document.getElementById('mappingModal').classList.add('hidden');
    
    const activeTab = document.querySelector('.day-tab.active');
    if(activeTab && currentFilteredData.length > 0) {
        renderRoutineForDay(activeTab.innerText.split(' (')[0]);
    }
    updateLiveBanner();
}

function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); }

document.getElementById('fileInput').onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    document.getElementById('fileStatus').innerText = `✅ ${file.name} Ready`;
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, {type: 'binary'});
        rawExcelData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1});
    };
};

function formatTime(rawTime) {
    if (!rawTime) return "";
    let clean = rawTime.toString().replace(/\./g, ":").replace(/\-/g, " - ").replace(/[a-zA-Z]/g, "").trim();
    if (userPrefs.use12Hour) {
        return clean.split(' - ').map(timePart => {
            let [h, m] = timePart.trim().split(':');
            h = parseInt(h);
            if (isNaN(h)) return timePart;
            let suffix = "AM";
            if (h >= 1 && h <= 7) { h += 12; } 
            if (h >= 12) { suffix = "PM"; if (h > 12) h -= 12; }
            return `${h}:${m || '00'} ${suffix}`;
        }).join(' - ');
    }
    return clean;
}

function getMinutesFromTime(timeStr) {
    if (!timeStr || timeStr === "TBA") return 9999;
    let cleanTime = timeStr.toString().replace(/\./g, ":").replace(/\-/g, " - ").replace(/[a-zA-Z]/g, "").trim();
    let startTime = cleanTime.split('-')[0].trim(); 
    let parts = startTime.split(':');
    let hour = parseInt(parts[0], 10);
    let minute = parseInt(parts[1], 10) || 0;
    if (isNaN(hour)) return 9999;
    if (hour >= 1 && hour <= 7) hour += 12; 
    return (hour * 60) + minute;
}

// 🔥 SMART SEARCH 
function searchRoutine() {
    const deptInput = document.getElementById('dept').value.trim().toUpperCase(); 
    const batch = document.getElementById('batch').value.trim();
    const section = document.getElementById('section').value.trim().toUpperCase();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"];
    const strictTimePattern = /\d{1,2}[:.]\d{2}/;

    // 🎯 FIX: এলার্ট বক্সের বদলে টেক্সট হিসেবে এরর দেখানোর জন্য ছোট্ট ফাংশন
    const showInlineError = (message) => {
        document.getElementById('routineList').innerHTML = `<div style='text-align:center; padding:30px; color:var(--subtext); font-size:30px; font-weight:500;'>${message}</div>`;
        document.getElementById('dayTabs').innerHTML = "";
        document.getElementById('routineTitle').innerText = "Notice";
        document.getElementById('classCount').innerText = "0 Classes";
        document.getElementById('currentDate').innerText = "";
        document.getElementById('resultSection').classList.remove('hidden');
        document.getElementById('liveStatusContainer').classList.add('hidden');
    };

    // চেক করা হচ্ছে বক্স ফাঁকা কি না
    if (deptInput === "") {
        showInlineError("⚠️ Please enter a Department (e.g. CSE)!");
        return;
    }
    if (batch === "") {
        showInlineError("⚠️ Please enter your Batch (e.g. 69)!");
        return;
    }
    if(!rawExcelData.length) {
        showInlineError("⚠️ Please Wait for Database Sync or Upload File manually!");
        return;
    }

    currentFilteredData = [];

    let targetPrefixes = [deptInput];
    if (deptInput === "BBA") targetPrefixes = ["BUS", "ACT", "FIN", "MKT", "HRM", "0421"];
    else if (deptInput === "LAW") targetPrefixes = ["LLB"];
    else if (deptInput === "PHARM") targetPrefixes = ["PHA"];
    else if (deptInput === "MATH") targetPrefixes = ["MAT"];

    for(let i=0; i<rawExcelData.length; i++) {
        for(let j=0; j<rawExcelData[i].length; j++) {
            let cell = rawExcelData[i][j]?.toString() || "";
            let cellUpper = cell.toUpperCase();
            let cellNoSpace = cellUpper.replace(/\s+/g, ''); 

            let hasDept = targetPrefixes.some(prefix => cellNoSpace.includes(prefix));
            if (!hasDept) continue;

            let hasBatch = batch === "" ? true : cellNoSpace.includes(batch);
            if (!hasBatch) continue;

            let hasSection = true;
            if (section !== "") {
                let sec1 = `(${section})`; 
                let sec2 = `${batch}${section}`; 
                let sec3 = `${section})`;
                hasSection = cellNoSpace.includes(sec1) || cellNoSpace.includes(sec2) || cellNoSpace.includes(sec3);
            }
            if (!hasSection) continue;

            let day = "";
            for(let x=i; x>=0; x--) {
                let d = rawExcelData[x].find(c => c && days.includes(c.toString().trim()));
                if(d) { day = d.trim(); break; }
            }

            let time = "TBA";
            for(let x=i; x>=0; x--) {
                let t = rawExcelData[x][j]?.toString() || "";
                if(strictTimePattern.test(t)) { 
                    time = t.toString().replace(/\./g, ":").replace(/\-/g, " - ").replace(/[a-zA-Z]/g, "").trim(); 
                    break; 
                }
            }

            let extractedCode = "N/A";
            let matchedPrefix = targetPrefixes.find(prefix => cellNoSpace.includes(prefix));
            if (matchedPrefix) {
                let regex = new RegExp(matchedPrefix + "[-\\s]?\\d+", "i");
                let matchCode = cellUpper.match(regex);
                if(matchCode) {
                    extractedCode = matchCode[0].replace(/\s+/, '-'); 
                    if(!extractedCode.includes('-')) extractedCode = extractedCode.replace(matchedPrefix, matchedPrefix + "-");
                } else {
                    extractedCode = matchedPrefix;
                }
            }

            let words = cellUpper.split(/[\s,()\-–]+/); 
            let teacherInit = cell.trim().split(/\s+/).pop(); 
            for(let w=words.length-1; w>=0; w--) {
                if (/^[A-Z]{2,4}$/.test(words[w]) && !targetPrefixes.includes(words[w])) {
                    teacherInit = words[w];
                    break;
                }
            }

            let roomNo = rawExcelData[i][2]?.toString().split(' ')[0] || "N/A";

            currentFilteredData.push({
                day, time,
                room: roomNo,
                code: extractedCode,
                init: teacherInit
            });
        }
    }
    renderTabs("All Days");
    updateLiveBanner(); 
}

function updateLiveBanner() {
    const container = document.getElementById('liveStatusContainer');
    const details = document.getElementById('liveClassDetails');
    const headerTitle = document.querySelector('.live-status-header strong');
    const pulse = document.querySelector('.live-pulse');
    
    if (!currentFilteredData || currentFilteredData.length === 0) {
        if(container) container.classList.add('hidden');
        return;
    }

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[now.getDay()];
    
    // আজকের ক্লাসগুলো বের করে সময় অনুযায়ী সাজিয়ে নেওয়া
    const todayClasses = currentFilteredData.filter(d => d.day === todayName);
    todayClasses.sort((a, b) => getMinutesFromTime(a.time) - getMinutesFromTime(b.time));
    
    // ১. চেক করা হচ্ছে এই মুহূর্তে কোনো ক্লাস চলছে কি না
    let ongoingClass = todayClasses.find(item => {
        let startMin = getMinutesFromTime(item.time);
        let endStr = item.time.split('-')[1];
        let endMin = endStr ? getMinutesFromTime(endStr) : startMin + 90;
        return (currentTotalMinutes >= startMin && currentTotalMinutes < endMin);
    });

    let nextClass = null;
    let upcomingDayName = "TODAY";

    if (!ongoingClass) {
        // ২. আজকের দিনে আর কোনো ক্লাস বাকি আছে কি না
        nextClass = todayClasses.find(item => getMinutesFromTime(item.time) > currentTotalMinutes);

        // ৩. যদি আজকে আর কোনো ক্লাস না থাকে, তাহলে আগামী দিনের ক্লাস খোঁজা
        if (!nextClass) {
            for (let i = 1; i <= 6; i++) { // আগামী ৬ দিন চেক করবে
                let nextDayIndex = (now.getDay() + i) % 7;
                let checkDayName = dayNames[nextDayIndex];
                let nextDayClasses = currentFilteredData.filter(d => d.day === checkDayName);

                if (nextDayClasses.length > 0) {
                    nextDayClasses.sort((a, b) => getMinutesFromTime(a.time) - getMinutesFromTime(b.time));
                    nextClass = nextDayClasses[0]; // সেই দিনের প্রথম ক্লাস
                    upcomingDayName = (i === 1) ? "TOMORROW" : checkDayName.toUpperCase();
                    break;
                }
            }
        }
    }

    // ব্যানার আপডেট করা
    if (ongoingClass) {
        container.classList.remove('hidden');
        container.style.background = 'linear-gradient(135deg, #ef4444, #f87171)'; 
        pulse.style.animation = 'pulse-white 2s infinite';
        headerTitle.innerText = "🔴 LIVE NOW";
        
        const cName = courseMapping[normalizeKey(ongoingClass.code)] || "University Course";
        const tName = teacherMapping[normalizeKey(ongoingClass.init)] || ongoingClass.init;
        
        details.innerHTML = `
            <h3>${ongoingClass.code}: ${cName}</h3>
            <p>
                <span class="room-disp" style="display:${userPrefs.showRoom?'inline':'none'}">📍 Room: ${ongoingClass.room}</span> 
                <span>🕒 ${formatTime(ongoingClass.time)}</span> 
                <span class="teacher-disp" style="display:${userPrefs.showTeacher?'inline':'none'}">👨‍🏫 ${tName}</span>
            </p>`;
            
    } else if (nextClass) {
        container.classList.remove('hidden');
        container.style.background = 'linear-gradient(135deg, var(--primary), #818cf8)'; 
        pulse.style.animation = 'none'; pulse.style.boxShadow = 'none';
        
        // হেডিং এ বলে দেবে ক্লাসটা কবে
        if (upcomingDayName === "TODAY") {
            headerTitle.innerText = "⏳ UPCOMING NEXT";
        } else {
            headerTitle.innerText = `⏳ UPCOMING (${upcomingDayName})`;
        }
        
        const cName = courseMapping[normalizeKey(nextClass.code)] || "University Course";
        const tName = teacherMapping[normalizeKey(nextClass.init)] || nextClass.init;
        
        // যদি অন্য দিনের ক্লাস হয়, তাহলে সময়ের আগে বারের নামটাও দেখিয়ে দেবে (যেমন: Sunday 9:00 AM)
        const displayTime = upcomingDayName !== "TODAY" ? `${nextClass.day} ${formatTime(nextClass.time)}` : formatTime(nextClass.time);

        details.innerHTML = `
            <h3>${nextClass.code}: ${cName}</h3>
            <p>
                <span class="room-disp" style="display:${userPrefs.showRoom?'inline':'none'}">📍 Room: ${nextClass.room}</span> 
                <span>🕒 ${displayTime}</span> 
                <span class="teacher-disp" style="display:${userPrefs.showTeacher?'inline':'none'}">👨‍🏫 ${tName}</span>
            </p>`;
    } else {
        container.classList.add('hidden');
    }
}

function renderTabs(activeDay) {
    const tabsContainer = document.getElementById('dayTabs');
    if (!tabsContainer) return; 

    const dayOrder = ["All Days", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    tabsContainer.innerHTML = "";
    
    dayOrder.forEach(day => {
        let count = day === "All Days" ? currentFilteredData.length : currentFilteredData.filter(d => d.day === day).length;
        if (count > 0) {
            const btn = document.createElement('button');
            btn.className = `day-tab ${day === activeDay ? 'active' : ''}`;
            btn.innerText = day === "All Days" ? `All Days (${count})` : `${day} (${count})`;
            btn.onclick = () => {
                document.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderRoutineForDay(day);
            };
            tabsContainer.appendChild(btn);
        }
    });
    renderRoutineForDay(activeDay);
}

function renderRoutineForDay(day) {
    const list = document.getElementById('routineList');
    const batch = document.getElementById('batch').value.trim();
    const sec = document.getElementById('section').value.trim().toUpperCase();

    const dept = document.getElementById('dept').value.trim().toUpperCase();
    const viewMode = localStorage.getItem('routine_view') || 'list';

    // const dept = document.getElementById('dept').options[document.getElementById('dept').selectedIndex].text;
    // const viewMode = localStorage.getItem('routine_view') || 'list';
    
    const isAllDays = day === "All Days";
    const totalClasses = isAllDays ? currentFilteredData.length : currentFilteredData.filter(d => d.day === day).length;

    document.getElementById('classCount').innerText = `${totalClasses} Classes in Total`;
    document.getElementById('routineTitle').innerText = `Schedule: ${dept} ${batch}(${sec})`;

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').innerText = `📅 Today: ${new Date().toLocaleDateString('en-US', dateOptions)}`;

    if(totalClasses === 0) {
        list.innerHTML = "<div style='text-align:center; padding:40px; color:var(--subtext)'>No classes found. Check Dept/Batch/Section.</div>";
        document.getElementById('resultSection').classList.remove('hidden');
        return;
    }

    viewMode === 'matrix' ? renderAdvancedMatrix(day, batch, sec) : renderStandardList(day);
    document.getElementById('resultSection').classList.remove('hidden');
}

function renderStandardList(day) {
    const list = document.getElementById('routineList');
    list.innerHTML = "";
    const isAllDays = day === "All Days";
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
    const daysToRender = isAllDays ? ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] : [day];

    daysToRender.forEach(renderDay => {
        const dayClasses = currentFilteredData.filter(d => d.day === renderDay);
        if (dayClasses.length === 0) return;

        dayClasses.sort((a, b) => getMinutesFromTime(a.time) - getMinutesFromTime(b.time));
        let dayHTML = `<div class="day-container"><div class="day-title">📅 ${renderDay}</div>`;
        
        dayClasses.forEach(item => {
            let isLive = false;
            if (renderDay === todayName) {
                let startMin = getMinutesFromTime(item.time);
                let endStr = item.time.split('-')[1];
                let endMin = endStr ? getMinutesFromTime(endStr) : startMin + 90; 
                if (currentTotalMinutes >= startMin && currentTotalMinutes < endMin) { isLive = true; }
            }

            const courseName = courseMapping[normalizeKey(item.code)] || "";
            const teacherName = teacherMapping[normalizeKey(item.init)] || item.init;

            dayHTML += `
                <div class="routine-card ${isLive ? 'live-now' : ''}">
                    <div class="time-col">
                        <span class="time-display">🕒 ${formatTime(item.time)}</span>
                        ${isLive ? `<span class="live-badge">🔴 LIVE NOW</span>` : `<span class="room-badge room-disp">Room ${item.room}</span>`}
                    </div>
                    <div class="course-col">
                        <div class="course-code">${item.code}</div>
                        <div class="course-name">${courseName}</div>
                    </div>
                    <div class="teacher-col teacher-disp">
                        <span class="teacher-name">${teacherName}</span>
                        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="teacher-avatar">
                    </div>
                </div>`;
        });
        dayHTML += `</div>`;
        list.innerHTML += dayHTML;
    });
}

function renderAdvancedMatrix(day, batch, sec) {
    const list = document.getElementById('routineList');
    list.innerHTML = "";
    const isAllDays = day === "All Days";
    const daysToRender = isAllDays ? ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] : [day];

    let uniqueTimesRaw = [...new Set(currentFilteredData.map(d => d.time))];
    uniqueTimesRaw.sort((a, b) => getMinutesFromTime(a) - getMinutesFromTime(b));

    let html = `<div class="adv-matrix-wrapper"><table class="adv-matrix-table"><thead><tr><th>DAY / TIME</th>`;
    uniqueTimesRaw.forEach(t => { html += `<th>${formatTime(t)}</th>`; });
    html += `</tr></thead><tbody>`;

    daysToRender.forEach(renderDay => {
        html += `<tr><td class="day-label">${renderDay}</td>`;
        uniqueTimesRaw.forEach(t => {
            let cls = currentFilteredData.find(d => d.day === renderDay && d.time === t);
            if (cls) {
                const courseName = courseMapping[normalizeKey(cls.code)] || "University Course";
                html += `<td>
                    <div class="adv-m-card">
                        <div class="adv-m-title">${cls.code}</div>
                        <div class="adv-m-name">${courseName}</div>
                        <div class="adv-m-footer">
                            <span class="adv-m-room">📍 ${cls.room}</span>
                            <span class="adv-m-teacher">${cls.init}</span>
                        </div>
                    </div>
                </td>`;
            } else {
                html += `<td><div class="adv-m-empty">·</div></td>`;
            }
        });
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    list.innerHTML = html;
}

function updateLiveStatus() {
    const activeTab = document.querySelector('.day-tab.active');
    if(activeTab) {
        let activeDayText = activeTab.innerText;
        if (activeDayText.includes("All Days")) {
            renderRoutineForDay("All Days");
        } else {
            const activeDay = activeDayText.split(' (')[0];
            const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
            if(activeDay === todayName) renderRoutineForDay(activeDay);
        }
    }
}

function saveAsPDF() { window.print(); }

function captureSchedule() {
    const element = document.getElementById('resultSection');
    const btn = document.querySelector('.btn-capture');
    const originalText = btn.innerText;
    btn.innerText = "⏳ Saving HD...";
    
    element.classList.add('capture-mode');

    const mainContainer = document.querySelector('.container');
    let origMaxWidth = '';
    if(mainContainer) {
        origMaxWidth = mainContainer.style.maxWidth;
        mainContainer.style.maxWidth = 'none';
    }

    const matrixWrapper = document.querySelector('.adv-matrix-wrapper');
    let originalOverflow = '', originalWidth = '';
    if (matrixWrapper) {
        originalOverflow = matrixWrapper.style.overflowX;
        originalWidth = matrixWrapper.style.width;
        matrixWrapper.style.overflowX = 'visible';
        matrixWrapper.style.width = 'max-content';
    }

    setTimeout(() => {
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        htmlToImage.toPng(element, { quality: 1.0, pixelRatio: 3, backgroundColor: bgColor, style: { margin: '0' } })
        .then(function (dataUrl) {
            const link = document.createElement('a'); link.download = `Routine.png`; link.href = dataUrl; link.click();
            btn.innerText = originalText; element.classList.remove('capture-mode');
            if (matrixWrapper) { matrixWrapper.style.overflowX = originalOverflow; matrixWrapper.style.width = originalWidth; }
            if (mainContainer) mainContainer.style.maxWidth = origMaxWidth;
        })
        .catch(function () {
            alert("Image capture failed!"); btn.innerText = originalText; element.classList.remove('capture-mode');
            if (matrixWrapper) { matrixWrapper.style.overflowX = originalOverflow; matrixWrapper.style.width = originalWidth; }
            if (mainContainer) mainContainer.style.maxWidth = origMaxWidth;
        });
    }, 500); 
}