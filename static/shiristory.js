// With this game design, it would be more optimal to send the entire database to the client just once
// This specific implementation is for the sake of me trying out AJAX, and how feasible this setup is.
// It's also a nicer capstone to what I've learned from CS50.
"use strict";
// try {

// how to remove the need for these global variables?
const usedWords = [];
const gameData = {
  isOngoing: false,
  totalScore: 0,
  totalHelped: 0,
  currentPrompt: "",
  promptData: [],
  lastAlien: "",
  lastColor: -1, 
  lastSize: -1,
  // volume values are from 0 to 1
  musicVolume: 0.50,
  sfxVolume: 0.50,
  infoText: ""
};
var runningTimer = {}, music = {}, hum = {}, musicVolumeSlider = {}, sfxVolumeSlider = {};

// i used closures for the "global" Audio objects and letter prompt objects
// but now... the playSfx variable, etc. is just plain old global scope???
// .....maybe i should just define the Audio objects as const
// OR i could set it to run right after the html loads up (what idk how that helps)
// can i... name the function inside the closure and call it without the assigned variable?

function getRandomInt(min, max) {
  // right bound exclusive
  return Math.floor(Math.random() * (max - min) ) + min;
}






// plays sound effects, controls their volume, and allows overlapping sounds
let playSfx = (function () {
  var sfxSuccess = new Audio("static/sfx/446114__justinvoke__confirm-jingle.wav");
  var sfxFailure = new Audio("static/sfx/539668__jhyland__8-bit-explosion.mp3");
  var sfxTyping = new Audio("static/sfx/378085__bigmonmulgrew__mechanical-key-hard2.wav"); // best (so far), good timing
  // var sfxTyping = new Audio("static/180974__ueffects__a-key2.wav"); // ok? less asmr, more normal

  return function (soundString, volume = gameData['sfxVolume']) {
    var sound = {}, clone = {};

    // gets the correct Audio object using the soundString 
    switch (soundString) {
      case "typing":
        sound = sfxTyping;
        break;
      case "success":
        sound = sfxSuccess;
        break;
      case "failure":
        sound = sfxFailure;
        break;
      default:
      }

    // prepares and plays that Audio object
    clone = sound.cloneNode();
    clone.volume = volume;
    clone.play();
  };
})();

// sets volume in gameData. accepts category key, and values from 0 to 100
function setVolume(category, value) {
  if (0 <= value && value <= 100) {
    
    // converts values into 0 to 1 for the volume property (avoids floats)
    gameData[category] = value / 100;

    // returns the set volume, cuz why not
    return gameData[category];
  }
}

// initializes music
music = new Audio("static/music/chill by sakura Hz [Music promoted by Audio Library].mp3");
music.volume = gameData['musicVolume'];

// initializes hum
hum = new Audio("static/sfx/466451__patrick__loopable-hum2.wav");
hum.loop = true;
hum.volume = gameData['musicVolume'];

// initializes sfx slider
sfxVolumeSlider = document.querySelector("#sfx-volume-slider");
sfxVolumeSlider.value = gameData['sfxVolume'] * 100;

// adjusts sfx volume when slider is let go "touchend", "mouseup" worked too
sfxVolumeSlider.addEventListener("change", function adjustSfxVolume() {
  // console.log("sfx: "+this.value);
  setVolume('sfxVolume', this.value);
  playSfx("typing");
});

// initializes music slider
musicVolumeSlider = document.querySelector("#music-volume-slider");
musicVolumeSlider.value = gameData['musicVolume'] * 100;

// adjusts music volume when slider is let go
musicVolumeSlider.addEventListener("input", function adjustMusicVolume() {
  // console.log("music: "+this.value);
  setVolume('musicVolume', this.value);
  music.volume = gameData['musicVolume'];
  hum.volume = gameData['musicVolume'];
});






