"""
Panel widgets for the Professional TUI.
Provides the main panel and side panel for the application.
"""

from textual.app import ComposeResult
from textual.containers import Container, Vertical, Horizontal
from textual.widgets import Static, Tree, Label, Button, Input
from textual.widgets._tree import TreeNode
from textual.reactive import reactive
from textual import events, on

from professional_tui.ui.colors import THEME_COLORS

class SidePanel(Vertical):
    """
    A side panel for navigation and tools.
    """
    
    def __init__(self, *args, **kwargs):
        """Initialize the side panel."""
        super().__init__(*args, **kwargs)
        self.add_class("side-panel")
    
    def compose(self) -> ComposeResult:
        """Compose the side panel."""
        # Panel title
        yield Static("Navigation", classes="panel-title")
        
        # File tree
        yield Tree("Project", id="file-tree")
        
        # Quick actions
        yield Static("Quick Actions", classes="panel-title")
        with Container(classes="quick-actions"):
            yield Button("New File", id="new-file-btn", classes="action-btn")
            yield Button("Open File", id="open-file-btn", classes="action-btn")
            yield Button("Save", id="save-btn", classes="action-btn")
            yield Button("Run", id="run-btn", classes="action-btn")
        
        # Task list
        yield Static("Tasks", classes="panel-title")
        with Container(id="task-list", classes="task-list"):
            yield Static("No tasks yet", classes="empty-message")
    
    def on_mount(self) -> None:
        """Called when the widget is mounted."""
        # Populate the file tree with some example items
        tree = self.query_one("#file-tree", Tree)
        
        # Add some example nodes
        docs = tree.root.add("Documents", expand=True)
        docs.add_leaf("Report.md")
        docs.add_leaf("Notes.txt")
        
        src = tree.root.add("Source", expand=True)
        src.add_leaf("main.py")
        src.add_leaf("utils.py")
        
        data = tree.root.add("Data")
        data.add_leaf("config.json")
        data.add_leaf("data.csv")
    
    def on_tree_node_selected(self, event) -> None:
        """Handle tree node selection."""
        # Update the status bar with the selected node
        node = event.node
        self.app.query_one("#status-file").update(f"Selected: {node.label}")
        
        # Check if it's a leaf node by checking for children
        if not node.children:
            self.app.query_one("#main-panel").load_file(node.label)

