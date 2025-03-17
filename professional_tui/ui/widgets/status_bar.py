"""
Status bar widget for the Professional TUI.
Shows application status, git info, and current file.
"""

from textual.containers import Horizontal
from textual.widgets import Static
from textual.reactive import reactive
from textual.app import ComposeResult
from professional_tui.utils.git import GitUtils, GitStatus

class StatusBar(Horizontal):
    """Status bar widget showing application status and git info."""
    
    DEFAULT_CSS = """
    StatusBar {
        dock: bottom;
        height: 1;
        background: $boost;
        color: $text;
    }
    
    StatusBar > Static {
        padding: 0 1;
    }
    
    StatusBar #git-status {
        width: auto;
        color: $success;
    }
    
    StatusBar #git-status.modified {
        color: $warning;
    }
    
    StatusBar #git-status.untracked {
        color: $error;
    }
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.git_utils = GitUtils()
        self._status = ""
        self._git_status = GitStatus()
    
    def compose(self) -> ComposeResult:
        """Compose the status bar."""
        yield Static(id="status-mode")
        yield Static(id="git-status")
        yield Static(id="status-file")
    
    def on_mount(self) -> None:
        """Handle mount event."""
        self.update_git_status()
        self.set_interval(5.0, self.update_git_status)
    
    def update(self, status: str) -> None:
        """Update the status text."""
        self._status = status
        self.query_one("#status-mode", Static).update(status)
    
    def update_git_status(self) -> None:
        """Update git status information."""
        status = self.git_utils.get_status()
        git_widget = self.query_one("#git-status", Static)
        
        if not status.branch:
            git_widget.update("")
            return
        
        # Build status text
        text = f"[{status.branch}]"
        if status.ahead:
            text += f" ↑{status.ahead}"
        if status.behind:
            text += f" ↓{status.behind}"
        
        # Add file counts
        counts = []
        if status.staged:
            counts.append(f"+{len(status.staged)}")
        if status.modified:
            counts.append(f"~{len(status.modified)}")
        if status.untracked:
            counts.append(f"?{len(status.untracked)}")
        
        if counts:
            text += " " + " ".join(counts)
        
        # Update widget and class
        git_widget.update(text)
        
        if status.untracked:
            git_widget.set_class(True, "untracked")
            git_widget.set_class(False, "modified")
        elif status.modified or status.staged:
            git_widget.set_class(True, "modified")
            git_widget.set_class(False, "untracked")
        else:
            git_widget.set_class(False, "modified")
            git_widget.set_class(False, "untracked")
    
    def update_file(self, filename: str) -> None:
        """Update the current file display."""
        self.query_one("#status-file", Static).update(f"File: {filename}")
