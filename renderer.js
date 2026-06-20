// State Management
let dogs = JSON.parse(localStorage.getItem('dogs')) || [];
let walks = JSON.parse(localStorage.getItem('walks')) || [];

// Timer States
let timerInterval = null;
let timerSeconds = 0;
let walkStartTime = null;
let selectedDogIdForTimer = null;

// Calendar States
let calendarCurrentDate = new Date(); // Track current month viewed

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const tabPanels = document.querySelectorAll('.tab-panel');

// 1. Tab Switching Logic
navItems.forEach(item => {
  item.addEventListener('click', () => {
    // Remove active from all nav buttons and tabs
    navItems.forEach(nav => nav.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));

    // Add active to current
    item.classList.add('active');
    const targetTab = item.getAttribute('data-target');
    document.getElementById(targetTab).classList.add('active');

    // Trigger tab specific loads
    if (targetTab === 'tab-profile') {
      renderDogsGrid();
    } else if (targetTab === 'tab-timer') {
      populateTimerDogSelect();
    } else if (targetTab === 'tab-calendar') {
      populateCalendarFilters();
      renderCalendar();
    } else if (targetTab === 'tab-history') {
      populateHistoryFilters();
      renderHistoryList();
    }
  });
});

// Helper: Save State
function saveDogs() {
  localStorage.setItem('dogs', JSON.stringify(dogs));
}

function saveWalks() {
  localStorage.setItem('walks', JSON.stringify(walks));
}

// Helper: Format Duration (Seconds to HH:MM:SS)
function formatHHMMSS(totalSeconds) {
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

// Helper: Format Duration for Summary (X분 Y초)
function formatDurationSummary(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return `${mins}분 ${secs}초`;
  }
  return `${secs}초`;
}

// Helper: Format Date beautifully
function formatKoreanDate(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const day = dayNames[d.getDay()];
  return `${year}년 ${month}월 ${date}일 (${day})`;
}

function formatKoreanTime(dateStr) {
  const d = new Date(dateStr);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ==========================================
// 🐶 DOG PROFILE TAB LOGIC
// ==========================================
const dogForm = document.getElementById('dog-form');
const btnSubmitDog = document.getElementById('btn-submit-dog');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const editDogIdInput = document.getElementById('edit-dog-id');
const dogsGrid = document.getElementById('dogs-grid');

dogForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const dogId = editDogIdInput.value;
  const name = document.getElementById('dog-name').value.trim();
  const breed = document.getElementById('dog-breed').value.trim();
  const birth = document.getElementById('dog-birth').value;
  const weight = parseFloat(document.getElementById('dog-weight').value);
  const goal = document.getElementById('dog-goal').value.trim();

  if (dogId) {
    // Edit mode
    const index = dogs.findIndex(d => d.id === dogId);
    if (index !== -1) {
      dogs[index] = { id: dogId, name, breed, birth, weight, goal };
    }
  } else {
    // Add mode
    const newDog = {
      id: 'dog_' + Date.now(),
      name,
      breed,
      birth,
      weight,
      goal
    };
    dogs.push(newDog);
  }

  saveDogs();
  renderDogsGrid();
  resetDogForm();
});

btnCancelEdit.addEventListener('click', resetDogForm);

function resetDogForm() {
  dogForm.reset();
  editDogIdInput.value = '';
  btnSubmitDog.textContent = '등록하기 🐾';
  btnCancelEdit.classList.add('hidden');
}

function editDog(id) {
  const dog = dogs.find(d => d.id === id);
  if (!dog) return;

  editDogIdInput.value = dog.id;
  document.getElementById('dog-name').value = dog.name;
  document.getElementById('dog-breed').value = dog.breed;
  document.getElementById('dog-birth').value = dog.birth;
  document.getElementById('dog-weight').value = dog.weight;
  document.getElementById('dog-goal').value = dog.goal;

  btnSubmitDog.textContent = '수정 완료 🐾';
  btnCancelEdit.classList.remove('hidden');
}

