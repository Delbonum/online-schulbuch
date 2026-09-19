from BaseAI import BaseAI
import random
import bisect

class LearningAI(BaseAI):
    def __init__(self, name):
        super().__init__(name)
        self.memory = []

    def get_text(self):
        rule_description = (
            "Regelwerk\n"
            "Die folgenden Spiel-Zustände werden von der KI vermieden:\n\n"
        )
        return rule_description + "\n".join(str(rule) for rule in self.memory)

    def make_a_move(self, game, gui):
        # Zufällige Zelle auswählen
        empty_cells = [(r, c) for r in range(3) for c in range(3) if game.getBoard()[r][c] is None]
        allowed_cells = [cell for cell in empty_cells if not self.is_in_memory(game.getAllMoves() + [cell])]
        #choice = random.choice(empty_cells)
        """
        while game.getAllMoves() + [choice] in self.memory:
            choice = random.choice(empty_cells)
        """
        if allowed_cells:
            choice = random.choice(allowed_cells)
        else:
            raise Exception("No allowed cells left")
        return choice

    def is_in_memory(self, move_sequence):
        index = bisect.bisect_left(self.memory, move_sequence)
        return index < len(self.memory) and self.memory[index] == move_sequence

    def add_rule(self, game, gui):
        if game.getGameover() and not self.is_in_memory(game.getAllMoves()[:-1]):
            if game.check_winner() == game.getPlayer():
                bisect.insort(self.memory, game.getAllMoves()[:-1])
                #print("Memory: " + str(self.memory))
                gui.reset_text()

    # Sortiert die Regeln nach Länge und alphabetisch
    def sort_rules(self):
        self.memory = sorted(self.memory, key=lambda x: (len(x), x))