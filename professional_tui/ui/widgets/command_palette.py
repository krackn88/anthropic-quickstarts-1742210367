"""
Command palette implementation for quick access to actions.
"""
from textual.app import ComposeResult
from textual.containers import Vertical
from textual.widgets import Static, Input
from textual.widget import Widget
from textual import events, on
from dataclasses import dataclass
from typing import Callable, List, Optional

@dataclass
class Command:
    """A command that can be executed from the command palette."""
    name: str
    description: str
    action: str
    shortcut: str = ""

class CommandPalette(Widget):
    """A command palette for quick access to actions."""
    
    DEFAULT_CSS = """
    CommandPalette {
        width: 60%;
        height: auto;
        background: $panel;
        border: wide $primary;
        padding: 1;
        margin: 1 0;
    }
    
    .command-input {
        margin-bottom: 1;
    }
    
    .command-list {
        height: auto;
        max-height: 20;
    }
    
    .command-item {
        padding: 1;
    }
    
    .command-item:hover {
        background: $accent;
    }
    
    .command-item.selected {
        background: $secondary;
    }
    """
    
    def __init__(self, *args, **kwargs):
        """Initialize the command palette."""
        super().__init__(*args, **kwargs)
        self.commands = [
            Command("New File", "Create a new file", "new", "Ctrl+N"),
            Command("Open File", "Open an existing file", "open", "Ctrl+O"),
            Command("Save File", "Save the current file", "save", "Ctrl+S"),
            Command("Toggle Sidebar", "Show/hide the sidebar", "toggle_sidebar", "F2"),
            Command("Toggle Help", "Show/hide help", "toggle_help", "F1"),
            Command("About", "Show about dialog", "show_about"),
            Command("Quit", "Exit the application", "quit", "Q"),
        ]
        self.filtered_commands = self.commands
        self.selected_index = 0
    
    def compose(self) -> ComposeResult:
        """Compose the command palette."""
        with Vertical():
            yield Input(placeholder="Type a command...", classes="command-input")
            with Vertical(classes="command-list"):
                for command in self.commands:
                    yield Static(
                        f"{command.name} ({command.shortcut})" if command.shortcut else command.name,
                        classes="command-item"
                    )
    
    @on(Input.Changed)
    def filter_commands(self, event: Input.Changed) -> None:
        """Filter commands based on input."""
        query = event.value.lower()
        self.filtered_commands = [
            cmd for cmd in self.commands
            if query in cmd.name.lower() or query in cmd.description.lower()
        ]
        self.selected_index = 0
        self.refresh_commands()
    
    def refresh_commands(self) -> None:
        """Refresh the command list."""
        command_list = self.query_one(".command-list")
        command_list.remove_children()
        for i, command in enumerate(self.filtered_commands):
            item = Static(
                f"{command.name} ({command.shortcut})" if command.shortcut else command.name,
                classes=f"command-item{' selected' if i == self.selected_index else ''}"
            )
            command_list.mount(item)
    
    def on_key(self, event: events.Key) -> None:
        """Handle keyboard navigation."""
        if event.key == "escape":
            self.dismiss()
        elif event.key == "up":
            self.selected_index = max(0, self.selected_index - 1)
            self.refresh_commands()
        elif event.key == "down":
            self.selected_index = min(len(self.filtered_commands) - 1, self.selected_index + 1)
            self.refresh_commands()
        elif event.key == "enter" and self.filtered_commands:
            self.execute_selected()
    
    def execute_selected(self) -> None:
        """Execute the selected command."""
        if not self.filtered_commands:
            return
        
        command = self.filtered_commands[self.selected_index]
        if hasattr(self.app, f"action_{command.action}"):
            getattr(self.app, f"action_{command.action}")()
        self.dismiss()
    
    def dismiss(self) -> None:
        """Dismiss the command palette."""
        self.remove()