class MainPanel(Container):
    """
    The main content panel.
    """
    
    content_type = reactive("welcome")
    current_file = reactive(None)
    
    def __init__(self, *args, **kwargs):
        """Initialize the main panel."""
        super().__init__(*args, **kwargs)
        self.add_class("main-panel")

    def on_key(self, event: events.Key) -> None:
        """Handle key events."""
        if event.key == "f3":
            self.show_command_palette()

    @on(Button.Pressed, "#new-file-btn")
    def handle_new_file(self) -> None:
        """Handle new file button click."""
        self.show_screen("editor")
        self.query_one("#editor-title").update("Untitled")
        self.query_one("#editor-content").value = ""
        self.current_file = None

    @on(Button.Pressed, "#open-file-btn") 
    def handle_open_file(self) -> None:
        """Handle open file button click."""
        # This would normally show a file dialog
        # For demo, just switch to editor with placeholder
        self.show_screen("editor")
        self.query_one("#editor-title").update("Open File")
        self.query_one("#editor-content").value = "Select a file from the sidebar to open it."

    @on(Button.Pressed, "#save-btn")
    def handle_save(self) -> None:
        """Handle save button click."""
        if self.content_type != "editor":
            return
            
        content = self.query_one("#editor-content").value
        filename = self.current_file or "Untitled"
        # This would normally save the file
        # For demo, just show a message
        self.query_one("#editor-title").update(f"Saved: {filename}")

    @on(Button.Pressed, "#run-btn")
    def handle_run(self) -> None:
        """Handle run button click."""
        if self.content_type != "editor":
            return
            
        content = self.query_one("#editor-content").value
        # This would normally run the code
        # For demo, just show a message
        self.show_screen("editor")
        self.query_one("#editor-title").update("Running...")
        self.query_one("#editor-content").value = "Program output would appear here..."

    def show_command_palette(self) -> None:
        """Show the command palette."""
        # This would normally show a command palette overlay
        # For now just show a message in the editor
        self.show_screen("editor")
        self.query_one("#editor-title").update("Command Palette")
        self.query_one("#editor-content").value = "Command palette would appear here..."

    def compose(self) -> ComposeResult:
        """Compose the main panel."""
        # Welcome screen (initial content)
        with Container(id="welcome-screen", classes="content-screen"):
            yield Static("# Welcome to Professional TUI", classes="welcome-title")
            yield Static("""
            A feature-rich terminal user interface with professional styling and interactive components.
            
            ## Getting Started
            
            - Use the menu bar at the top to access various features
            - The sidebar on the left provides navigation and quick actions
            - Press F1 for help or F3 to open the command palette
            
            ## Features
            
            - Professional dark theme
            - Full menu system
            - Interactive components
            - Keyboard navigation
            - And much more!
            """, classes="welcome-text")
        
        # Text editor (initially hidden)
        with Container(id="editor-screen", classes="content-screen hidden"):
            yield Static("", id="editor-title", classes="editor-title")
            yield Input("", id="editor-content", classes="editor-content")
        
        # Dashboard (initially hidden)
        with Container(id="dashboard-screen", classes="content-screen hidden"):
            yield Static("Dashboard", classes="panel-title")
            
            # Dashboard widgets
            with Horizontal(classes="dashboard-row"):
                with Container(classes="dashboard-widget"):
                    yield Static("Statistics", classes="widget-title")
                    yield Static("No data available", classes="widget-content")
                
                with Container(classes="dashboard-widget"):
                    yield Static("Recent Files", classes="widget-title")
                    yield Static("No recent files", classes="widget-content")
            
            with Horizontal(classes="dashboard-row"):
                with Container(classes="dashboard-widget"):
                    yield Static("Tasks", classes="widget-title")
                    yield Static("No tasks available", classes="widget-content")
                
                with Container(classes="dashboard-widget"):
                    yield Static("System Info", classes="widget-title")
                    yield Static("System information will be displayed here", classes="widget-content")
    
    def on_mount(self) -> None:
        """Called when the widget is mounted."""
        # Show the welcome screen initially
        self.show_screen("welcome")
    
    def show_screen(self, screen_type: str) -> None:
        """
        Show a specific content screen.
        
        Args:
            screen_type: The type of screen to show (welcome, editor, dashboard).
        """
        self.content_type = screen_type
        
        # Hide all screens
        for screen in self.query(".content-screen"):
            screen.add_class("hidden")
        
        # Show the requested screen
        screen = self.query_one(f"#{screen_type}-screen")
        screen.remove_class("hidden")
        
        # Update the status bar
        self.app.query_one("#status-mode").update(f"Mode: {screen_type.capitalize()}")
    
    def load_file(self, filename: str) -> None:
        """
        Load a file into the editor.
        
        Args:
            filename: The name of the file to load.
        """
        self.current_file = filename
        
        # Show the editor screen
        self.show_screen("editor")
        
        # Update the editor title
        self.query_one("#editor-title").update(f"Editing: {filename}")
        
        # Simulate loading file content
        content = f"This is the simulated content of {filename}.\n\nEdit me!"
        self.query_one("#editor-content").value = content
        
        # Update the status bar
        self.app.query_one("#status-file").update(f"File: {filename}")
    
    def watch_content_type(self, content_type: str) -> None:
        """
        Watch for changes to the content type.
        
        Args:
            content_type: The new content type.
        """
        # Update the status bar
        self.app.query_one("#status-mode").update(f"Mode: {content_type.capitalize()}")
