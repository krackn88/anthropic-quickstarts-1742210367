"""
Search widget for the Professional TUI.
Provides file search functionality.
"""

import os
from typing import List
from textual.widgets import Static, Tree, TextArea
from textual.containers import Container, Vertical
from textual.reactive import reactive
from textual.binding import Binding
from textual.events import Key
from textual.widgets._tree import TreeNode
from textual.app import ComposeResult
from textual.message import Message
from textual.coordinate import Coordinate
from textual.events import Click
from textual.widget import Widget
from professional_tui.ui.widgets.panels import MainPanel

class SearchResult:
    """Represents a search result."""
    def __init__(self, path: str, line: int, content: str):
        self.path = path
        self.line = line
        self.content = content.strip()

class SearchWidget(Container):
    """A widget for searching files."""
    
    BINDINGS = [
        Binding("escape", "close", "Close", show=False),
        Binding("enter", "search", "Search", show=False),
    ]
    
    DEFAULT_CSS = """
    SearchWidget {
        width: 100%;
        height: 100%;
        background: $surface;
        border: tall $primary;
        padding: 1;
    }
    
    SearchWidget Input {
        margin: 1;
        width: 100%;
    }
    
    SearchWidget Tree {
        margin: 1;
        height: 1fr;
    }
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._query = ""
        self._results: List[SearchResult] = []
    
    def compose(self) -> ComposeResult:
        """Compose the search widget."""
        with Vertical():
            yield Static("Search files...", id="search-input")
            yield Static("", id="search-status")
            yield Tree("Results", id="search-results")
    
    def on_mount(self) -> None:
        """Handle mount event."""
        self.query_one("#search-input").focus()
    
    def on_key(self, event: Key) -> None:
        """Handle key events."""
        if event.key == "enter":
            self.action_search()
        elif event.key == "escape":
            self.action_close()
        else:
            # Update search query
            if event.character and event.character.isprintable():
                self._query += event.character
                if len(self._query) >= 2:
                    self.action_search()
            elif event.key == "backspace" and self._query:
                self._query = self._query[:-1]
                if len(self._query) >= 2:
                    self.action_search()
    
    def action_close(self) -> None:
        """Close the search widget."""
        self.remove()
    
    def action_search(self) -> None:
        """Perform the search."""
        if not self._query:
            return
            
        self._results = []
        status = self.query_one("#search-status", Static)
        results_tree = self.query_one("#search-results", Tree)
        results_tree.clear()
        
        try:
            for root, _, files in os.walk("."):
                for file in files:
                    if file.startswith("."):
                        continue
                        
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            for i, line in enumerate(f, 1):
                                if self._query.lower() in line.lower():
                                    result = SearchResult(filepath, i, line)
                                    self._results.append(result)
                    except UnicodeDecodeError:
                        continue
            
            # Update results tree
            if self._results:
                for result in self._results:
                    node = results_tree.root.add(
                        f"{result.path}:{result.line}",
                        expand=True
                    )
                    node.add_leaf(result.content)
                status.update(f"Found {len(self._results)} results")
            else:
                status.update("No results found")
                
        except Exception as e:
            status.update(f"Error: {str(e)}")
    
    def on_tree_node_highlighted(self, event: Message) -> None:
        """Handle result selection."""
        tree = self.query_one("#search-results", Tree)
        if tree and tree.cursor_node:
            node = tree.cursor_node
            if node and node.parent:  # Check if it's a leaf node
                # Get file path and line number from parent node
                parent = node.parent
                if parent and parent.label:
                    try:
                        path, line = str(parent.label).split(":")
                        line_num = int(line)
                        
                        # Open the file in the editor
                        main_panel = self.app.query_one("#main-panel", MainPanel)
                        self.call_later(main_panel.load_file, path)
                        
                        # Scroll to the line
                        editor = main_panel.query_one("#editor-content", TextArea)
                        if editor:
                            # Move cursor to the line
                            editor.move_cursor(Coordinate(line_num - 1, 0))
                            editor.focus()
                    except (ValueError, AttributeError):
                        pass
