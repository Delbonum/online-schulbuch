from BaseAI import BaseAI
import random

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
        allowed_cells = [cell for cell in empty_cells if not game.getAllMoves() + [cell] in self.memory]
        """
        choice = random.choice(empty_cells)
        while game.getAllMoves() + [choice] in self.memory:
            choice = random.choice(empty_cells)
        return choice
        """
        return random.choice(allowed_cells)

    def add_rule(self, game, gui):
        if game.getGameover() and not game.getAllMoves() in self.memory:
            if game.check_winner() == game.getPlayer():
                self.memory.append(game.getAllMoves()[:-1])
                self.sort_rules()
                #print("Memory: " + str(self.memory))
                gui.reset_text()
                # Anzahl der Zeilen in Memory printen
                print("Anzahl der Regeln: " + str(len(self.memory)))

    # Sortiert die Regeln nach Länge und alphabetisch
    def sort_rules(self):
        self.memory = sorted(self.memory, key=lambda x: (len(x), x))