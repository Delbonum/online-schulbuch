from BaseAI import BaseAI
import random
#import bisect
import concurrent.futures
import functools


class LearningAI(BaseAI):
    def __init__(self, name):
        super().__init__(name)
        self.memory = set()
        self.memo = {}

    def get_text(self):
        rule_description = (
            "Regelwerk\n"
            "Die folgenden Spiel-Zustände werden von der KI vermieden:\n\n"
        )
        return rule_description + "\n".join(str(rule) for rule in self.memory)

    def make_a_move(self, game, gui):
        # Zufällige Zelle auswählen
        empty_cells = [(r, c) for r in range(3) for c in range(3) if game.getBoard()[r][c] is None]
        allowed_cells = self.parallel_check_moves(game, empty_cells)
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

    @functools.lru_cache(maxsize=None)
    def is_in_memory(self, move_sequence):
        move_tuple = tuple(move_sequence)
        if move_tuple in self.memo:
            return self.memo[move_tuple]
        #index = bisect.bisect_left(self.memory, move_sequence)
        #result = index < len(self.memory) and self.memory[index] == move_sequence
        result = move_tuple in self.memory
        self.memo[move_tuple] = result
        return result

    def add_rule(self, game, gui):
        if game.getGameover() and not self.is_in_memory(tuple(game.getAllMoves()[:-1])):
            if game.check_winner() == game.getPlayer():
                #bisect.insort(self.memory, game.getAllMoves()[:-1])
                self.memory.add(tuple(game.getAllMoves()[:-1]))
                self.memo[tuple(game.getAllMoves()[:-1])] = True
                #print("Memory: " + str(self.memory))
                gui.reset_text()

    def parallel_check_moves(self, game, empty_cells):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = {executor.submit(self.is_in_memory, tuple(game.getAllMoves() + [cell])): cell for cell in
                       empty_cells}
            allowed_cells = [futures[future] for future in concurrent.futures.as_completed(futures) if
                             not future.result()]
        return allowed_cells

    # Sortiert die Regeln nach Länge und alphabetisch
    def sort_rules(self):
        self.memory = sorted(self.memory, key=lambda x: (len(x), x))