// changes the displayed alien to the some other random alien
let changeAlien = (function () {
  var aliens = [
    "../static/images/Botamon_b.png",
    "../static/images/Punimon_b.png",
    "../static/images/Poyomon_b.png",
    "../static/images/Yuramon_b.png"
  ]

  return function () {
    var newAlien = "";

    // ensures the random alien is not the current one
    do {newAlien = aliens[getRandomInt(0,aliens.length)];} while (newAlien == gameData['lastAlien']);
    gameData['lastAlien'] = newAlien;

    // changes #alien
    document.querySelector("#alien").src = newAlien;

    // animates the alien, the prompt, and the prompt score popup
    replayAnimation(document.querySelector("#alien-area"));
  };
})();






// NOT BEING USED CURRENTLY... for more testing.
// initializes prompt data in gameData, and displays the prompt
let startFirstLetter = (function () {
  // [first letter, score value]
  // points scale is based off of https://norvig.com/mayzner.html
  var fLetter = [
    ['d', 10],
    ['n', 10],
    ['t', 10],
    ['y', 10],
    ['r', 10],
    ['l', 15],
    ['g', 15],
    ['m', 15],
    ['h', 20],
    ['w', 20],
    ['k', 20],
    ['f', 25],
    ['c', 25],
    ['p', 25]
  ];
  var fLetterHard = [
    ['o', 40],
    ['i', 40],
    ['x', 40],
    ['b', 40],
    ['a', 40]
  ];

  return function () {
    // sets the current prompt flag as firstLetter
    gameData['currentPrompt'] = "firstLetter";

    if (getRandomInt(0,10) != 9) {
      // stores the data required to run the firstLetter prompt
      gameData['promptData'] = fLetter[getRandomInt(0,fLetter.length)];
    } else {
      // 10% chance for a harder letter
      gameData['promptData'] = fLetterHard[getRandomInt(0,fLetterHard.length)];
    }

    // update prompt display
    document.querySelector("#prompt").innerHTML = 
    '(Please teach me a word that starts with <span>'+ gameData['promptData'][0] + '</span> !)';
  };
})();

// returns true if prompt is fulfilled. called by scoreValidWord if the current prompt is 'firstLetter'
function correctFirstLetter(currentFirstLetter) {
  return gameData['promptData'][0] === currentFirstLetter.toLowerCase();
}



// initializes prompt data in gameData, and displays the prompt
let startWordCount = (function () {
  // [number of words to fulfill, score value]
  var wordCount = [
    [2, 8],
  [3, 12],
  [4, 16],
  [5, 20]
  ];

  return function () {
    // sets the current prompt flag as wordCount
    gameData['currentPrompt'] = "wordCount";

    // then stores the promptData required to run the wordCount prompt
    switch (getRandomInt(1,11)) {
      case 1:
      case 2:
      case 3:
      case 4:
        // slice() is here to pass by value instead of reference
        gameData['promptData'] = wordCount[1].slice();
        break;
      case 5:
      case 6:
      case 7:
        gameData['promptData'] = wordCount[0].slice();
        break;
      case 8:
      case 9:
        gameData['promptData'] = wordCount[2].slice();
        break;
      case 10:
        gameData['promptData'] = wordCount[3].slice();
        break;
      default:
    }

    // update prompt display
    document.querySelector("#prompt").innerHTML = 
    '(Please teach me any <span>' + gameData['promptData'][0] + '</span> words!!)';
  };
})();

// counts, then returns true if prompt is fulfilled. called by scoreValidWord if the current prompt is 'wordCount'
function correctWordCount () {
  gameData['promptData'][0]--;
  return gameData['promptData'][0] === 0;
}



// initializes prompt data in gameData, and displays the prompt
// in the current implementation, only single letter substrings are in the game
let startSubstring = (function () {
  
  // i removed J, Z, Q, X
  var alphabet = 'ABCDEFGHIKLMNOPRSTUVWY'.split('');

  return function () {
    var substring = "";

    // sets the current prompt flag as substring
    gameData['currentPrompt'] = "substring";

    // determines substring
    substring = alphabet[getRandomInt(0,alphabet.length)].slice();

    // update prompt display
    document.querySelector("#prompt").innerHTML = 
    '(A word with the letter <span>'+ substring + '</span> please!)';

    // sets the prompt's condition
    gameData['promptData'][0] = substring.toLowerCase();

    // sets the prompt's score value
    gameData['promptData'][1] = 6;
  };
})();

