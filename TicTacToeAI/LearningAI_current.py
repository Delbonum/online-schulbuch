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
        rule_description += "\n".join(str(rule) for rule in sorted(self.memory))+ "\n\n"+"Die folgenden Spiel-Zustände werden von der KI forciert:\n\n"
        rule_description += "\n".join(str(rule) for rule in sorted(self.positive_memory))
        return rule_description

    def make_a_move(self, game, gui):
        empty_cells = [(r, c) for r in range(3) for c in range(3) if game.getBoard()[r][c] is None]
        allowed_cells = [cell for cell in empty_cells if tuple(game.getAllMoves() + [cell]) not in self.memory]
        best_move = None
        for choice in allowed_cells:
            if tuple(game.getAllMoves() + [choice]) not in self.memory:
                if best_move is None or tuple(game.getAllMoves() + [choice]) in self.positive_memory:
                    best_move = choice
        if tuple(game.getAllMoves() + [best_move]) in self.positive_memory:
            return best_move
        """
        # Versuche zu gewinnen
        for cell in allowed_cells:
            if self.is_winning_move(game, cell):
                return cell
        # Verhindere den Gewinn des Gegners
        for cell in allowed_cells:
            if self.is_winning_move(game, cell, opponent=True):
                return cell
        """
        return random.choice(allowed_cells)

    def add_rule(self, game, gui):
        if game.getGameover():
            moves = tuple(game.getAllMoves()[:-1])
            if game.check_winner() == game.getPlayer():
                self.memory.add(moves)
            else:
                self.positive_memory.add(moves)
            gui.reset_text()
            print("Anzahl der Regeln: " + str(len(self.memory)))
            print("Anzahl der positiven Regeln: " + str(len(self.positive_memory)))
            print("Neue Regel: " + str(moves) + " in " + ("positiv" if game.check_winner() == game.getPlayer() else "negativ"))

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
