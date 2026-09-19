class BaseAI:
    def __init__(self, name):
        self.name = name
        self.symbol = "O"
        self.color = "#f58787"
        self.delay_time = 0.6
        self.green = "#458726"
        self.red = "#bd2211"

    def get_name(self):
        return self.name

    def get_symbol(self):
        return self.symbol

    def get_color(self):
        return self.color

    def get_delay(self):
        return self.delay_time

    def set_delay(self, delay):
        self.delay_time = delay

    def get_text(self):
        raise NotImplementedError("This method should be overridden by subclasses")

    def make_a_move(self, game, gui):
        raise NotImplementedError("This method should be overridden by subclasses")