// returns true if prompt is fulfilled. called by scoreValidWord if this is the current prompt
// this can check for a substring of any length
function correctSubstring(currentWord) {
  return new RegExp('.*' + gameData['promptData'][0] + '.*').test(currentWord.toLowerCase());
}



// calls a random prompt's start function
function startRandomPrompt () {
  // dice roll for random prompt
  switch (getRandomInt(0, 4)) {
    case 0:
    case 1:
    case 2:
      startSubstring();
      break;
    case 3:
      startWordCount();
      break;
    case 4:
      // not included for now...
      startFirstLetter();
      break;
    default:
  }
}

// sets all prompt-related gameData back to default values
function clearAllPrompts () {
  gameData['currentPrompt'] = "";
  gameData['promptData'] = [];
}






// fix for replaying animation, from https://stackoverflow.com/a/45036752/13377452
function replayAnimation(element) {
  element.style.animation = 'none';
  element.offsetHeight; /* trigger reflow */
  element.style.animation = null; 
}

// decorates and activates popup-style elements
function flashNotif(id, notifMessage, resize) {
  var notif = {};
  notif = document.querySelector(id);

  // // swapping classes, removed for now...
  // notif.classList.remove("success", "failure");
  // notif.classList.add(classString);
  // // same here too...
  // notif.classList.remove("animator");
  // notif.classList.add("animator");

  // changes the notif message
  notif.textContent = notifMessage;

  // scales the font-size of the notif based on the resize argument (only for letter count)
  if (resize) {
    // smallest at 3, largest at 16, based on https://norvig.com/mayzner.html
    // font size should range between 0.9em to 2.5em
    notif.style.fontSize = Math.max(0.9, Math.min(0.531 + 0.123 * resize, 2.5)) + "em";
  }

  // animates the notif flashing
  replayAnimation(notif);
}






// resolves a valid word
function scoreValidWord(wordData) {
  var div = {}, wordBox = {}, score = 0, sizeBonusText = "", randInt = 0;
  var promptCompleted = false;

  // add word to the list of used words
  usedWords.push(wordData.word);

  // convert word length into points
  score += wordData.word.length;
  // score += wordData.word.length * 50 + getRandomInt(-10,11);
  
  // convert 'size' into points (esoteric word bonus)
  if (wordData.size == "80") {
    score += 1;
    // score += getRandomInt(1,101);
    sizeBonusText = "!";
  }

  // display #word-score-popup
  flashNotif("#word-score-popup", "+" + score + sizeBonusText);

  // play success sound
  playSfx("success");



  // check if the currentPrompt is completed...
  switch (gameData['currentPrompt']) {
    case "firstLetter":
      if (correctFirstLetter(wordData.word.slice(0,1))) { 
        promptCompleted = true; 
      }
      break;
    case "wordCount":
      if (correctWordCount()) {
        promptCompleted = true;
      }
      break;
    case "substring":
      if (correctSubstring(wordData.word)) {
        promptCompleted = true;
      }
    default:
  }

  // resolve currentPrompt if completed
  if (promptCompleted) {
    
    // add prompt bonus to this word's score
    score += gameData['promptData'][1];

    // display prompt bonus score
    // console.log(gameData['promptData'][1]);
    flashNotif("#prompt-score-popup", "+" + gameData['promptData'][1] + "!");

    //increment and display totalHelped score
    gameData['totalHelped']++;
    document.querySelector("#total-helped").textContent = gameData['totalHelped'];

    // clear prompt, then determine the new prompt
    clearAllPrompts();
    startRandomPrompt();

    // alien animations
    changeAlien();
  }



  // after all scoring, update total score
  gameData['totalScore'] += score;
  document.querySelector("#total-score").textContent = gameData['totalScore'];



  // create and display word onto the scored-area
  div = document.createElement("div");

  // the concat is there if i want to add a delimiter
  div.textContent = wordData.word.concat("");

  // determine controlled random css designs for the element...
  div.classList.add("animator");
  // color:
  do {randInt = getRandomInt(0, 4);} while (randInt == gameData['color']);
  gameData['color'] = randInt;
  div.classList.add("color" + randInt);
  // font-size:
  do {randInt = getRandomInt(0, 5);} while (randInt == gameData['size']);
  gameData['size'] = randInt;
  div.classList.add("size" + randInt);

  // display element to scored-area
  document.querySelector("#scored-area").appendChild(div);
  // old code below, from when #word-form was designed to be the permanent last child of #scored-area
  // document.querySelector("#scored-area").insertBefore(div, document.querySelector("#word-form"));

  // update #word-box placeholder
  wordBox = document.querySelector("#word-box");
  wordBox.placeholder = wordData.word.substr(-1, 1);

  // reset #word-box value and size
  wordBox.value = "";
  document.querySelector("#input-sizer").dataset.value = "";

  // TODO better , scroll down #scored-area
  document.querySelector("#scored-area").scrollTop = 1000000000000000;
}

