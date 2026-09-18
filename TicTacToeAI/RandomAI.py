from BaseAI import BaseAI
import random
import time


class RandomAI(BaseAI):
    def __init__(self, name, additional_knowledge=False):
        super().__init__(name)
        self.add_knowledge = additional_knowledge

    def get_text(self):
        return "Diese KI wählt zufällige Züge."

    def make_a_move(self, game, gui):
        time.sleep(self.delay_time)
        empty_cells = [(r, c) for r in range(3) for c in range(3) if game.getBoard()[r][c] is None]

        if self.add_knowledge:
            # Versuche zu gewinnen
            for cell in empty_cells:
                if self.is_winning_move(game, cell):
                    return cell

            # Verhindere den Gewinn des Gegners
            for cell in empty_cells:
                if self.is_winning_move(game, cell, opponent=True):
                    return cell

        return random.choice(empty_cells)

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

    def swap_to_simulation(self):
        self.color = "#bbf2aa"
        self.symbol = "X"

    def swap_to_actual(self):
        self.color = "#f58787"
        self.symbol = "O"