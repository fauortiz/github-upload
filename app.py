from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from tempfile import mkdtemp
from time import sleep
from werkzeug.security import check_password_hash, generate_password_hash

SLEEP_TIME = 20 / 1000
DB_NAME = "sqlite:///appdb_2.db"

# decorator for user login managem  ent
from functools import wraps

def login_required(f):
    """
    Decorate routes to require login.

    http://flask.pocoo.org/docs/1.0/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function



# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
# removed this from global scope and the errors stopped... gotta study more
db = SQL(DB_NAME)


@app.route("/")
def index():

    if session.get("user_id") is None:
        return render_template("game.html")

    username = db.execute("SELECT username FROM users WHERE id = :id",
    id=session['user_id'])[0]['username']
    return render_template("game.html", username=username)





# sends a json file containing the corresponding SQL database row, if there is a match
@app.route("/checkdb", methods=["GET"])
def check():
    
    # I moved this from global scope to here to avoid this error (while I'm still new to this. caching & process IDs?):
    # sqlite3.ProgrammingError: SQLite objects created in a thread can only be used in that same thread.
    # source: https://www.reddit.com/r/learnpython/comments/5cwx34/flask_sqlite_error/
    # another possible solution, from https://docs.python.org/3/library/sqlite3.html: 
    # By default, check_same_thread is True and only the creating thread may use the connection. If set False, the returned connection may be shared across multiple threads. When using multiple threads with the same connection writing operations should be serialized by the user to avoid data corruption.

    # KNOWN ERRORS:
    # sqlalchemy.exc.InvalidRequestError: A transaction is already begun.  Use subtransactions=True to allow subtransactions.
    #       this one occurs only during really, really fast get requests (from typing gods)

    # OK so...having the database configuration within the route seems to have made no difference/done no help

    # sleep(SLEEP_TIME)


    # TENTATIVE GAME RULES IMPLEMENTATION:
    # if there is a case-sensitive match, select it
    # else if there is are case-insensitive matches, select the one with the lowest size
    # else, select nothing
    word = request.args.get('word')
    rows = db.execute("SELECT * FROM words WHERE word = :word", word=word)
    if not rows:
        rows = db.execute("SELECT word, MIN(size) AS size FROM words WHERE word = :word COLLATE NOCASE", word=word)
    print(rows)

    # jsonify() is a wrapper of json.dump(); its value is the HTTP response that's to be sent back to the client
    return jsonify(rows[0])


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            flash('Must provide username.')
            return render_template("login.html")

        # Ensure password was submitted
        elif not request.form.get("password"):
            flash('Must provide password.')
            return render_template("login.html")

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = :username",
                          username=request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            flash('Invalid username and/or password.')
            return render_template("login.html")

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""
    # Forget any user_id
    session.clear()
    # Redirect user to homepage
    return redirect("/")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    
    # user submits registration form
    if request.method == "POST":

        # if no username entered
        if not request.form.get("username"):
            flash("Invalid username.")
            return render_template("register.html")

        # Query database for username to check if username is taken
        if db.execute("SELECT * FROM users WHERE username = :username", username=request.form.get("username")):
            flash("Sorry, this username is taken.")
            return render_template("register.html")

        # if passwords are invalid
        if not request.form.get("password") or request.form.get("password") != request.form.get("confirmation"):
            flash("Invalid password or password confirmation.")
            return render_template("register.html")

        # insert new user into users table of finance.db
        db.execute("INSERT INTO users (username, hash) VALUES (:username, :hash)",
                   username=request.form.get("username"),
                   hash=generate_password_hash(request.form.get("password")))
        
        # go to login route
        return redirect("/login")

    # user gets registration form
    else:
        return render_template("register.html")


@app.route("/about", methods=["GET"])
def about():
    return render_template("about.html")


@app.route("/profile", methods=["GET"])
@login_required
def profile():

    # basic data of the current user (dict)
    user = db.execute("""SELECT username, points, total_points, total_helped
                              FROM users WHERE id = :id""", 
                              id=session['user_id'])[0]
    print(user)

    # record of the user's top 5 games (list of dicts)
    games = db.execute("""SELECT points, helped, timestamp 
                              FROM games WHERE user_id = :id
                              ORDER BY points DESC LIMIT 5""",
                              id=session['user_id'])
    print(games)

    # average score per game (float)
    average_score = db.execute("SELECT AVG(points) FROM games WHERE user_id = :id",
                                id=session['user_id'])[0]['AVG(points)']
    print(average_score)

    # favorite words + their frequency, top 10 (list of dicts)
    favorites = db.execute("""SELECT word_id AS word, count(word_id) AS count
                                   FROM word_usage WHERE game_id IN (
                                   SELECT id FROM games WHERE user_id = :id) 
                                   GROUP BY word ORDER BY count DESC, word ASC 
                                   LIMIT 26""", id=session['user_id'])
    print(favorites)

    # maybe i can figure out prompts that hurt the player enjoyment?
    # like... have the game send back a signal when the player doesn't input a word for a prolonged period?
    # it'll have data on the prompt, as well as the current last letter maybe?

    # number of times each letter was used as the first letter in all the games of the user
    letters = db.execute("""SELECT LOWER(SUBSTR(word_id,1,1)) AS letter, count(*) AS count
                            FROM word_usage WHERE game_id IN (
                            SELECT id FROM games WHERE user_id = :id)
                            GROUP BY letter
                            ORDER BY count DESC, letter ASC""",
                            id=session['user_id'])
    print(letters)


    # total unique words used ever (int)
    words_used = db.execute("""SELECT COUNT(DISTINCT word_id) AS count
                FROM word_usage 
                WHERE game_id IN (
                SELECT id FROM games
                WHERE user_id = :id)""", id=session['user_id'])[0]['count']
    print(words_used)

    # step 1: divide this by 357567
    # step 2: know humanity's limits

    # native speakers, 20-35k passive(?) words. i scored 25.2k
    # foreign learners, 2.5-9k. average 4.5k.
    # http://testyourvocab.com/ look into this for more info

    # first 100 words are used in 50%, 1000 words are used in 89%
    # https://wordcounter.io/blog/how-many-words-does-the-average-person-know/
    # how hard it is to get how much higher than that?

    # figure out that sweet spot where achievements can lie, through some playtests


    return render_template("profile.html", user=user, games=games, 
        average_score=round(average_score), favorites=favorites, letters=letters, 
        words_used=words_used)


# if logged in, records game results into the database
@app.route("/record", methods=["POST"])
def record():

    # does nothing if not logged in
    if session.get("user_id") is None:
        return "fail"

    # the assumption is this route is only taken when a game has finished, aka the timer finished.
    jsondata = request.json
    print(jsondata)

    points = jsondata[0][0]
    helped = jsondata[0][1]
    used_words = jsondata[1]

    # this sleep thing... study transactions, threads, race conditions, sqlite
    # this is one sequential call, why are there collisions?

    sleep(SLEEP_TIME)

    # starts and locks in transaction

    # sleep(SLEEP_TIME)

    db.execute("BEGIN")

    # get a dict of the points data of the user
    userdata = db.execute("SELECT points, total_points, total_helped FROM users WHERE id = :id", 
    id=session["user_id"])[0]

    # increment that dict
    userdata["points"] += points
    userdata["total_points"] += points
    userdata["total_helped"] += helped

    # update the points data of the user
    db.execute("UPDATE users SET points = :points, total_points = :total, total_helped = :helped WHERE id = :id", 
    points=userdata['points'], total=userdata['total_points'], helped=userdata['total_helped'], id=session['user_id'])

    # update games table, store the id
    game_id = db.execute("INSERT INTO games (user_id, points, helped, timestamp) VALUES (:id, :points, :helped, datetime('now'))", 
    id=session["user_id"], points=points, helped=helped)

    # insert all used words into word_usage, approach 1
    for word in used_words:
        db.execute("INSERT INTO word_usage (game_id, word_id) VALUES (:game_id, :word)",
        game_id=game_id, word=word)

    # # insert all used words into word_usage, approach 2
    # # faster but unsafe... there must be a better way!
    # sql_string = "INSERT INTO word_usage (game_id, word_id) VALUES "
    # for word in used_words:
    #     sql_string += f"(:game_id, '{word}'), "
    # sql_string.rstrip(", ")
    # db.execute(sql_string, game_id=game_id)

    # commits all the above, else, commits nothing
    db.execute("COMMIT")

    return "ok"
