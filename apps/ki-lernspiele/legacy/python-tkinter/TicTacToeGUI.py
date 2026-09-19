import tkinter as tk
from tkinter import messagebox
from TicTacToeGame import TicTacToeGame
from Player import Player
from AlgorithmAI import AlgorithmAI
from LearningAI_root import LearningAI
from RandomAI import RandomAI
import threading


class TicTacToeGUI:
    def __init__(self, root, player_name, ai_name):
        self.root = root
        self.root.title("Tic Tac Toe gegen die KI")
        #self.game = TicTacToeGame(Player(player_name), AlgorithmAI(ai_name))
        if ai_name == "Ada":
            self.game = TicTacToeGame(Player(player_name), AlgorithmAI(ai_name))
        elif ai_name == "Kai":
            self.game = TicTacToeGame(Player(player_name), LearningAI(ai_name))
        else:
            self.game = TicTacToeGame(Player(player_name), RandomAI("Random"))
        self.buttons = [[None for _ in range(3)] for _ in range(3)]
        self.ai_data_info_text = None
        self.ai_data_info_label = None
        self.highlighted_lines = []
        self.ai_data_visible = True
        self.create_widgets()
        self.root.bind("<F11>", lambda event: self.new_game())

    def create_widgets(self):
        # Frame für das Tic Tac Toe Raster und die Info-Elemente
        left_frame = tk.Frame(self.root, width=300)  # Fixe Breite für den linken Frame
        right_frame_container = tk.Frame(self.root)

        left_frame.grid(row=0, column=0, sticky="nsew")
        right_frame_container.grid(row=0, column=1, sticky="nsew")

        # Konfiguration der Grid-Elemente
        self.root.grid_columnconfigure(0, weight=0)
        self.root.grid_columnconfigure(1, weight=1)
        self.root.grid_rowconfigure(0, weight=1)

        # Tic Tac Toe Raster im linken Frame
        button_size = 10  # Buttongröße
        #font_size = 16  # Schriftgröße
        grid_frame = tk.Frame(left_frame)
        grid_frame.place(relx=0.5, rely=0.5, anchor="center")

        for row in range(3):
            for col in range(3):
                button = tk.Button(grid_frame, text="", width=button_size, height=button_size // 2,
                                   bg="#f2d3aa", fg="#000000",
                                   #font=("Helvetica", font_size, "bold"),
                                   command=lambda r=row, c=col: self.on_button_click(r, c))
                button.grid(row=row, column=col, padx=2, pady=2)
                button.bind("<Return>", lambda event, r=row, c=col: self.on_button_click(r, c))
                self.buttons[row][col] = button

        # Canvas und Scrollbar für den rechten Frame
        self.canvas = tk.Canvas(right_frame_container)
        self.scrollbarRF = tk.Scrollbar(right_frame_container, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.scrollbarRF.set)

        self.canvas.grid(row=0, column=0, sticky="nsew")
        self.scrollbarRF.grid(row=0, column=1, sticky="ns")

        right_frame = tk.Frame(self.canvas)
        self.canvas.create_window((0, 0), window=right_frame, anchor="nw")

        #right_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        #self.canvas.configure(yscrollcommand=self.scrollbarRF.set)

        # Neuer Frame für die vertikale Zentrierung
        right_content_frame = tk.Frame(right_frame)
        right_content_frame.pack(expand=True)

        # Info und Buttons im rechten Frame
        info_label = tk.Label(right_content_frame, text=str(self.game.getAI().get_name())+": KI Info", font=("Helvetica", 12, "bold"))
        info_label.pack(pady=10)

        # Statistik-Labels
        stats_frame1 = tk.Frame(right_content_frame)
        stats_frame1.pack(pady=2)
        self.won_games_label = tk.Label(stats_frame1, text="Gewonnene Spiele: 0", font=("Helvetica", 10), anchor="w")
        self.won_games_label.grid(row=0, column=0, padx=5, sticky="w")
        self.lost_games_label = tk.Label(stats_frame1, text="Verlorene Spiele: 0", font=("Helvetica", 10), anchor="e")
        self.lost_games_label.grid(row=0, column=1, padx=5, sticky="e")

        stats_frame2 = tk.Frame(right_content_frame)
        stats_frame2.pack(pady=2)
        self.draw_games_label = tk.Label(stats_frame2, text="Unentschieden: 0", font=("Helvetica", 10), anchor="w")
        self.draw_games_label.grid(row=0, column=0, padx=5, sticky="w")
        self.total_games_label = tk.Label(stats_frame2, text="Insgesamt gespielte Spiele: 0", font=("Helvetica", 10),
                                          anchor="e")
        self.total_games_label.grid(row=0, column=1, padx=5, sticky="e")

        # Button zum Ein-/Ausblenden des Regelwerks von Kai
        if isinstance(self.game.getAI(), LearningAI):
            toggle_button = tk.Button(right_content_frame, text="Regelwerk ein-/ausblenden",
                                      command=self.toggle_ai_data_info)
            toggle_button.pack(pady=5)

        # Frame für die AI-Daten-Info-Labels
        self.ai_data_info_frame = tk.Frame(right_content_frame)
        self.ai_data_info_frame.pack(expand=True, fill="both")
        self.reset_text()

        # Schieberegler für delay_time von Ada
        if isinstance(self.game.getAI(), AlgorithmAI):
            initial_delay = self.game.getAI().get_delay()
            delay_time_scale = tk.Scale(right_content_frame, from_=0, to=4, orient=tk.HORIZONTAL, resolution=0.1,
                                        width=10, sliderlength=15, command=lambda val: self.update_delay_time(val, self.game.getAI()))
            delay_time_scale.set(initial_delay)
            delay_time_scale.pack(fill=tk.X, pady=10)

        # Simulationsschritte für Kai
        if isinstance(self.game.getAI(), LearningAI):
            # Simulierter Random-Gegner für Kai
            random_ai = RandomAI("Random")
            # Simulationsmenü
            self.simulation_frame = tk.Frame(right_content_frame)
            self.simulation_frame.pack(pady=0)
            simulation_input = tk.Entry(self.simulation_frame, width=4)
            simulation_input.grid(row=0, column=0, padx=0)
            simulation_label = tk.Label(self.simulation_frame, text="Spiele simulieren")
            simulation_label.grid(row=0, column=1, padx=5)
            simulation_button = tk.Button(self.simulation_frame, text="Los",
                                          command=lambda: self.simulate_rounds(int(simulation_input.get()), random_ai))
            simulation_button.grid(row=0, column=2, padx=5)
            # Schieberegler für delay_time der RandomKI
            initial_delay = random_ai.get_delay()
            delay_time_scale = tk.Scale(right_content_frame, from_=0, to=4, orient=tk.HORIZONTAL, resolution=0.1,
                                        width=10, sliderlength=15, command=lambda val: self.update_delay_time(val, random_ai))
            delay_time_scale.set(initial_delay)
            delay_time_scale.pack(fill=tk.X)

        new_game_button = tk.Button(right_content_frame, text="Neues Spiel", command=self.new_game)
        new_game_button.pack(pady=5)
        new_game_button.bind("<Return>", lambda event: self.new_game())

        menu_button = tk.Button(right_content_frame, text="Zurück zum Menü", command=self.return_to_menu)
        menu_button.pack(pady=5)
        menu_button.bind("<Return>", lambda event: self.return_to_menu())

        right_content_frame.bind("<Configure>", self.on_configure)

        # Zentrieren des gesamten Inhalts im rechten Frame
        right_frame_container.grid_rowconfigure(0, weight=1)
        right_frame_container.grid_columnconfigure(0, weight=1)
        right_frame.pack(expand=True, fill="both")

    def update_statistics(self, winner):
        self.game.update_statistics(winner)
        won_games, lost_games, draw_games, total_games = self.game.get_statistics()
        self.won_games_label.config(text=f"Gewonnene Spiele: {won_games}")
        self.lost_games_label.config(text=f"Verlorene Spiele: {lost_games}")
        self.draw_games_label.config(text=f"Unentschieden: {draw_games}")
        self.total_games_label.config(text=f"Insgesamt gespielte Spiele: {total_games}")

    def simulate_rounds(self, rounds, random_ai):
        try:
            rounds = int(rounds)
        except ValueError:
            messagebox.showerror("Ungültige Eingabe", "Bitte geben Sie eine gültige Zahl ein.")
            return

        def run_simulation():
            player_old = self.game.getPlayer()
            random_ai.swap_to_simulation()
            self.game.setPlayer(random_ai)

            for current_round in range(rounds):
                self.game.new_game()
                while not self.game.getGameover():
                    move = self.game.getPlayer().make_a_move(self.game, self)
                    if move and self.game.changeCell(move[0], move[1], self.game.getPlayer()):
                        self.update_board()
                        self.root.update_idletasks()
                        if self.game.end_of_game():
                            self.game.getAI().add_rule(self.game, self)
                            self.update_statistics(self.game.check_winner())
                            if current_round < rounds - 1:
                                self.new_game()
                            break

                    if not self.game.getGameover():
                        move = self.game.getAI().make_a_move(self.game, self)
                        if move and self.game.changeCell(move[0], move[1], self.game.getAI()):
                            if self.game.end_of_game():
                                self.game.getAI().add_rule(self.game, self)
                                self.update_statistics(self.game.check_winner())
                                if current_round < rounds - 1:
                                    self.new_game()
                                break

            self.reset_text()
            self.game.new_game()
            self.game.setPlayer(player_old)
            self.update_board()
            self.root.update_idletasks()

        simulation_thread = threading.Thread(target=run_simulation)
        simulation_thread.start()
        """
        player_old = self.game.getPlayer()
        random_ai.swap_to_simulation()
        self.game.setPlayer(random_ai)

        for current_round in range(rounds):
            self.game.new_game()
            #self.update_board()
            #self.root.update_idletasks()
            while not self.game.getGameover():
                # Zufälliger Zug für den Spieler
                move = self.game.getPlayer().make_a_move(self.game, self)
                if move and self.game.changeCell(move[0], move[1], self.game.getPlayer()):
                    self.update_board()
                    self.root.update_idletasks()
                    if self.game.end_of_game():
                        self.game.getAI().add_rule(self.game, self)
                        self.update_statistics(self.game.check_winner())
                        #self.root.update_idletasks()
                        #self.canvas.configure(scrollregion=self.canvas.bbox("all"))
                        print(self.game.getBoard())
                        if current_round < rounds - 1:
                            self.new_game()
                        break

                # Zug der LearningAI
                if not self.game.getGameover():
                    move = self.game.getAI().make_a_move(self.game, self)
                    if move and self.game.changeCell(move[0], move[1], self.game.getAI()):
                        #self.update_board()
                        #self.root.update_idletasks()
                        if self.game.end_of_game():
                            self.game.getAI().add_rule(self.game, self)
                            self.update_statistics(self.game.check_winner())
                            #self.root.update_idletasks()
                            #self.canvas.configure(scrollregion=self.canvas.bbox("all"))
                            print(self.game.getBoard())
                            if current_round < rounds - 1:
                                self.new_game()
                            break

        self.reset_text()
        self.game.new_game()
        self.game.setPlayer(player_old)
        self.update_board()
        self.root.update_idletasks()
        """

    def toggle_ai_data_info(self):
        self.ai_data_visible = not self.ai_data_visible
        if self.ai_data_visible:
            self.ai_data_info_frame.pack(expand=True, fill="both", before=self.simulation_frame)
        else:
            self.ai_data_info_frame.pack_forget()
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def on_configure(self, event):
        print("on_configure called")
        self.update_wraplength(event)
        self.configure_scrollbar(event)

    def update_wraplength(self, event):
        if self.ai_data_info_label is not None:
            frame_width = event.width - 40
            self.ai_data_info_label.config(wrap="word")
            self.ai_data_info_label.config(width=frame_width)

    def configure_scrollbar(self, event):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        bbox = self.canvas.bbox("all")
        print(f"Canvas bbox: {bbox}")
        if bbox[3] <= self.root.winfo_height():
            self.canvas.unbind_all("<MouseWheel>")
        else:
            self.canvas.bind_all("<MouseWheel>", self.on_mouse_wheel)
        self.canvas.update_idletasks()

    def on_mouse_wheel(self, event):
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def on_button_click(self, row, col):
        if self.game.changeCell(row, col, self.game.getPlayer()) and not self.game.getGameover():
            self.update_board()
            self.reset_text()
            print("Spieler hat gezogen.")
            if self.game.end_of_game():
                # Falls LearningAI verwendet wird, wird die Regel hinzugefügt
                if isinstance(self.game.getAI(), LearningAI):
                    self.game.getAI().add_rule(self.game, self)
                    self.root.update_idletasks()
                    self.canvas.configure(scrollregion=self.canvas.bbox("all"))
                self.show_winner(self.game.check_winner())
                print("Spiel ist zu Ende.")
            else:
                print("KI sollte nun ziehen:")
                self.ai_move()
                print(self.game.getAllMoves())
                print("KI hat gezogen.")
                print()
                self.update_board()

    def ai_move(self):
        print("ai_move wird ausgeführt.")
        #if isinstance(self.game.getAI(), AlgorithmAI):
        move = self.game.getAI().make_a_move(self.game, self)
        #print("IsInstance True")
        if move:
            print("Move True")
            self.game.changeCell(move[0], move[1], self.game.getAI())
            self.update_board()
            if self.game.end_of_game():
                self.show_winner(self.game.check_winner())
        else:
            print("Move False")
        #else:
            #print("IsInstance False")

    def update_board(self):
        for row in range(3):
            for col in range(3):
                cell = self.game.getBoard()[row][col]
                if cell is not None:
                    self.buttons[row][col].config(text=cell.get_symbol(), bg=cell.get_color())

    def show_winner(self, winner):
        self.update_statistics(winner)
        if isinstance(self.game.getAI(), LearningAI) and winner == self.game.getPlayer():
            tk.messagebox.showinfo("Neue Regel", f"{self.game.getAI().get_name()} hat verloren und lernt eine neue Regel:\n"+str(self.game.getAllMoves()[:-1]))
        elif winner:
            tk.messagebox.showinfo("Game Over", f"{winner.get_name()} gewinnt das Spiel!")
        else:
            tk.messagebox.showinfo("Game Over", "Unentschieden!")

    def highlight_line(self, line, color, bold):
        # Überprüfen, ob die Zeile bereits hervorgehoben ist
        for i, (highlighted_line, _, _) in enumerate(self.highlighted_lines):
            if highlighted_line == line:
                self.highlighted_lines[i] = (line, color, bold)
                break
        else:
            self.highlighted_lines.append((line, color, bold))

        self.update_highlighted_lines()

    def update_highlighted_lines(self):
        lines = self.ai_data_info_text.split('\n')

        for widget in self.ai_data_info_frame.winfo_children():
            widget.destroy()

        for i, text in enumerate(lines):
            label = tk.Label(self.ai_data_info_frame, text=text, font=("Helvetica", 10), anchor="w", justify="left")
            for highlighted_line, color, bold in self.highlighted_lines:
                if i == highlighted_line:
                    if bold:
                        label.config(foreground=color, font=("Helvetica", 10, "bold"))
                    else:
                        label.config(foreground=color, font=("Helvetica", 10))
            label.pack(fill="x")

        self.root.update_idletasks()

    def reset_text(self):
        self.highlighted_lines = []
        self.ai_data_info_text = self.game.getAI().get_text()
        lines = self.ai_data_info_text.split('\n')

        for widget in self.ai_data_info_frame.winfo_children():
            widget.destroy()

        for text in lines:
            label = tk.Label(self.ai_data_info_frame, text=text, font=("Helvetica", 10), anchor="w", justify="left")
            label.pack(fill="x")

        self.root.update_idletasks()
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def update_delay_time(self, value, ai_modell):
        ai_modell.set_delay(float(value))

    def new_game(self):
        self.game.new_game()
        self.reset_text()
        for row in range(3):
            for col in range(3):
                self.buttons[row][col].config(text="", bg="#f2d3aa")

    def return_to_menu(self):
        self.root.destroy()
        from MenuGUI import MenuGUI
        MenuGUI().show_menu()