// resolves an invalid word
function scoreInvalidWord(reason) {
  // display reason for invalidity onto #info-area
  document.querySelector("#info-text").textContent = reason;

  // // flash a score notif 
  // // removed this functionality for now 
  // // if i wanna use it again, add this parameter: score, default value = 0
  // if (score > 0) { 
  //   // update total score
  //   gameData['totalScore'] += score;
  //   document.querySelector("#total-score").textContent = gameData['totalScore'];
  //   // display points lost
  //   flashNotif("#word-score-popup", score);
  // }

  // play failure sound
  playSfx("failure");

  // reset word-box value and size only
  document.querySelector("#word-box").value = "";
  document.querySelector("#input-sizer").dataset.value = "";
}

// determines if word in #word-box is valid or invalid
function evaluateWordBox() {
  var word = "", wordData = {}, lastLetter = "";

  // get the word input
  word = document.querySelector("#word-box").value;

  // check if there is no word
  if (word == "") {
    scoreInvalidWord("Type something!");
    return;
  }

  // check if invalid characters were used
  // looks for at least 1 non-alphabetical or non-apostrophe character
  if (/[^a-zA-Z']/.test(word)) {
    scoreInvalidWord("Invalid characters!");
    return;
  }

  // AJAX begins here
  // waits for the valid response from the server before proceeding
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      // convert the JSON response into a JS object
      wordData = JSON.parse(this.responseText);

      // check if word was in the word list database
      if (wordData.word == null) {
        scoreInvalidWord("Invalid English word!");
        return;
      }

      // check if the last letter of the previous word was used
      lastLetter = document.querySelector("#word-box").placeholder.toLowerCase();
      if (lastLetter != wordData.word.slice(0,1).toLowerCase() && lastLetter != "") {
        scoreInvalidWord("Invalid word chain!");
        return;
      }

      // check if word has already been used in this game
      if (usedWords.includes(wordData.word)) {
        scoreInvalidWord("Word already used!");
        return;
      } else {

        // the word is valid if it passes all the checks
        scoreValidWord(wordData);
        return;
      }
    }
  };
  // request the word's data from the server-side database
  xhttp.open("GET", "/checkdb?word=" + word, true);
  xhttp.send();
}






