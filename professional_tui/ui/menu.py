"""
Menu implementation for the Professional TUI.
"""
from textual.app import ComposeResult
from textual.containers import Horizontal
from textual.widgets import Static
from textual.reactive import reactive
from textual import events, on
from typing import Optional, List, Dict

class MenuItem(Static):
    """A menu item in a dropdown menu."""
    
    def __init__(self, label: str, action: str, shortcut: str = "", *args, **kwargs):
        """Initialize a menu item."""
        super().__init__(*args, **kwargs)
        self.label = label
        self.action = action
        self.shortcut = shortcut
    
    def compose(self) -> ComposeResult:
        """Compose the menu item."""
        yield Static(f"{self.label} {self.shortcut}")
    
    def on_click(self) -> None:
        """Handle click events."""
        # Dispatch the action to the app
        if hasattr(self.app, f"action_{self.action}"):
            getattr(self.app, f"action_{self.action}")()
        # Close the menu
        self.parent.close_menu()

class MenuDropdown(Static):
    """A dropdown menu containing menu items."""
    
    def __init__(self, items: List[Dict], *args, **kwargs):
        """Initialize a dropdown menu."""
        super().__init__(*args, **kwargs)
        self.items = items
    
    def compose(self) -> ComposeResult:
        """Compose the dropdown menu."""
        for item in self.items:
            yield MenuItem(
                label=item["label"],
                action=item["action"],
                shortcut=item.get("shortcut", ""),
                classes="menu-item"
            )

class MenuButton(Static):
    """A button in the menu bar that opens a dropdown menu."""
    is_open = reactive(False)

    def __init__(self, label: str, items: List[Dict], *args, **kwargs):
        """Initialize a menu button."""
        super().__init__(*args, **kwargs)
        self.label = label
        self.menu_items = items
    
    def compose(self) -> ComposeResult:
        """Compose the menu button."""
        yield Static(self.label, classes="menu-button-label")
        dropdown = MenuDropdown(self.menu_items, classes="menu-dropdown hidden")
        yield dropdown
    
    def on_click(self) -> None:
        """Handle click events."""
        self.toggle_menu()
    
    def toggle_menu(self) -> None:
        """Toggle the dropdown menu."""
        dropdown = self.query_one(".menu-dropdown")
        if self.is_open:
            dropdown.add_class("hidden")
        else:
            # Close other menus first
            if self.parent:
                for menu in self.parent.query(MenuButton):
                    if menu is not self and menu.is_open:
                        menu.close_menu()
            dropdown.remove_class("hidden")
        self.is_open = not self.is_open
    
    def close_menu(self) -> None:
        """Close the dropdown menu."""
        if self.is_open:
            self.toggle_menu()

class MenuBar(Horizontal):
    """The main menu bar containing menu buttons."""
    
    def compose(self) -> ComposeResult:
        """Compose the menu bar."""
        yield MenuButton(
            "File",
            [
                {"label": "New", "action": "new", "shortcut": "Ctrl+N"},
                {"label": "Open", "action": "open", "shortcut": "Ctrl+O"},
                {"label": "Save", "action": "save", "shortcut": "Ctrl+S"},
                {"label": "Exit", "action": "quit", "shortcut": "Q"},
            ],
            classes="menu-button"
        )
        
        yield MenuButton(
            "Edit",
            [
                {"label": "Cut", "action": "cut", "shortcut": "Ctrl+X"},
                {"label": "Copy", "action": "copy", "shortcut": "Ctrl+C"},
                {"label": "Paste", "action": "paste", "shortcut": "Ctrl+V"},
            ],
            classes="menu-button"
        )
        
        yield MenuButton(
            "View",
            [
                {"label": "Toggle Sidebar", "action": "toggle_sidebar", "shortcut": "F2"},
                {"label": "Toggle Dark Mode", "action": "toggle_dark_mode"},
                {"label": "Command Palette", "action": "command_palette", "shortcut": "F3"},
            ],
            classes="menu-button"
        )
        
        yield MenuButton(
            "Help",
            [
                {"label": "Documentation", "action": "toggle_help", "shortcut": "F1"},
                {"label": "About", "action": "show_about"},
            ],
            classes="menu-button"
        )
    
    def on_click_outside(self) -> None:
        """Handle click outside events."""
        for menu in self.query(MenuButton):
            if menu.is_open:
                menu.close_menu()
