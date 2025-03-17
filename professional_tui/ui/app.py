"""
Main application class for the Professional TUI.
Defines the core application structure and behavior.
"""

from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import Header, Footer, Static, Input, Button
from textual.reactive import reactive
from textual import events

from professional_tui.ui.colors import THEME_COLORS
from professional_tui.ui.menu import MenuBar
from professional_tui.ui.widgets.status_bar import StatusBar
from professional_tui.ui.widgets.panels import MainPanel, SidePanel
from professional_tui.ui.widgets.dialogs import AboutDialog, ConfirmDialog
from professional_tui.ui.widgets.command_palette import CommandPalette

class ProfessionalTUI(App):
    """
    Main application class for the Professional TUI.
    Provides the core application structure and functionality.
    """
    
    # Application title displayed in the header
    TITLE = "Professional TUI"
    
    # Application subtitle displayed in the header
    SUB_TITLE = "A feature-rich terminal interface"
    
    # CSS file for styling the application
    CSS_PATH = "styles.css"
    
    # Current application state
    current_view = reactive("main")
    
    # Keyboard bindings for the application
    BINDINGS = [
        Binding("q", "quit", "Quit", key_display="Q"),
        Binding("f1", "toggle_help", "Help", key_display="F1"),
        Binding("f2", "toggle_sidebar", "Sidebar", key_display="F2"),
        Binding("f3", "command_palette", "Commands", key_display="F3"),
        Binding("ctrl+s", "save", "Save", key_display="Ctrl+S"),
        Binding("ctrl+o", "open", "Open", key_display="Ctrl+O"),
        Binding("ctrl+n", "new", "New", key_display="Ctrl+N"),
    ]
    
    def __init__(self, *args, **kwargs):
        """Initialize the application."""
        super().__init__(*args, **kwargs)
        self.sidebar_visible = True
        self.dark_mode = True
        self.current_file = None
    
    def compose(self) -> ComposeResult:
        """
        Compose the application layout.
        Returns the widgets that make up the application.
        """
        # Create the application layout
        yield Header()
        yield MenuBar()
        
        # Main content area with sidebar and main panel
        with Container(id="app-grid"):
            with Horizontal():
                yield SidePanel(id="sidebar")
                yield MainPanel(id="main-panel")
        
        # Status bar at the bottom
        yield StatusBar()
        yield Footer()
    
    def on_mount(self) -> None:
        """
        Called when the application is mounted.
        Initialize the application state.
        """
        # Set the application title
        self.title = self.TITLE
        self.sub_title = self.SUB_TITLE
        
        # Set the initial status
        self.query_one(StatusBar).update("Ready")
        
        # Focus the main panel
        self.query_one("#main-panel").focus()

    def action_toggle_dark_mode(self) -> None:
        """Toggle between light and dark mode."""
        self.dark_mode = not self.dark_mode
        self.set_theme("dark" if self.dark_mode else "light")
        self.query_one(StatusBar).update("Theme: " + ("Dark" if self.dark_mode else "Light"))
    
    def action_toggle_sidebar(self) -> None:
        """Toggle the sidebar visibility."""
        sidebar = self.query_one("#sidebar")
        self.sidebar_visible = not self.sidebar_visible
        
        if self.sidebar_visible:
            sidebar.remove_class("hidden")
            self.query_one(StatusBar).update("Sidebar shown")
        else:
            sidebar.add_class("hidden")
            self.query_one(StatusBar).update("Sidebar hidden")
    
    def action_toggle_help(self) -> None:
        """Show the help dialog."""
        help_text = """
        # Keyboard Shortcuts

        - F1: Toggle Help
        - F2: Toggle Sidebar
        - F3: Command Palette
        - Ctrl+N: New File
        - Ctrl+O: Open File
        - Ctrl+S: Save File
        - Q: Quit

        # Navigation

        - Use arrow keys to navigate
        - Enter to select
        - Escape to cancel/close

        # Tips

        - The sidebar shows your file tree and quick actions
        - Use the command palette (F3) for quick access to all features
        - The status bar shows current file and mode information
        """
        dialog = AboutDialog("Help", help_text)
        self.mount(dialog)
    
    def action_command_palette(self) -> None:
        """Show the command palette."""
        self.query_one(StatusBar).update("Command palette opened")
        palette = CommandPalette()
        self.mount(palette)
    
    def action_save(self) -> None:
        """Save the current file."""
        main_panel = self.query_one("#main-panel")
        if main_panel.content_type == "editor" and main_panel.current_file:
            self.query_one(StatusBar).update(f"Saving {main_panel.current_file}...")
            main_panel.handle_save()
        else:
            self.query_one(StatusBar).update("No file to save")
    
    def action_open(self) -> None:
        """Open a file."""
        self.query_one(StatusBar).update("Opening file...")
        self.query_one("#main-panel").handle_open_file()
    
    def action_new(self) -> None:
        """Create a new file."""
        self.query_one(StatusBar).update("Creating new file...")
        self.query_one("#main-panel").handle_new_file()
    
    def action_cut(self) -> None:
        """Cut selected text."""
        self.query_one(StatusBar).update("Cut")
    
    def action_copy(self) -> None:
        """Copy selected text."""
        self.query_one(StatusBar).update("Copy")
    
    def action_paste(self) -> None:
        """Paste text."""
        self.query_one(StatusBar).update("Paste")
    
    def action_quit(self) -> None:
        """Quit the application with confirmation."""
        def on_confirm(confirmed: bool) -> None:
            if confirmed:
                self.exit()
        
        dialog = ConfirmDialog(
            "Quit Application",
            "Are you sure you want to quit? Any unsaved changes will be lost.",
            on_confirm
        )
        self.mount(dialog)
    
    def show_about(self) -> None:
        """Show the about dialog."""
        about_text = """
        # Professional TUI

        A feature-rich terminal user interface with professional styling and interactive components.
        
        Version: 1.0.0
        
        ## Features
        
        - Professional dark theme
        - Full menu system
        - Interactive components
        - Keyboard navigation
        - And much more!
        """
        
        dialog = AboutDialog("About Professional TUI", about_text)
        self.mount(dialog)
