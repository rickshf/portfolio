var langswitchContainer = document.getElementById('langswitch-container');
langswitchContainer.classList.remove('hidden');

var langswitchListbox = document.getElementById('langswitch-options');
var langswitchButton = document.getElementById('langswitch-button');
var langswitchCurrent = document.getElementById('langswitch-current');
var langswitchEnOption = document.getElementById('langswitch-en-option');
var langswitchPtOption = document.getElementById('langswitch-pt-option');
var langswitchOptions = [langswitchEnOption, langswitchPtOption];
var langswitchActiveOption = langswitchEnOption;

const langswitchBGActive = 'bg-gray-100';
const langswitchBGActiveDark = 'dark:bg-gray-700';

function hideLangbox() {
  langswitchButton.setAttribute('aria-expanded','false');
  langswitchListbox.classList.add('hidden');
  langswitchListbox.blur();
}

function showLangbox() {
  langswitchButton.setAttribute('aria-expanded','true');
  langswitchOptions.forEach(option => {
    if(option.getAttribute('aria-selected') === 'true') {
      option.classList.add(langswitchBGActive, langswitchBGActiveDark);
    }
  });
  langswitchListbox.classList.remove('hidden');
  langswitchListbox.focus();
}

function toggleLangbox() {
  const expanded = langswitchButton.getAttribute('aria-expanded');
  expanded === 'true' ? hideLangbox() : showLangbox();
}

function removeAllBG() {
  langswitchOptions.forEach(o => o.classList.remove(langswitchBGActive, langswitchBGActiveDark));
}

function switchSelectedAttributeTo(lang) {
  langswitchOptions.forEach(o => o.setAttribute('aria-selected','false'));
  if(lang === 'en') {
    langswitchEnOption.setAttribute('aria-selected','true');
    langswitchActiveOption = langswitchEnOption;
  } else {
    langswitchPtOption.setAttribute('aria-selected','true');
    langswitchActiveOption = langswitchPtOption;
  }
}

function updateCurrentLabel(lang) {
  langswitchCurrent.textContent = lang.toUpperCase();
}

function applyLanguage(lang) {
  updateCurrentLabel(lang);
  switchSelectedAttributeTo(lang);
}

function switchTo(lang) {
  localStorage.setItem('language', lang);
  applyLanguage(lang);
  if (typeof translatePage === 'function') {
    translatePage(lang);
  }
}

langswitchButton.addEventListener('click', function() {
  toggleLangbox();
  langswitchButton.blur();
});

langswitchEnOption.addEventListener('click', function(){ switchTo('en'); });
langswitchPtOption.addEventListener('click', function(){ switchTo('pt'); });

document.addEventListener('mouseup', function(event){
  if(!langswitchListbox.contains(event.target) && !langswitchButton.contains(event.target)){
    hideLangbox();
  }
});

langswitchOptions.forEach(option => option.addEventListener('mouseenter', function(){
  removeAllBG();
  option.classList.add(langswitchBGActive, langswitchBGActiveDark);
  langswitchActiveOption = option;
}));
langswitchListbox.addEventListener('mouseleave', function(){
  removeAllBG();
});

langswitchListbox.addEventListener('keydown', function(event){
  if(event.key === 'Escape') {
    hideLangbox();
  } else if(event.key === 'ArrowDown') {
    event.preventDefault();
    moveToNextOption();
  } else if(event.key === 'ArrowUp') {
    event.preventDefault();
    moveToPrevOption();
  } else if(event.shiftKey && event.key == 'Tab') {
    event.preventDefault();
    moveToPrevOption();
  } else if(event.key == 'Tab') {
    event.preventDefault();
    moveToNextOption();
  } else if(event.key === 'Enter') {
    if(langswitchActiveOption == langswitchEnOption) {
      switchTo('en');
    } else {
      switchTo('pt');
    }
  }
});

function moveToNextOption(){
  let next = langswitchActiveOption == langswitchEnOption ? langswitchPtOption : langswitchEnOption;
  removeAllBG();
  next.classList.add(langswitchBGActive, langswitchBGActiveDark);
  langswitchActiveOption = next;
}

function moveToPrevOption(){
  let prev = langswitchActiveOption == langswitchEnOption ? langswitchPtOption : langswitchEnOption;
  removeAllBG();
  prev.classList.add(langswitchBGActive, langswitchBGActiveDark);
  langswitchActiveOption = prev;
}

var saved = localStorage.getItem('language');
if(saved === 'pt') {
  applyLanguage('pt');
  if (typeof translatePage === 'function') {
    translatePage('pt');
  }
} else {
  applyLanguage('en');
  if (typeof translatePage === 'function') {
    translatePage('en');
  }
}
