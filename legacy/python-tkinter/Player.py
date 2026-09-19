class Player:
    def __init__(self, name):
        self.name = name

    def get_name(self):
        return self.name

    def get_symbol(self):
        return "X"

    def get_color(self):
        return "#bbf2aa"

    def make_move(self, row, col):
        return row, col

    def make_random_move(self, game, gui):
        import random
        import time
        time.sleep(1)
        empty_cells = [(r, c) for r in range(3) for c in range(3) if game.getBoard()[r][c] is None]
        return random.choice(empty_cells)