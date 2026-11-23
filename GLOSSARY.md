# Tren Mexicano Scorekeeper

A mobile-first companion for a physical game of Tren Mexicano (Mexican Train dominoes). It tracks Players, Rounds and scores; the physical tiles on the table remain the source of truth for the board.

## Language

### Match structure

**Game**:
One full match of Tren Mexicano, from the first Round to the last, ending with a Winner.
_Avoid_: Session, match, partida (in code)

**Round**:
One deal of tiles within a Game, played from its Engine until a Player goes out or play is blocked. A standard Game has 13 Rounds.
_Avoid_: Hand, turn, mano

**Engine**:
The double tile that starts a Round; double-12 in the first Round, descending by one each Round down to double-0.
_Avoid_: Starting double, hub, motor

**Join Code**:
The short code that lets people enter a Game before it starts.
_Avoid_: Room code, invite, PIN

**Blocked Round**:
A Round that ends because no Player can play, so nobody goes out and there is no Round Winner.
_Avoid_: Stuck round, tranque (in code)

### People

**Player**:
A person taking part in a Game, whose scores are tracked across its Rounds.
_Avoid_: User, participant, jugador (in code)

**Account**:
A person's lasting identity (username and PIN) that carries their history across Games. A Player is one Account's participation in one Game.
_Avoid_: User, profile, login

**Starter**:
The Player who places the first tile of a Round; they also shuffle and draw their tiles last. In the first Round it is whoever draws the highest tile; afterwards it is the previous Round Winner, or after a Blocked Round the Player with the lowest Round Score in it. If several Players tie for that lowest Round Score, the Host picks the Starter from among them.
_Avoid_: Dealer, first player, mano

**Host**:
The one Player in a Game who can start it, close Rounds, correct closed scores, hand the role to another Player, and end it. Initially the Player who created the Game.
_Avoid_: Admin, owner, organizer

### Scoring

**Round Score**:
The sum of pips on the tiles a Player still holds when a Round ends; a Player who goes out scores 0, and the double-blank counts as 50.
_Avoid_: Points, hand value

**Round Winner**:
The Player who went out in a Round, scoring 0. A Blocked Round has none.
_Avoid_: Round leader

**Total Score**:
The sum of a Player's Round Scores so far in a Game.
_Avoid_: Running score, cumulative

**Winner**:
A Player with the lowest Total Score when a Game ends, whether after the last Round or ended early by the Host. Ties produce shared Winners.
_Avoid_: Champion, leader (leader = lowest Total Score mid-Game)
