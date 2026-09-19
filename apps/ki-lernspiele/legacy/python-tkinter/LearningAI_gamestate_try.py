from BaseAI import BaseAI
import random

class LearningAI(BaseAI):
    def __init__(self, name):
        super().__init__(name)
        self.memory = set()
        self.positive_memory = set()

    def get_text(self):
        rule_description = (
            "Regelwerk\n"
            "Die folgenden Spiel-Zustände werden von der KI vermieden:\n\n"
        )
        rule_description += "\n".join(str(rule) for rule in self.memory)+ "\n\n"+"Die folgenden Spiel-Zustände werden von der KI forciert:\n\n"
        rule_description += "\n".join(str(rule) for rule in self.positive_memory)
        return rule_description

    def get_state(self, game):
        return tuple(tuple(row) for row in game.getBoard())

    def make_a_move(self, game, gui):
        state = self.get_state(game)
        empty_cells = [(r, c) for r in range(3) for c in range(3) if game.getBoard()[r][c] is None]
        allowed_cells = [cell for cell in empty_cells if state not in self.memory]
        best_move = None
        for choice in allowed_cells:
            if state not in self.memory:
                if best_move is None or state in self.positive_memory:
                    best_move = choice
        if state in self.positive_memory:
            return best_move
        return random.choice(allowed_cells)

    def add_rule(self, game, gui):
        if game.getGameover():
            state = self.get_state(game)
            if game.check_winner() == game.getPlayer():
                self.memory.add(state)
            else:
                self.positive_memory.add(state)
            gui.reset_text()
            print("Anzahl der Regeln: " + str(len(self.memory)))
            print("Anzahl der positiven Regeln: " + str(len(self.positive_memory)))
            print("Neuer Zustand: " + str(state) + " in " + ("positiv" if game.check_winner() == game.getPlayer() else "negativ"))

    def is_winning_move(self, game, cell, opponent=False):
        board = game.getBoard()
        gameover = game.getGameover()
        player = game.getPlayer() if opponent else self
        r, c = cell

        # Temporär den Zug machen
        board[r][c] = player

        # Überprüfe, ob dieser Zug zum Gewinn führt
        is_winning = game.check_winner() == player

        # Rückgängig machen des temporären Zuges
        board[r][c] = None
        game.setGameover(gameover)

        return is_winning
