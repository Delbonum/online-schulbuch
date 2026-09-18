import tkinter as tk

class MenuGUI:
    def __init__(self):
        self.menu_root = tk.Tk()
        self.menu_root.title("Tic Tac Toe gegen die KI - Menü")
        self.screen_width = self.menu_root.winfo_screenwidth()
        self.screen_height = self.menu_root.winfo_screenheight()
        self.window_width = int(self.screen_width * 0.4)
        self.window_height = int(self.screen_height * 0.4)
        self.menu_root.geometry(f"{self.window_width}x{self.window_height}")

    def start_game(self, player_name, ai_name):
        from TicTacToeGUI import TicTacToeGUI
        root = tk.Tk()
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        window_width = int(screen_width * 0.6)
        window_height = int(screen_height * 0.6)
        root.geometry(f"{window_width}x{window_height}")
        app = TicTacToeGUI(root, player_name, ai_name)
        root.focus_force()
        root.mainloop()

    def show_menu(self):
        canvas = tk.Canvas(self.menu_root)
        scrollbar = tk.Scrollbar(self.menu_root, orient="vertical", command=canvas.yview)
        frame = tk.Frame(canvas)

        def configure_scrollbar(event):
            canvas.configure(scrollregion=canvas.bbox("all"))
            if canvas.bbox("all")[3] <= self.menu_root.winfo_height():
                scrollbar.pack_forget()
                canvas.unbind_all("<MouseWheel>")
            else:
                scrollbar.pack(side="right", fill="y")
                canvas.bind_all("<MouseWheel>", on_mouse_wheel)
            canvas.update_idletasks()

        def configure_canvas(event):
            canvas.itemconfig(frame_window, width=canvas.winfo_width())
            new_width = min(canvas.winfo_width(), 1000)
            explanation_label.config(wraplength=new_width - 60)
            canvas.update_idletasks()

        def on_configure(event):
            configure_canvas(event)
            configure_scrollbar(event)

        def on_mouse_wheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

        def adjust_window_height():
            self.menu_root.update_idletasks()
            window_height = frame.winfo_height() + 10
            self.menu_root.geometry(f"{self.window_width}x{window_height}")

        frame.bind("<Configure>", on_configure)
        self.menu_root.bind("<Configure>", on_configure)
        canvas.bind_all("<MouseWheel>", on_mouse_wheel)

        frame_window = canvas.create_window((0, 0), window=frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)

        tk.Label(frame, text="KI verstehen mit Tic Tac Toe", font=("Helvetica", 12, "bold")).pack(anchor=tk.CENTER, pady=10)

        # Erklärungstext
        explanation_text = ("Dieses Tool soll Ihnen anhand des Spiels Tic Tac Toe die Funktionsweise verschiedener KI-Systeme näherbringen. "
                            "Sie haben die Wahl zwischen zwei verschiedenen KI-Modellen: Ada und Kai.\n\n"
                            "Während Ada nach einem systematischen Ansatz vorgeht, lernt Kai aus seinen Fehlern:\n"
                            "Adas Algorithmus verhindert, dass sie ein Spiel verliert. "
                            "Kai hingegen geht zunächst zufällig vor und merkt sich die Konsequenzen seiner Züge.\n\n"
                            "Bitte geben Sie Ihren Spielernamen ein und wählen Sie einen KI-Gegner aus. "
                            "Klicken Sie anschließend auf 'Start', um das Spiel zu beginnen.")
        explanation_label = tk.Label(frame, text=explanation_text, wraplength=self.window_width - 60, justify=tk.LEFT)
        explanation_label.pack(anchor=tk.CENTER, padx=30, pady=5)

        # Spielername
        player_frame = tk.Frame(frame)
        player_frame.pack(anchor=tk.CENTER, pady=5)
        tk.Label(player_frame, text="Spielername: ").grid(row=0, column=0)
        player_name_entry = tk.Entry(player_frame)
        player_name_entry.grid(row=0, column=1)

        # KI-Auswahl
        ai_choice = tk.StringVar(value="Ada")
        ai_choice_frame = tk.Frame(frame)
        ai_choice_frame.pack(anchor=tk.CENTER, pady=5)
        tk.Label(ai_choice_frame, text="Wähle den KI-Gegner:").grid(row=0, column=0)
        ai_choice_ada = tk.Radiobutton(ai_choice_frame, text="Ada", variable=ai_choice, value="Ada")
        ai_choice_ada.grid(row=0, column=1)
        ai_choice_kai = tk.Radiobutton(ai_choice_frame, text="Kai", variable=ai_choice, value="Kai")
        ai_choice_kai.grid(row=0, column=2)

        def on_start():
            player_name = player_name_entry.get()
            ai_name = ai_choice.get()
            self.menu_root.destroy()
            self.start_game(player_name, ai_name)

        start_button = tk.Button(frame, text="Start", command=on_start)
        start_button.pack(anchor=tk.CENTER, pady=5)

        # Tastatursteuerung
        player_name_entry.bind("<Return>", lambda event: on_start())
        start_button.bind("<Return>", lambda event: on_start())
        ai_choice_ada.bind("<Return>", lambda event: ai_choice.set("Ada"))
        ai_choice_kai.bind("<Return>", lambda event: ai_choice.set("Kai"))

        self.menu_root.after(1, adjust_window_height)
        self.menu_root.focus_force()
        self.menu_root.mainloop()