function deleteDog(id) {
  const dog = dogs.find(d => d.id === id);
  if (!dog) return;

  if (confirm(`정말로 ${dog.name}의 프로필을 삭제하시겠습니까?\n프로필 삭제 시 관련 산책 기록은 남아있지만 이름이 표시되지 않을 수 있습니다.`)) {
    dogs = dogs.filter(d => d.id !== id);
    saveDogs();
    renderDogsGrid();
  }
}

function getDogAge(birthStr) {
  const birthDate = new Date(birthStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? `${age}살` : '0살 (태어난 지 1년 미만)';
}

function renderDogsGrid() {
  if (dogs.length === 0) {
    dogsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🐕</span>
        <p>아직 등록된 반려견이 없어요.<br>왼쪽 폼에서 귀여운 댕댕이를 등록해 주세요!</p>
      </div>
    `;
    return;
  }

  dogsGrid.innerHTML = '';
  dogs.forEach(dog => {
    const card = document.createElement('div');
    card.className = 'dog-card';
    card.innerHTML = `
      <div class="dog-card-header">
        <span class="dog-card-name">${dog.name}</span>
        <div class="dog-card-actions">
          <button class="btn-icon" onclick="editDog('${dog.id}')" title="프로필 수정">✏️</button>
          <button class="btn-icon" onclick="deleteDog('${dog.id}')" title="프로필 삭제">🗑️</button>
        </div>
      </div>
      <span class="dog-card-breed">${dog.breed}</span>
      <div class="dog-card-info">
        <p>📅 생일: ${dog.birth} (${getDogAge(dog.birth)})</p>
        <p>⚖️ 무게: ${dog.weight} kg</p>
      </div>
      <div class="dog-card-goal">
        <strong>🎯 목표 산책량</strong>
        <p>${dog.goal}</p>
      </div>
    `;
    dogsGrid.appendChild(card);
  });
}

// Bind functions to window so inline onclick handlers work
window.editDog = editDog;
window.deleteDog = deleteDog;


// ==========================================
// ⏱️ TIMER / WALK RECORD LOGIC
// ==========================================
const walkDogSelect = document.getElementById('walk-dog-select');
const timerText = document.getElementById('timer-text');
const timerStatusLabel = document.getElementById('timer-status-label');
const btnStartWalk = document.getElementById('btn-start-walk');
const btnStopWalk = document.getElementById('btn-stop-walk');
const timerCircle = document.querySelector('.timer-circle');

const walkDetailsSection = document.getElementById('walk-details-section');
const summaryWalkTime = document.getElementById('summary-walk-time');
const walkCourseInput = document.getElementById('walk-course');
const walkPeeCheckbox = document.getElementById('walk-pee');
const walkPoopCheckbox = document.getElementById('walk-poop');
const btnSaveWalk = document.getElementById('btn-save-walk');
const btnResetWalk = document.getElementById('btn-reset-walk');

function populateTimerDogSelect() {
  walkDogSelect.innerHTML = '';
  
  if (dogs.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '먼저 반려견 프로필을 등록해주세요';
    walkDogSelect.appendChild(opt);
    btnStartWalk.disabled = true;
    return;
  }

  btnStartWalk.disabled = false;
  dogs.forEach(dog => {
    const opt = document.createElement('option');
    opt.value = dog.id;
    opt.textContent = `${dog.name} (${dog.breed})`;
    walkDogSelect.appendChild(opt);
  });
}

btnStartWalk.addEventListener('click', () => {
  if (dogs.length === 0) return;

  selectedDogIdForTimer = walkDogSelect.value;
  walkStartTime = new Date();
  timerSeconds = 0;
  timerText.textContent = "00:00:00";
  timerStatusLabel.textContent = "행복하게 산책 중...🐾";
  timerCircle.classList.add('active');

  btnStartWalk.classList.add('hidden');
  btnStopWalk.classList.remove('hidden');
  walkDogSelect.disabled = true;

  // Hide details in case they were open from previous walk
  walkDetailsSection.classList.add('hidden');

  timerInterval = setInterval(() => {
    timerSeconds++;
    timerText.textContent = formatHHMMSS(timerSeconds);
  }, 1000);
});

btnStopWalk.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerCircle.classList.remove('active');
  timerStatusLabel.textContent = "산책이 완료되었습니다!";

  btnStopWalk.classList.add('hidden');
  btnStartWalk.classList.remove('hidden');
  walkDogSelect.disabled = false;

  // Render Post-walk inputs
  summaryWalkTime.textContent = formatDurationSummary(timerSeconds);
  walkDetailsSection.classList.remove('hidden');
  walkCourseInput.focus();
});

btnSaveWalk.addEventListener('click', () => {
  const course = walkCourseInput.value.trim();
  if (!course) {
    alert('산책 코스 및 이동 거리를 입력해 주세요!');
    walkCourseInput.focus();
    return;
  }

  const dog = dogs.find(d => d.id === selectedDogIdForTimer);
  const dogName = dog ? dog.name : '알 수 없음';

  const newWalk = {
    id: 'walk_' + Date.now(),
    dogId: selectedDogIdForTimer,
    dogName: dogName,
    startTime: walkStartTime.toISOString(),
    endTime: new Date().toISOString(),
    durationSeconds: timerSeconds,
    course: course,
    pee: walkPeeCheckbox.checked,
    poop: walkPoopCheckbox.checked
  };

  walks.push(newWalk);
  saveWalks();

  // Reset form inputs
  walkCourseInput.value = '';
  walkPeeCheckbox.checked = false;
  walkPoopCheckbox.checked = false;
  walkDetailsSection.classList.add('hidden');
  timerText.textContent = "00:00:00";
  timerStatusLabel.textContent = "산책 대기 중...";

  alert('산책 기록이 예쁘게 저장되었습니다! 🐾');

  // Redirect to History Tab
  document.querySelector('.nav-item[data-target="tab-history"]').click();
});

btnResetWalk.addEventListener('click', () => {
  if (confirm('현재 측정된 산책 기록을 저장하지 않고 지우시겠습니까?')) {
    walkCourseInput.value = '';
    walkPeeCheckbox.checked = false;
    walkPoopCheckbox.checked = false;
    walkDetailsSection.classList.add('hidden');
    timerText.textContent = "00:00:00";
    timerStatusLabel.textContent = "산책 대기 중...";
  }
});


// ==========================================
// 📅 CALENDAR & STATISTICS LOGIC
// ==========================================
const calendarDogFilter = document.getElementById('calendar-dog-filter');
const calendarCurrentMonthText = document.getElementById('calendar-current-month');
const btnPrevMonth = document.getElementById('btn-prev-month');
const btnNextMonth = document.getElementById('btn-next-month');
const calendarDaysGrid = document.getElementById('calendar-days-grid');

const statsTotalCount = document.getElementById('stats-total-count');
const statsTotalTime = document.getElementById('stats-total-time');
const statsTotalPoop = document.getElementById('stats-total-poop');

const dayWalkDetailsPopup = document.getElementById('day-walk-details-popup');
const popupDateTitle = document.getElementById('popup-date-title');
const popupWalksList = document.getElementById('popup-walks-list');
const btnClosePopup = document.getElementById('btn-close-popup');

function populateCalendarFilters() {
  const currentVal = calendarDogFilter.value;
  calendarDogFilter.innerHTML = '<option value="all">모든 댕댕이 전체 보기</option>';
  
  dogs.forEach(dog => {
    const opt = document.createElement('option');
    opt.value = dog.id;
    opt.textContent = dog.name;
    calendarDogFilter.appendChild(opt);
  });

  calendarDogFilter.value = currentVal || 'all';
}

calendarDogFilter.addEventListener('change', () => {
  renderCalendar();
});

btnPrevMonth.addEventListener('click', () => {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
  renderCalendar();
});

btnNextMonth.addEventListener('click', () => {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
  renderCalendar();
});

btnClosePopup.addEventListener('click', () => {
  dayWalkDetailsPopup.classList.add('hidden');
});

// Render dynamic calendar
function renderCalendar() {
  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth(); // 0-indexed

  // Update header text
  calendarCurrentMonthText.textContent = `${year}년 ${String(month + 1).padStart(2, '0')}월`;

  // First day of current month (0: Sun, 1: Mon, ...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Total days in previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  calendarDaysGrid.innerHTML = '';

  // Get current date for checking "today"
  const today = new Date();

  // Load and filter walks for statistics and display
  const dogFilter = calendarDogFilter.value;
  const filteredWalks = walks.filter(walk => {
    const walkDate = new Date(walk.startTime);
    const matchesDog = (dogFilter === 'all' || walk.dogId === dogFilter);
    const matchesMonth = (walkDate.getFullYear() === year && walkDate.getMonth() === month);
    return matchesDog && matchesMonth;
  });

  // 1. Calculate Monthly Statistics
  let monthlyTotalTimeSeconds = 0;
  let monthlyExcrementCount = 0;

  filteredWalks.forEach(w => {
    monthlyTotalTimeSeconds += w.durationSeconds;
    if (w.pee) monthlyExcrementCount++;
    if (w.poop) monthlyExcrementCount++;
  });

  statsTotalCount.textContent = `${filteredWalks.length}회`;
  statsTotalTime.textContent = `${Math.round(monthlyTotalTimeSeconds / 60)}분`;
  statsTotalPoop.textContent = `${monthlyExcrementCount}회`;

  // 2. Render Calendar Days
  // Previous month days fill-in
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day prev-month';
    dayDiv.innerHTML = `<span class="calendar-day-num">${prevMonthTotalDays - i}</span>`;
    calendarDaysGrid.appendChild(dayDiv);
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';

    // Highlight Sunday / Saturday
    const currentDayOfWeek = new Date(year, month, d).getDay();
    if (currentDayOfWeek === 0) dayDiv.classList.add('sunday');
    if (currentDayOfWeek === 6) dayDiv.classList.add('saturday');

    // Highlight Today
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) {
      dayDiv.classList.add('today');
    }

    // Find walks on this specific day
    const dayWalks = filteredWalks.filter(walk => {
      const walkDate = new Date(walk.startTime);
      return walkDate.getDate() === d;
    });

    let pawsHTML = '';
    if (dayWalks.length > 0) {
      pawsHTML = `<div class="calendar-paws-container">`;
      // Render cute paw badges (maximum 3 in view for layout neatness)
      dayWalks.slice(0, 3).forEach((walk, idx) => {
        pawsHTML += `
          <div class="calendar-paw-badge" onclick="showDayDetails('${year}-${month + 1}-${d}')" title="${walk.dogName} 산책 요약">
            <svg class="calendar-paw-svg" viewBox="0 0 24 24">
              <path d="M12,14c-1.66,0-3,1.34-3,3c0,2,2,3.5,3,3.5s3-1.5,3-3.5C15,15.34,13.66,14,12,14z M8,10.5C8,9.67,7.33,9,6.5,9S5,9.67,5,10.5S5.67,12,6.5,12S8,11.33,8,10.5z M19,10.5c0-.83-.67-1.5-1.5-1.5S16,9.67,16,10.5s.67,1.5,1.5,1.5S19,11.33,19,10.5z M11,8.5c0-.83-.67-1.5-1.5-1.5S8,7.67,8,8.5S8.67,10,9.5,10S11,9.33,11,8.5z M16,8.5c0-.83-.67-1.5-1.5-1.5S13,7.67,13,8.5S13.67,10,14.5,10S16,9.33,16,8.5z" />
            </svg>
          </div>
        `;
      });
      pawsHTML += `</div>`;
    }

    dayDiv.innerHTML = `
      <span class="calendar-day-num">${d}</span>
      ${pawsHTML}
    `;
    calendarDaysGrid.appendChild(dayDiv);
  }

  // Next month days fill-in
  const gridCellsUsed = firstDayIndex + totalDays;
  const remainingCells = (gridCellsUsed % 7 === 0) ? 0 : 7 - (gridCellsUsed % 7);
  for (let i = 1; i <= remainingCells; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day next-month';
    dayDiv.innerHTML = `<span class="calendar-day-num">${i}</span>`;
    calendarDaysGrid.appendChild(dayDiv);
  }
}

// Show day details popup
function showDayDetails(dateStr) {
  // Parse dateStr: "YYYY-MM-DD"
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const date = parseInt(parts[2]);

  const targetDate = new Date(year, month, date);
  popupDateTitle.textContent = `${formatKoreanDate(targetDate.toISOString())} 산책 목록 🐾`;

  const dogFilter = calendarDogFilter.value;
  const dayWalks = walks.filter(walk => {
    const walkDate = new Date(walk.startTime);
    const matchesDog = (dogFilter === 'all' || walk.dogId === dogFilter);
    const matchesDay = (walkDate.getFullYear() === year && walkDate.getMonth() === month && walkDate.getDate() === date);
    return matchesDog && matchesDay;
  });

  popupWalksList.innerHTML = '';
  if (dayWalks.length === 0) {
    popupWalksList.innerHTML = '<p class="text-center">이 날 기록된 산책이 없습니다.</p>';
  } else {
    dayWalks.forEach(walk => {
      const peeBadge = walk.pee ? '<span class="walk-card-paw-stamp"><svg viewBox="0 0 24 24"><path d="M12,14c-1.66,0-3,1.34-3,3c0,2,2,3.5,3,3.5s3-1.5,3-3.5C15,15.34,13.66,14,12,14z M8,10.5C8,9.67,7.33,9,6.5,9S5,9.67,5,10.5S5.67,12,6.5,12S8,11.33,8,10.5z M19,10.5c0-.83-.67-1.5-1.5-1.5S16,9.67,16,10.5s.67,1.5,1.5,1.5S19,11.33,19,10.5z M11,8.5c0-.83-.67-1.5-1.5-1.5S8,7.67,8,8.5S8.67,10,9.5,10S11,9.33,11,8.5z M16,8.5c0-.83-.67-1.5-1.5-1.5S13,7.67,13,8.5S13.67,10,14.5,10S16,9.33,16,8.5z" /></svg>쉬야 완료</span>' : '';
      const poopBadge = walk.poop ? '<span class="walk-card-paw-stamp"><svg viewBox="0 0 24 24"><path d="M12,14c-1.66,0-3,1.34-3,3c0,2,2,3.5,3,3.5s3-1.5,3-3.5C15,15.34,13.66,14,12,14z M8,10.5C8,9.67,7.33,9,6.5,9S5,9.67,5,10.5S5.67,12,6.5,12S8,11.33,8,10.5z M19,10.5c0-.83-.67-1.5-1.5-1.5S16,9.67,16,10.5s.67,1.5,1.5,1.5S19,11.33,19,10.5z M11,8.5c0-.83-.67-1.5-1.5-1.5S8,7.67,8,8.5S8.67,10,9.5,10S11,9.33,11,8.5z M16,8.5c0-.83-.67-1.5-1.5-1.5S13,7.67,13,8.5S13.67,10,14.5,10S16,9.33,16,8.5z" /></svg>응가 완료</span>' : '';

      const item = document.createElement('div');
      item.className = 'popup-walk-item';
      item.innerHTML = `
        <div class="popup-walk-item-header">
          <span>🐕 ${walk.dogName}</span>
          <span>⏱️ ${formatKoreanTime(walk.startTime)} ~ ${formatKoreanTime(walk.endTime)} (${formatDurationSummary(walk.durationSeconds)})</span>
        </div>
        <p style="margin-bottom: 8px; font-size: 13.5px;">📍 <strong>코스:</strong> ${walk.course}</p>
        <div style="display: flex; gap: 8px;">
          ${peeBadge}
          ${poopBadge}
        </div>
      `;
      popupWalksList.appendChild(item);
    });
  }

  dayWalkDetailsPopup.classList.remove('hidden');
}

// Bind to window
window.showDayDetails = showDayDetails;


// ==========================================
// 📋 WALK HISTORY LOGS LOGIC
// ==========================================
const historyDogFilter = document.getElementById('history-dog-filter');
const historySortOrder = document.getElementById('history-sort-order');
const historyList = document.getElementById('history-list');

function populateHistoryFilters() {
  const currentVal = historyDogFilter.value;
  historyDogFilter.innerHTML = '<option value="all">모든 댕댕이 전체 보기</option>';
  
  dogs.forEach(dog => {
    const opt = document.createElement('option');
    opt.value = dog.id;
    opt.textContent = dog.name;
    historyDogFilter.appendChild(opt);
  });

  historyDogFilter.value = currentVal || 'all';
}

historyDogFilter.addEventListener('change', renderHistoryList);
historySortOrder.addEventListener('change', renderHistoryList);

function deleteWalk(walkId) {
  if (confirm('이 산책 기록을 영구적으로 삭제하시겠습니까?')) {
    walks = walks.filter(w => w.id !== walkId);
    saveWalks();
    renderHistoryList();
  }
}
window.deleteWalk = deleteWalk;

function renderHistoryList() {
  const dogFilter = historyDogFilter.value;
  const sortOrder = historySortOrder.value;

  // Filter walks
  let filtered = walks.filter(walk => {
    return dogFilter === 'all' || walk.dogId === dogFilter;
  });

  // Sort walks
  filtered.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  if (filtered.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🦮</span>
        <p>기록된 산책이 아직 없어요.<br>'산책 시작' 탭에서 첫 산책을 완료해 보세요!</p>
      </div>
    `;
    return;
  }

  historyList.innerHTML = '';
  filtered.forEach(walk => {
    const card = document.createElement('div');
    card.className = 'walk-card';
    
    // Check if dog exists to display updated breed/goal if needed, or fallback
    const dog = dogs.find(d => d.id === walk.dogId);
    const displayBreed = dog ? dog.breed : '등록 해제됨';

    const peeStamp = walk.pee 
      ? `<span class="walk-card-paw-stamp">
          <svg viewBox="0 0 24 24"><path d="M12,14c-1.66,0-3,1.34-3,3c0,2,2,3.5,3,3.5s3-1.5,3-3.5C15,15.34,13.66,14,12,14z M8,10.5C8,9.67,7.33,9,6.5,9S5,9.67,5,10.5S5.67,12,6.5,12S8,11.33,8,10.5z M19,10.5c0-.83-.67-1.5-1.5-1.5S16,9.67,16,10.5s.67,1.5,1.5,1.5S19,11.33,19,10.5z M11,8.5c0-.83-.67-1.5-1.5-1.5S8,7.67,8,8.5S8.67,10,9.5,10S11,9.33,11,8.5z M16,8.5c0-.83-.67-1.5-1.5-1.5S13,7.67,13,8.5S13.67,10,14.5,10S16,9.33,16,8.5z" /></svg>
          쉬야 완료 💦
         </span>`
      : `<span class="walk-card-paw-stamp inactive">
          <svg viewBox="0 0 24 24"><path d="M12,14c-1.66,0-3,1.34-3,3c0,2,2,3.5,3,3.5s3-1.5,3-3.5C15,15.34,13.66,14,12,14z M8,10.5C8,9.67,7.33,9,6.5,9S5,9.67,5,10.5S5.67,12,6.5,12S8,11.33,8,10.5z M19,10.5c0-.83-.67-1.5-1.5-1.5S16,9.67,16,10.5s.67,1.5,1.5,1.5S19,11.33,19,10.5z M11,8.5c0-.83-.67-1.5-1.5-1.5S8,7.67,8,8.5S8.67,10,9.5,10S11,9.33,11,8.5z M16,8.5c0-.83-.67-1.5-1.5-1.5S13,7.67,13,8.5S13.67,10,14.5,10S16,9.33,16,8.5z" /></svg>
          쉬야 없음
         </span>`;

    const poopStamp = walk.poop
      ? `<span class="walk-card-paw-stamp">
          <svg viewBox="0 0 24 24"><path d="M12,14c-1.66,0-3,1.34-3,3c0,2,2,3.5,3,3.5s3-1.5,3-3.5C15,15.34,13.66,14,12,14z M8,10.5C8,9.67,7.33,9,6.5,9S5,9.67,5,10.5S5.67,12,6.5,12S8,11.33,8,10.5z M19,10.5c0-.83-.67-1.5-1.5-1.5S16,9.67,16,10.5s.67,1.5,1.5,1.5S19,11.33,19,10.5z M11,8.5c0-.83-.67-1.5-1.5-1.5S8,7.67,8,8.5S8.67,10,9.5,10S11,9.33,11,8.5z M16,8.5c0-.83-.67-1.5-1.5-1.5S13,7.67,13,8.5S13.67,10,14.5,10S16,9.33,16,8.5z" /></svg>
          응가 완료 💩
         </span>`
      : `<span class="walk-card-paw-stamp inactive">
          <svg viewBox="0 0 24 24"><path d="M12,14c-1.66,0-3,1.34-3,3c0,2,2,3.5,3,3.5s3-1.5,3-3.5C15,15.34,13.66,14,12,14z M8,10.5C8,9.67,7.33,9,6.5,9S5,9.67,5,10.5S5.67,12,6.5,12S8,11.33,8,10.5z M19,10.5c0-.83-.67-1.5-1.5-1.5S16,9.67,16,10.5s.67,1.5,1.5,1.5S19,11.33,19,10.5z M11,8.5c0-.83-.67-1.5-1.5-1.5S8,7.67,8,8.5S8.67,10,9.5,10S11,9.33,11,8.5z M16,8.5c0-.83-.67-1.5-1.5-1.5S13,7.67,13,8.5S13.67,10,14.5,10S16,9.33,16,8.5z" /></svg>
          응가 없음
         </span>`;

    card.innerHTML = `
      <div class="walk-card-header">
        <div class="walk-card-title">
          <span class="walk-card-dog-name">🐕 ${walk.dogName}</span>
          <span style="font-size: 13px; color: var(--text-muted);">(${displayBreed})</span>
        </div>
        <span class="walk-card-date">${formatKoreanDate(walk.startTime)}</span>
        <div class="walk-card-actions">
          <button class="btn-icon" onclick="deleteWalk('${walk.id}')" title="산책 기록 삭제">🗑️</button>
        </div>
      </div>

      <div class="walk-card-details-row">
        <span class="walk-card-detail-label">⏱️ 산책 시간</span>
        <span class="walk-card-detail-val">
          <strong>${formatKoreanTime(walk.startTime)} ~ ${formatKoreanTime(walk.endTime)}</strong> 
          (${formatDurationSummary(walk.durationSeconds)})
        </span>
      </div>

      <div class="walk-card-details-row">
        <span class="walk-card-detail-label">📍 산책 코스</span>
        <span class="walk-card-detail-val">${walk.course}</span>
      </div>

      <div class="walk-card-details-row">
        <span class="walk-card-detail-label">🐾 배변 여부</span>
        <span class="walk-card-detail-val" style="display: flex; gap: 10px;">
          ${peeStamp}
          ${poopStamp}
        </span>
      </div>
    `;

    historyList.appendChild(card);
  });
}


// ==========================================
// INITIAL SETUP
// ==========================================
// Load default view
renderDogsGrid();
populateTimerDogSelect();
populateCalendarFilters();
populateHistoryFilters();
