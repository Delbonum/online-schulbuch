from BaseAI import BaseAI
import time


class AlgorithmAI(BaseAI):
    def __init__(self, name):
        super().__init__(name)

    def get_text(self):
        description = (
            "Der Algorithmus ist so programmiert, dass er immer gewinnt oder ein Unentschieden erreicht.\n"
            "Pseudocode:\n\n"
            "Falls es sich um den ersten Zug handelt:\n"
            "\tFalls der Spieler in der Mitte beginnt:\n"
            "\t\tSetze in ein Eckfeld.\n"
            "\tFalls der Spieler in einem Eckfeld oder an einem Rand beginnt:\n"
            "\t\tSetze in die Mitte.\n"
            "Falls es sich um einen Folgezug handelt:\n"
            "\tFalls zwei Symbole von Ada in einer Zeile, Spalte oder in einer großen Diagonale sind und entsprechend die verbleibende Zelle frei ist:\n"
            "\t\tSetze in die verbleibende Zelle.\n"
            "\tFalls zwei Symbole des Spielers in einer Zeile, Spalte oder in einer großen Diagonalen sind und entsprechend die verbleibende Zelle frei ist:\n"
            "\t\tSetze in die verbleibende Zelle.\n"
            "\tFalls zwei Symbole des Spielers in einer großen Diagonale sind und keine Zelle in der Diagonale frei ist:\n"
            "\t\tFalls in der Mitte ein Symbol des Spielers ist und es ein freies Eckfeld gibt:\n"
            "\t\t\tSetze in ein freies Eckfeld.\n"
            "\t\tFalls in der Mitte ein Symbol von Ada ist und es ein freies Randfeld:\n"
            "\t\t\tSetze in ein freies Randfeld.\n"
            "\tFalls zwei Symbole des Spielers diagonal zueinander (nicht in der Diagonalen) liegen:\n"
            "\t\tSetze in das freie Eckfeld, das beide diagonal zueinander liegenden Symbole des Spielers berührt.\n"
            "\tFalls eine Eckposition frei ist:\n"
            "\t\tSetze in eine freie Ecke.\n"
            "\tFalls keine der obigen Bedingungen zutrifft:\n"
            "\t\tSetze in ein freies Feld."
        )
        return description

    # Funktion, um zu überprüfen, ob zwei Symbole in einer Zeile sind
    def check_two_in_line(self, game, moves, symbol):
        for row in range(3):
            if moves.count((row, 0)) + moves.count((row, 1)) + moves.count((row, 2)) == 2:
                print("AI erkennt, dass zwei Symbole von " + str(symbol.get_name()) + " in Zeile " + str(row) + " sind.")
                for col in range(3):
                    if game.getBoard()[row][col] is None:
                        print("AI choosing " + str((row, col)))
                        return row, col
        return None

    # Funktion, um zu überprüfen, ob zwei Symbole in einer Spalte sind
    def check_two_in_column(self, game, moves, symbol):
        for col in range(3):
            if moves.count((0, col)) + moves.count((1, col)) + moves.count((2, col)) == 2:
                print("AI erkennt, dass zwei Symbole von " + str(symbol.get_name()) + " in Spalte " + str(
                    col) + " sind.")
                for row in range(3):
                    if game.getBoard()[row][col] is None:
                        print("AI choosing " + str((row, col)))
                        return row, col
        return None

    # Funktion, um zu überprüfen, ob zwei Symbole in einer Diagonalen sind
    def check_two_in_diagonal(self, game, gui, moves, symbol, delay):
        if moves.count((0, 0)) + moves.count((1, 1)) + moves.count((2, 2)) == 2:
            print("AI erkennt, dass zwei Symbole von " + str(symbol.get_name()) + " in der Hauptdiagonalen sind.")
            for i in range(3):
                if game.getBoard()[i][i] is None:
                    print("AI choosing " + str((i, i)))
                    if delay:
                        gui.highlight_line(11, self.green, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(12, self.green, True)
                    return i, i
            print("Symbol: ", symbol.get_name())
            print("Player: ", game.getPlayer().get_name())
            if symbol == game.getPlayer():
                print(delay)
                print(delay)
                print(delay)
                print(delay)
                print(delay)
                if delay:
                    gui.highlight_line(11, self.red, False)
                    time.sleep(self.delay_time)
                    gui.highlight_line(13, self.green, False)
                    print("TESTTESTTEST")
                    print("TESTTESTTEST")
                    print("TESTTESTTEST")
                    print("TESTTESTTEST")
                    print("TESTTESTTEST")
                    time.sleep(self.delay_time)
                if (1, 1) in moves:
                    if delay and self.check_free_corner(game):
                        gui.highlight_line(14, self.green, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(15, self.green, True)
                        time.sleep(self.delay_time)
                    elif delay and not self.check_free_corner(game):
                        gui.highlight_line(14, self.red, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(16, self.red, False)
                    return self.check_free_corner(game)
                else:
                    if delay and self.check_free_edge(game):
                        gui.highlight_line(14, self.red, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(16, self.green, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(17, self.green, True)
                        time.sleep(self.delay_time)
                    elif delay and not self.check_free_edge(game):
                        gui.highlight_line(14, self.red, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(16, self.red, False)
                    return self.check_free_edge(game)
        if moves.count((0, 2)) + moves.count((1, 1)) + moves.count((2, 0)) == 2:
            print("AI erkennt, dass zwei Symbole von " + str(symbol.get_name()) + " in der Nebendiagonalen sind.")
            for i in range(3):
                if game.getBoard()[i][2 - i] is None:
                    print("AI choosing " + str((i, 2 - i)))
                    if delay:
                        gui.highlight_line(11, self.green, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(12, self.green, True)
                    return i, 2 - i
            if symbol == game.getPlayer():
                if (1, 1) in moves:
                    if delay:
                        gui.highlight_line(14, self.green, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(15, self.green, True)
                        time.sleep(self.delay_time)
                    return self.check_free_corner(game)
                else:
                    if delay:
                        gui.highlight_line(14, self.red, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(16, self.green, False)
                        time.sleep(self.delay_time)
                        gui.highlight_line(17, self.green, True)
                        time.sleep(self.delay_time)
                    return self.check_free_edge(game)
        #return None

    # Funktion, um in ein freies Randfeld zu setzen
    def check_free_edge(self, game):
        for e in [(0, 1), (1, 0), (1, 2), (2, 1)]:
            if game.getBoard()[e[0]][e[1]] is None:
                print("AI erkennt freies Randfeld.")
                print("AI choosing " + str(e))
                return e[0], e[1]
        return None

    # Funktion, um in ein freies Eckfeld zu setzen
    def check_free_corner(self, game):
        for e in [(0, 0), (0, 2), (2, 0), (2, 2)]:
            if game.getBoard()[e[0]][e[1]] is None:
                print("AI erkennt freies Eckfeld.")
                print("AI choosing " + str(e))
                return e[0], e[1]
        return None

    # Funktion, um bei zwei diagonalen Symbolen auf das freie Eckfeld zu setzen
    def check_two_diagonal(self, game, moves, symbol):
        if (0, 1) and (1, 2) in moves and game.getBoard()[0][2] is None:
            print("AI erkennt zwei diagonale Symbole von " + str(symbol.get_name()) + ".")
            print("AI choosing " + str((0, 0)))
            return 0, 2
        elif (0, 1) and (1, 0) in moves and game.getBoard()[0][0] is None:
            print("AI erkennt zwei diagonale Symbole von " + str(symbol.get_name()) + ".")
            print("AI choosing " + str((0, 2)))
            return 0, 0
        elif (1, 0) and (2, 1) in moves and game.getBoard()[2][2] is None:
            print("AI erkennt zwei diagonale Symbole von " + str(symbol.get_name()) + ".")
            print("AI choosing " + str((2, 2)))
            return 2, 0
        elif (1, 2) and (2, 1) in moves and game.getBoard()[2][0] is None:
            print("AI erkennt zwei diagonale Symbole von " + str(symbol.get_name()) + ".")
            print("AI choosing " + str((2, 0)))
            return 2, 2

    def make_a_move(self, game, gui):
        # Erster Zug
        if len(game.getAllMoves()) == 1:
            gui.highlight_line(3, self.green, False)
            time.sleep(self.delay_time)
            # Gegner beginnt in der Mitte --> Setze in ein Eckfeld
            if game.getAllMoves()[0] == (1, 1):
                gui.highlight_line(4, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(5, self.green, True)
                return 0, 0
            # Gegner beginnt in einem Eckfeld oder an einem Rand --> Setze in die Mitte
            else:
                gui.highlight_line(4, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(6, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(7, self.green, True)
                return 1, 1
        # Folgezüge
        else:
            gui.highlight_line(3, self.red, False)
            time.sleep(self.delay_time)
            gui.highlight_line(8, self.green, False)
            time.sleep(self.delay_time)

            move = self.check_two_in_line(game, game.getAIMoves(), self)
            if move:
                gui.highlight_line(9, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(10, self.green, True)
                return move

            move = self.check_two_in_column(game, game.getAIMoves(), self)
            if move:
                gui.highlight_line(9, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(10, self.green, True)
                return move

            move = self.check_two_in_diagonal(game, gui, game.getAIMoves(), self, False)
            if move:
                gui.highlight_line(9, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(10, self.green, True)
                return move

            move = self.check_two_in_line(game, game.getPlayerMoves(), game.getPlayer())
            if move:
                gui.highlight_line(9, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(11, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(12, self.green, True)
                return move

            move = self.check_two_in_column(game, game.getPlayerMoves(), game.getPlayer())
            if move:
                gui.highlight_line(9, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(11, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(12, self.green, True)
                return move

            move = self.check_two_in_diagonal(game, gui, game.getPlayerMoves(), game.getPlayer(), False)
            if move:
                move = self.check_two_in_diagonal(game, gui, game.getPlayerMoves(), game.getPlayer(), True)
                gui.highlight_line(9, self.red, False)
                time.sleep(self.delay_time)
                return move

            move = self.check_two_diagonal(game, game.getPlayerMoves(), game.getPlayer())
            if move:
                gui.highlight_line(9, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(11, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(13, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(18, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(19, self.green, True)
                return move

            move = self.check_free_edge(game)
            if len(game.getAllMoves()) == 3 and move:
                gui.highlight_line(9, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(11, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(13, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(18, self.red, False)
                time.sleep(self.delay_time)
                gui.highlight_line(20, self.green, False)
                time.sleep(self.delay_time)
                gui.highlight_line(21, self.green, True)
                return move

        for row in range(3):
            for col in range(3):
                if game.getBoard()[row][col] is None:
                    gui.highlight_line(9, self.red, False)
                    time.sleep(self.delay_time)
                    gui.highlight_line(11, self.red, False)
                    time.sleep(self.delay_time)
                    gui.highlight_line(13, self.red, False)
                    time.sleep(self.delay_time)
                    gui.highlight_line(18, self.red, False)
                    time.sleep(self.delay_time)
                    gui.highlight_line(20, self.red, False)
                    time.sleep(self.delay_time)
                    gui.highlight_line(22, self.green, False)
                    time.sleep(self.delay_time)
                    gui.highlight_line(23, self.green, True)
                    return row, col
