"""
Status bar implementation for the Professional TUI.
"""
from textual.app import ComposeResult
from textual.containers import Horizontal
from textual.widgets import Static
from textual.reactive import reactive

class StatusBar(Horizontal):
    """Status bar widget that shows application state."""

    DEFAULT_CSS = """
    StatusBar {
        width: 100%;
        height: 1;
        dock: bottom;
        background: $accent;
        color: $text;
        border-top: solid $primary;
    }

    .status-item {
        padding: 0 1;
        color: $text;
    }

    #status-mode {
        background: $secondary;
        min-width: 16;
    }

    #status-file {
        padding-left: 1;
        width: 60%;
    }

    #status-info {
        width: 30%;
        text-align: right;
    }
    """

    text = reactive("Ready")
    mode = reactive("welcome")
    file = reactive("No file")
    
    def compose(self) -> ComposeResult:
        """Compose the status bar."""
        yield Static("Welcome", id="status-mode", classes="status-item")
        yield Static("No file", id="status-file", classes="status-item")
        yield Static(self.text, id="status-info", classes="status-item")
    
    def update(self, text: str) -> None:
        """Update the status text."""
        self.text = text
        self.query_one("#status-info").update(text)
    
    def watch_mode(self, mode: str) -> None:
        """Watch for mode changes."""
        self.query_one("#status-mode").update(f"Mode: {mode.capitalize()}")
    
    def watch_file(self, file: str) -> None:
        """Watch for file changes."""
        self.query_one("#status-file").update(f"File: {file}")
