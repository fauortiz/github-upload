
# SHIRISTORY

A single player word chain browser game.

_It's the year 20XX. You are being pestered by tiny aliens who want to learn about our language. You just want to get on with your life, so you help them. However, they only understand our speech through a very specific rule..._

Your goal is to earn as many points as you can by typing a chain of words that all start with the last letter of the previous word. With this early version of the game, simply aim for your highest score!

This was coded by me as my final project for the web track of CS50x 2020, so please be kind!

* 2 minute overview video for the project - https://youtu.be/I46j9JdJcho
* link to the code (without the binaries) - https://github.com/fauortiz/shiristory

## How to Play

![gameplay demo](readme.gif)

#### Starting the game

To start the game, type anything into the text box and send it by pressing Enter or Space.

_A portal to the alien dimension will appear and the aliens will rush in._

#### General Rules
* Each word you type and send earns you points equivalent to the length of that word.
* Each consecutive word must begin with the last letter of the previous word.
* Typing invalid words incurs no penalties apart from the time lost in committing the error.
* You have 2 minutes to earn as many points as you can.

#### Ending the game

* After the 2 minutes, your results will be displayed and your game will be saved if you are logged in.
* Alternatively, hold the Esc key to exit out of the game. (Mobile equivalent still pending)

#### Prompts

_Some of the aliens have specific words that they want to discover, and they'll be sure to let you know about it._

You can earn more points on top of scoring words by fulfilling the prompts shown above the text box.
Quickly chain your words while also fulfilling prompts to be able to reach high scores.

#### Playing with an account

You can create an account and log in, and this will keep a record all of your games.
In your profile page, you can see data on all of your games, such as your highest scoring games, or your most frequently used words.


## About the project (and learnings)

### Concept

The idea was to make something that was sufficiently complex enough that it would force me to explore a lot of functionality fast, but I also wanted to make something I'll probably never get a chance to make at work. It started out as a simple word chain game that tested the typing ability and active vocabulary of players, but the design and scope evolved over time.

In line with the web track, I managed to learn a lot about Javascript, the DOM, AJAX, JSON, a ton about CSS, SQL and race conditions, and even about virtual environments and using VSCode, and a little about Git and Github.

### Built With

Despite learning of SASS/jQuery/JS frameworks during development, I decided to only use the standard versions of each so I could at least familiarize myself with them.

For the backend, it was based off of the Finance problem set due to my lack of Flask knowledge, but I added some AJAX functionality just to try it out.

* Frontend
  * vanilla HTML, CSS, and JS
  * bootstrap (for the navbar only)
* Backend
  * Flask
  * SQLite

### Wordlist

In order to determine the validity of an english word, I made use of SCOWL, a word list database used for spell checkers. I made a combined database of all of their available english dialects, with a word list up to size 80. This was to make sure to include even the unusual words used in other word games like Scrabble.

SCOWL (And Friends) - http://wordlist.aspell.net/

I also attempted to analyze the Google Books Ngrams massive data set to have a basis for the game balance, but after some time I figured someone else must have done that already and yeah, someone has. I've linked his analysis below.

English Letter Frequency Counts: Mayzner Revisited by Peter Norvig - https://norvig.com/mayzner.html

I used this to inform how I designed the game, often by removing unfun game states. If I decided to continue developing this game, the data can be of further use.

### SQLite and AJAX

The word list is stored server-side, in a SQLite database. Each time the user submits a string, it is sent to the Flask app, where it checks if that word is in the word list. The game can only proceed normally once it receives that confirmation.

It works fast and plays well for now in the development build, but the glaring issue is that not only does this have the potential to be unplayably slow for a timed game, this is also unnecessary since it is entirely possible to just send the wordlist client-side.

The primary reason why it remains as such is because the required changes are outside the scope of the course, and I don't have the time to learn it yet.

### Bootstrap

I tried to use Bootstrap for most of the site, but it really didn't lend itself to the mostly static layout of a browser game and ended up becoming more of a crutch. This also allowed for more precise control of the layout without having to override Bootstrap all the time. I also learned and made prominent use of a combination of grid and flex.

### Future Scope

* The UI and game feel need a lot more work
* Design richer game mechanics and more content
* It's not currently hosted online
* The wordlist database being server-side is suboptimal
* Cheating by tampering with the game's JS code is very doable
* The code is unstructured, lacking a design pattern (like MVC)


## Assets used

All these assets below are used for this non-commercial version of the game.

* Fonts
  * Title font is Salbabida Sans by Jo Malinis for Bad Student - https://www.instagram.com/p/CHiXkLRnSYP/
  * Google Fonts used: Capriola, Open Sans

* Images
  * Background image by Jack B via Unsplash - https://unsplash.com/photos/ICP7YlDf7LE
  * Portal image from hiclipart - https://www.hiclipart.com/free-transparent-background-png-clipart-idgog
  * Aliens are just Baby Digimon via its fandom site - https://digimon.fandom.com/wiki/Digimon_Wiki

* Music
  * chill by sakura Hz - https://soundcloud.com/sakurahertz/royalty-free-music-chill

* SFX
  * mechanical key hard by bigmonmulgrew - https://freesound.org/people/bigmonmulgrew/sounds/378085/
  * confirm jingle by JustInvoke - https://freesound.org/people/JustInvoke/sounds/446114/
  * loopable hum by -Patrick- - https://freesound.org/people/-Patrick-/sounds/466451/
  * 8-bit explosion by jhyland - https://freesound.org/people/jhyland/sounds/539668/


## Author

The game was written by me, Francis Ortiz, for CS50x. Thank you for reading!