// starts and runs a timed game until resolveGame or resetGame
function startGame() {
  // portal animation
  var portal = {};
  portal = document.querySelector("#portal");
  portal.classList.remove("enter", "exit");
  portal.classList.add("exit");
  replayAnimation(portal);
  portal.style.opacity = 0;
  document.querySelector("#alien-container").classList.remove("shake");

  // raises the 'ongoing game' flag
  gameData['isOngoing'] = true;

  // activate prompt
  startRandomPrompt();
  document.querySelector("#prompt").style.visibility = "visible";

  // activate alien
  changeAlien();

  // change music
  hum.pause();
  music.play();



  // tick #timer down every second, and calls resolveGame on timeout
  var startTime = new Date();
  var timeLimit = Math.round(music.duration*1000);
  // var timeLimit = 15000;
  var timeLeft = 0;
  var timerDisplay = document.querySelector("#timer");
  function gameTimer() {
    timeLeft = timeLimit - (new Date() - startTime);
    // this triggers right at the end of the last second
    if (timeLeft/1000 <= 0) {
      timerDisplay.innerHTML = "done!";
      clearInterval(runningTimer);
      resolveGame();
    } else {
      timerDisplay.innerHTML = Math.round(timeLeft/1000);
    }
  }
  // calls gameTimer now, and then every second thereafter
  gameTimer();
  runningTimer = setInterval(gameTimer, 1000);
  // fyi this is NOT synced with real time. it starts at 0ms exactly when called



  // show the end of game screen, send the data to the server, and calls resetGame() when completed
  // (was it a good idea to put this inside startGame?)
  function resolveGame() {
    var wordBox = {}, gameResults = {}, data = [], button = {}, info = {};

    // blur & disable #word-box and reset its contents
    wordBox = document.querySelector("#word-box");
    wordBox.disabled = true;
    wordBox.placeholder = String.fromCodePoint(128302);
    wordBox.value = "";
    document.querySelector("#input-sizer").dataset.value = "";

    // hide prompt 
    document.querySelector("#prompt").style.visibility = "hidden";

    // populate #game-result
    document.querySelector("#result-score").textContent = gameData['totalScore'];
    document.querySelector("#result-helped").textContent = gameData['totalHelped'];
    document.querySelector("#result-count").textContent = usedWords.length;

    // show #game-result
    gameResults = document.querySelector("#game-result");
    gameResults.style.display = "flex";



    // tally all important game data and send them to the server
    data = [
      [gameData['totalScore'], gameData['totalHelped']],
      usedWords
    ];
    // waits for the valid response from the server before proceeding
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {

        // console.log(this.responseText);

        info = document.querySelector("#result-info");
        // if logged in and the save was successful...
        if (this.responseText === "ok") {
          info.textContent = "Game saved!";
        // if not logged in...
        } else if (this.responseText === "fail") {
          info.textContent = "Log in to enable saving!";
        // otherwise...
        } else {
          info.textContent = "Saving not successful. :("
        }

        // enable proceed button
        button = document.querySelector("#result-button");
        button.disabled = false;
        button.addEventListener("click", function (event) {
          event.preventDefault();
          resetGame();
        });
      }
    };
    xhttp.open("POST", "/record", true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(data));
  }
}

// cleans up the game state from any state into its initial state, w/ animation
function resetGame() {
  // portal animation
  var portal = {};
  portal = document.querySelector("#portal");
  portal.classList.remove("enter", "exit");
  portal.classList.add("exit");
  replayAnimation(portal);
  portal.style.opacity = 0;
  document.querySelector("#alien-container").classList.add("shake");

  // reset global variables
  gameData['isOngoing'] = false;
  gameData['totalScore'] = 0;
  gameData['totalHelped'] = 0;
  usedWords.length = 0;

  // reset prompt
  document.querySelector("#prompt").style.visibility = "hidden";
  clearAllPrompts();

  // reset #info-area
  document.querySelector("#total-score").textContent = 0;
  document.querySelector("#total-helped").textContent = 0;
  document.querySelector("#info-text").textContent = gameData['infoText']

  // reset music
  music.pause();
  music.load();

  // reset alien
  document.querySelector("#alien").src = "../static/images/nothing.png";

  // stop timer, if running
  document.querySelector("#timer").innerHTML = "0";
  clearInterval(runningTimer);

  // reset #scored-area
  var scoredArea = document.querySelector("#scored-area");
  scoredArea.textContent = "";
  var scrollFix = document.createElement("div");
  scrollFix.id = "scroll-fix";
  scoredArea.appendChild(scrollFix);

  // reset #word-box
  var wordBox = document.querySelector("#word-box");
  wordBox.placeholder = String.fromCodePoint(128302);
  wordBox.value = "";
  document.querySelector("#input-sizer").dataset.value = "";
  wordBox.disabled = false;

  // reset #game-result
  document.querySelector("#game-result").style.display = "none";
  document.querySelector("#result-info").textContent = "";
  document.querySelector("#result-button").disabled = true;
}






