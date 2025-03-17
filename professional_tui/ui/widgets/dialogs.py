"""
Dialog widgets for the Professional TUI.
Provides dialog boxes for various interactions.
"""

from typing import Callable, Optional, Any
from textual.app import ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import Static, Button, Label
from textual.reactive import reactive
from textual import events, on

from professional_tui.ui.colors import THEME_COLORS

class Dialog(Container):
    """
    Base dialog class for modal dialogs.
    """
    
    def __init__(self, title: str, *args, **kwargs):
        """
        Initialize a dialog.
        
        Args:
            title: The title of the dialog.
        """
        super().__init__(*args, **kwargs)
        self.title = title
        self.add_class("dialog")
    
    def compose(self) -> ComposeResult:
        """Compose the dialog."""
        # Dialog overlay (background)
        yield Static("", classes="dialog-overlay")
        
        # Dialog container
        with Container(classes="dialog-container"):
            # Dialog header
            with Container(classes="dialog-header"):
                yield Static(self.title, classes="dialog-title")
                yield Button("×", id="close-dialog-btn", classes="close-btn")
            
            # Dialog content (to be implemented by subclasses)
            with Container(classes="dialog-content"):
                yield from self.compose_content()
            
            # Dialog footer
            with Horizontal(classes="dialog-footer"):
                yield from self.compose_footer()
    
    def compose_content(self) -> ComposeResult:
        """
        Compose the dialog content.
        To be implemented by subclasses.
        """
        yield Static("Dialog content")
    
    def compose_footer(self) -> ComposeResult:
        """
        Compose the dialog footer.
        To be implemented by subclasses.
        """
        yield Button("Close", id="dialog-close-btn", classes="btn")
    
    def on_button_pressed(self, event) -> None:
        """Handle button press events."""
        button_id = event.button.id
        
        if button_id == "close-dialog-btn" or button_id == "dialog-close-btn":
            self.close_dialog()
    
    def close_dialog(self) -> None:
        """Close the dialog."""
        self.remove()

class ConfirmDialog(Dialog):
    """
    A confirmation dialog with Yes/No buttons.
    """
    
    def __init__(self, title: str, message: str, on_confirm: Callable[[bool], None], *args, **kwargs):
        """
        Initialize a confirmation dialog.
        
        Args:
            title: The title of the dialog.
            message: The message to display.
            on_confirm: Callback function to call when the dialog is confirmed or canceled.
        """
        super().__init__(title, *args, **kwargs)
        self.message = message
        self.on_confirm = on_confirm
    
    def compose_content(self) -> ComposeResult:
        """Compose the dialog content."""
        yield Static(self.message, classes="dialog-message")
    
    def compose_footer(self) -> ComposeResult:
        """Compose the dialog footer."""
        yield Button("No", id="dialog-no-btn", classes="btn")
        yield Button("Yes", id="dialog-yes-btn", classes="btn btn-primary")
    
    def on_button_pressed(self, event) -> None:
        """Handle button press events."""
        button_id = event.button.id
        
        if button_id == "close-dialog-btn" or button_id == "dialog-no-btn":
            self.on_confirm(False)
            self.close_dialog()
        elif button_id == "dialog-yes-btn":
            self.on_confirm(True)
            self.close_dialog()

class AlertDialog(Dialog):
    """
    An alert dialog with an OK button.
    """
    
    def __init__(self, title: str, message: str, on_close: Optional[Callable[[], None]] = None, *args, **kwargs):
        """
        Initialize an alert dialog.
        
        Args:
            title: The title of the dialog.
            message: The message to display.
            on_close: Optional callback function to call when the dialog is closed.
        """
        super().__init__(title, *args, **kwargs)
        self.message = message
        self.on_close = on_close
    
    def compose_content(self) -> ComposeResult:
        """Compose the dialog content."""
        yield Static(self.message, classes="dialog-message")
    
    def compose_footer(self) -> ComposeResult:
        """Compose the dialog footer."""
        yield Button("OK", id="dialog-ok-btn", classes="btn btn-primary")
    
    def on_button_pressed(self, event) -> None:
        """Handle button press events."""
        button_id = event.button.id
        
        if button_id == "close-dialog-btn" or button_id == "dialog-ok-btn":
            if self.on_close:
                self.on_close()
            self.close_dialog()

class InputDialog(Dialog):
    """
    An input dialog with a text field and OK/Cancel buttons.
    """
    
    def __init__(
        self, 
        title: str, 
        message: str, 
        default_value: str = "", 
        on_submit: Optional[Callable[[str], None]] = None, 
        *args, 
        **kwargs
    ):
        """
        Initialize an input dialog.
        
        Args:
            title: The title of the dialog.
            message: The message to display.
            default_value: The default value for the input field.
            on_submit: Callback function to call when the dialog is submitted.
        """
        super().__init__(title, *args, **kwargs)
        self.message = message
        self.default_value = default_value
        self.on_submit = on_submit
    
    def compose_content(self) -> ComposeResult:
        """Compose the dialog content."""
        yield Static(self.message, classes="dialog-message")
        yield Label("Input:", classes="input-label")
        yield Static(self.default_value, id="dialog-input", classes="input-field")
    
    def compose_footer(self) -> ComposeResult:
        """Compose the dialog footer."""
        yield Button("Cancel", id="dialog-cancel-btn", classes="btn")
        yield Button("OK", id="dialog-ok-btn", classes="btn btn-primary")
    
    def on_button_pressed(self, event) -> None:
        """Handle button press events."""
        button_id = event.button.id
        
        if button_id == "close-dialog-btn" or button_id == "dialog-cancel-btn":
            self.close_dialog()
        elif button_id == "dialog-ok-btn":
            if self.on_submit:
                input_value = self.query_one("#dialog-input").text
                self.on_submit(input_value)
            self.close_dialog()

class AboutDialog(Dialog):
    """
    An about dialog with information about the application.
    """
    
    def __init__(self, title: str, about_text: str, *args, **kwargs):
        """
        Initialize an about dialog.
        
        Args:
            title: The title of the dialog.
            about_text: The text to display in the about dialog.
        """
        super().__init__(title, *args, **kwargs)
        self.about_text = about_text
    
    def compose_content(self) -> ComposeResult:
        """Compose the dialog content."""
        yield Static(self.about_text, classes="about-text")
    
    def compose_footer(self) -> ComposeResult:
        """Compose the dialog footer."""
        yield Button("Close", id="dialog-close-btn", classes="btn btn-primary")
