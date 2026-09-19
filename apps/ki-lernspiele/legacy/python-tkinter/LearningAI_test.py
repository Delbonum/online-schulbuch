from BaseAI import BaseAI
import random


class LearningAI(BaseAI):
    def __init__(self, name):
        super().__init__(name)
        self.memory = {}
        self.history = []

    def get_text(self):
        rule_description = (
            "Regelwerk\n"
            "Die folgenden Spiel-Zustände werden von der KI verwendet:\n\n"
        )
        return rule_description + "\n".join(f"{state}: {moves}" for state, moves in self.memory.items())

    def get_state(self, game):
        return tuple(tuple(row) for row in game.getBoard())

    def make_a_move(self, game, gui):
        state = self.get_state(game)
        if state not in self.memory:
            self.memory[state] = [(r, c) for r in range(3) for c in range(3) if game.getBoard()[r][c] is None]

        moves = self.memory[state]
        if not moves:
            raise ValueError("Keine möglichen Züge für den aktuellen Spielzustand gefunden.")

        move = random.choice(moves)
        self.history.append((state, move))
        return move

    def add_rule(self, game, gui):
        winner = game.check_winner()
        if winner == game.getPlayer():
            reward = -1
        elif winner == game.getAI():
            reward = 1
        else:
            reward = 0

        for state, move in self.history:
            if reward == 1:
                self.memory[state].append(move)
            elif reward == -1 and move in self.memory[state]:
                self.memory[state].remove(move)

        self.history = []
        gui.reset_text()