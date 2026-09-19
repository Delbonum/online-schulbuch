class TicTacToeGame:
    def __init__(self, player, ai_instance):
        self.board = [[None for _ in range(3)] for _ in range(3)]
        self.player = player
        self.ai = ai_instance
        self.active_player = player
        self.gameover = False
        self.allMoves = []
        self.won_games = 0
        self.lost_games = 0
        self.draw_games = 0
        self.total_games = 0

    def getPlayer(self):
        return self.player

    def setPlayer(self, player):
        self.player = player

    def getAI(self):
        return self.ai

    def setAI(self, ai_instance):
        self.ai = ai_instance

    def getBoard(self):
        return self.board

    def getGameover(self):
        return self.gameover

    def setGameover(self, gameover):
        self.gameover = gameover

    def getAllMoves(self):
        return self.allMoves

    def getPlayerMoves(self):
        return self.allMoves[::2]

    def getAIMoves(self):
        return self.allMoves[1::2]

    def addMove(self, move):
        self.allMoves.append(move)

    def changeCell(self, row, col, instance):
        if self.board[row][col] is None and instance == self.active_player:
            #row, col = instance.make_move(row, col)
            self.board[row][col] = instance
            self.allMoves.append((row, col))
            self.active_player = self.ai if self.active_player == self.player else self.player
            return True
        return False

    def check_winner(self):
        # Zeilen überprüfen
        for row in self.board:
            if row[0] == row[1] == row[2] is not None:
                self.setGameover(True)
                return row[0]

        # Spalten überprüfen
        for col in range(3):
            if self.board[0][col] == self.board[1][col] == self.board[2][col] is not None:
                self.setGameover(True)
                return self.board[0][col]

        # Diagonalen überprüfen
        if self.board[0][0] == self.board[1][1] == self.board[2][2] is not None:
            self.setGameover(True)
            return self.board[0][0]
        if self.board[0][2] == self.board[1][1] == self.board[2][0] is not None:
            self.setGameover(True)
            return self.board[0][2]

        return None

    def is_full(self):
        for row in self.board:
            if None in row:
                return False
        self.setGameover(True)
        return True

    def end_of_game(self):
        winner = self.check_winner()
        if winner is not None:
            return winner
        else:
            return self.is_full()

    def new_game(self):
        self.board = [[None for _ in range(3)] for _ in range(3)]
        self.active_player = self.player
        self.setGameover(False)
        self.allMoves = []

    def update_statistics(self, winner):
        self.total_games += 1
        if winner == self.player:
            self.lost_games += 1
        elif winner == self.ai:
            self.won_games += 1
        else:
            self.draw_games += 1

    def get_statistics(self):
        return self.won_games, self.lost_games, self.draw_games, self.total_games