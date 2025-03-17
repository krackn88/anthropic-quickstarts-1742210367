"""
Color definitions for the Professional TUI.
Defines color schemes and theme colors for the application.
"""

from typing import Dict, Any

# Define the color palette
COLORS = {
    # Primary colors
    "primary": "#3498db",
    "primary-dark": "#2980b9",
    "primary-light": "#5dade2",
    
    # Secondary colors
    "secondary": "#2ecc71",
    "secondary-dark": "#27ae60",
    "secondary-light": "#58d68d",
    
    # Accent colors
    "accent": "#e74c3c",
    "accent-dark": "#c0392b",
    "accent-light": "#ec7063",
    
    # Neutral colors
    "background": "#1e1e2e",
    "surface": "#2a2a3c",
    "border": "#3c3c4c",
    "text": "#ecf0f1",
    "text-muted": "#95a5a6",
    
    # Status colors
    "success": "#2ecc71",
    "warning": "#f39c12",
    "error": "#e74c3c",
    "info": "#3498db",
}

# Define the theme colors
THEME_COLORS = {
    # App structure
    "app.background": COLORS["background"],
    "app.text": COLORS["text"],
    "app.accent": COLORS["primary"],
    
    # Header
    "header.background": COLORS["surface"],
    "header.text": COLORS["text"],
    "header.accent": COLORS["primary"],
    
    # Footer
    "footer.background": COLORS["surface"],
    "footer.text": COLORS["text"],
    "footer.key": COLORS["primary"],
    "footer.highlight": COLORS["primary-light"],
    
    # Menu
    "menu.background": COLORS["surface"],
    "menu.text": COLORS["text"],
    "menu.highlight": COLORS["primary"],
    "menu.border": COLORS["border"],
    
    # Sidebar
    "sidebar.background": COLORS["surface"],
    "sidebar.text": COLORS["text"],
    "sidebar.highlight": COLORS["primary"],
    "sidebar.border": COLORS["border"],
    
    # Main panel
    "main.background": COLORS["background"],
    "main.text": COLORS["text"],
    "main.highlight": COLORS["primary"],
    "main.border": COLORS["border"],
    
    # Status bar
    "status.background": COLORS["surface"],
    "status.text": COLORS["text"],
    "status.info": COLORS["info"],
    "status.success": COLORS["success"],
    "status.warning": COLORS["warning"],
    "status.error": COLORS["error"],
    
    # Buttons
    "button.background": COLORS["primary"],
    "button.text": COLORS["text"],
    "button.hover": COLORS["primary-dark"],
    "button.disabled": COLORS["text-muted"],
    
    # Inputs
    "input.background": COLORS["surface"],
    "input.text": COLORS["text"],
    "input.placeholder": COLORS["text-muted"],
    "input.border": COLORS["border"],
    "input.focus": COLORS["primary"],
    
    # Dialogs
    "dialog.background": COLORS["surface"],
    "dialog.text": COLORS["text"],
    "dialog.border": COLORS["border"],
    "dialog.title": COLORS["primary"],
    
    # Tables
    "table.header": COLORS["surface"],
    "table.row": COLORS["background"],
    "table.row.alt": COLORS["surface"],
    "table.border": COLORS["border"],
    
    # Tabs
    "tab.active": COLORS["primary"],
    "tab.inactive": COLORS["surface"],
    "tab.text": COLORS["text"],
    "tab.text.active": COLORS["text"],
    
    # Notifications
    "notification.info.background": COLORS["info"],
    "notification.success.background": COLORS["success"],
    "notification.warning.background": COLORS["warning"],
    "notification.error.background": COLORS["error"],
    "notification.text": COLORS["text"],
}

def get_color(name: str) -> str:
    """
    Get a color by name.
    
    Args:
        name: The name of the color to get.
        
    Returns:
        The color value.
    """
    return THEME_COLORS.get(name, COLORS.get(name, "#ffffff"))