// on full page load (aka document.readyState complete)
// (but why does it sort of... clash with the favicon loading?)
// sends a dummy request to /checkdb because the first response is always slow (why?)
// also stores the welcome message in #info-text for re-placement later
window.addEventListener("load", function () {
  gameData['infoText'] = document.querySelector("#info-text").textContent;

  setTimeout(function () {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/checkdb?word=@u@", true);
    xhttp.send();  
  }, 1000);
  
});

// if game is ongoing, evaluates #word-form, else, starts the game
document.querySelector("#word-form").addEventListener("submit", function (event) {
  event.preventDefault();
  if (gameData['isOngoing']) {
    evaluateWordBox();
  } else {
    var wordBox = document.querySelector("#word-box");
    wordBox.value = "";
    wordBox.placeholder = "";
    startGame();
  }
});

// customizes typing sound effects, and submission with spacebar
document.querySelector("#word-box").addEventListener("keydown", function (event) {
  switch (event.which || event.keyCode) {
    case 32: // space: if playing, evaluates the text box like enter would
      if (gameData['isOngoing']) {
        event.preventDefault();
        document.querySelector("#word-form").dispatchEvent(new Event('submit'));
      }
      break;
    case 27: // escape: don't make a sound
      break;
    default: // any other key
      playSfx("typing");
  }
});

// animate the portal outside of the game
// also animates the letter count inside the game
document.querySelector("#word-box").addEventListener("input", function () {
  // console.log(this.value.length);
  if (gameData['isOngoing']) {
    // console.log("pop up!")
    flashNotif("#word-score-popup", this.value.length, this.value.length)
    return;
  }
  // console.log("no game");
  var portal = document.querySelector("#portal");
  if (this.value != "") {
    // console.log("not blank");
    if (portal.classList[0] != "enter") {
      // console.log("added 'enter'");
      portal.classList.remove("enter", "exit");
      portal.classList.add("enter");
      replayAnimation(portal);
      portal.style.opacity = 0.8;
      hum.play();
    }
  } else {
    // console.log("blank");
    if (portal.classList[0] == "enter") {
      // console.log("'enter' removed");
      portal.classList.remove("enter", "exit");
      portal.classList.add("exit");
      portal.style.opacity = 0;
      hum.pause();
    }
  }
});

// focuses on #word-box whenever the play area is clicked/tapped
document.querySelector("#game-area").addEventListener("click", focusWordBox);
document.querySelector("#scored-area").addEventListener("click", focusWordBox);
function focusWordBox() {
  document.querySelector("#word-box").focus();
}

// for keyboard users, holding the esc key quits the game
document.addEventListener("keydown", function (event) {
  if (gameData['isOngoing'] && event.key === "Escape" && event.repeat) {
    event.preventDefault();
    resetGame();
  }
});

// TODO thematic quitting option for mobile... pressing down on the alien?
// var Alien = document.querySelector("#alien");
// var ExitTimer = 0;
// Alien.addEventListener("mousedown", function () {
//   if (gameData['isOngoing']) {
//     console.log("timer start");
//     ExitTimer = setTimeout(function () {
//       resetGame();
//     }, 1000);
//   }
// });
// Alien.addEventListener("mouseup", function () {
//   console.log("mouseup");
//   if (gameData['isOngoing']) { clearTimeout(ExitTimer); }
// });
// Alien.addEventListener("mouseleave", function () {
//   console.log("mouseleave");
//   if (gameData['isOngoing']) { clearTimeout(ExitTimer); }
// });






// can i just use this to run literally everything here only when the page is ready?
// var pageStart = new Date();
// console.log("page ready?")
// document.onreadystatechange = () => {
//   if (document.readyState === 'complete') {
//     console.log("ready!");
//     console.log(new Date()-pageStart);
//   }
// };



// }
// catch(err) {
//   alert(err);
// }