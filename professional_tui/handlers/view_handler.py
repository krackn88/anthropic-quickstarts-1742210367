"""
View handler for the Professional TUI.
Provides view operations such as zooming, toggling dark mode, and managing the layout.
"""

from typing import Dict, Any, List, Optional, Tuple

class ViewHandler:
    """
    Handles view operations for the Professional TUI.
    """
    
    def __init__(self):
        """Initialize the view handler."""
        self.zoom_level: float = 1.0
        self.dark_mode: bool = True
        self.sidebar_visible: bool = True
        self.status_bar_visible: bool = True
        self.layout_config: Dict[str, Any] = {
            "sidebar_width": 30,
            "main_panel_min_width": 40,
            "status_bar_height": 1,
            "menu_bar_height": 1,
        }
        self.visible_panels: List[str] = ["sidebar", "main_panel", "status_bar"]
    
    def zoom_in(self) -> float:
        """
        Increase the zoom level.
        
        Returns:
            The new zoom level.
        """
        self.zoom_level = min(2.0, self.zoom_level + 0.1)
        return self.zoom_level
    
    def zoom_out(self) -> float:
        """
        Decrease the zoom level.
        
        Returns:
            The new zoom level.
        """
        self.zoom_level = max(0.5, self.zoom_level - 0.1)
        return self.zoom_level
    
    def reset_zoom(self) -> float:
        """
        Reset the zoom level to the default.
        
        Returns:
            The new zoom level.
        """
        self.zoom_level = 1.0
        return self.zoom_level
    
    def toggle_dark_mode(self) -> bool:
        """
        Toggle dark mode.
        
        Returns:
            The new dark mode state.
        """
        self.dark_mode = not self.dark_mode
        return self.dark_mode
    
    def toggle_sidebar(self) -> bool:
        """
        Toggle the sidebar visibility.
        
        Returns:
            The new sidebar visibility state.
        """
        self.sidebar_visible = not self.sidebar_visible
        
        # Update visible panels
        if self.sidebar_visible and "sidebar" not in self.visible_panels:
            self.visible_panels.append("sidebar")
        elif not self.sidebar_visible and "sidebar" in self.visible_panels:
            self.visible_panels.remove("sidebar")
        
        return self.sidebar_visible
    
    def toggle_status_bar(self) -> bool:
        """
        Toggle the status bar visibility.
        
        Returns:
            The new status bar visibility state.
        """
        self.status_bar_visible = not self.status_bar_visible
        
        # Update visible panels
        if self.status_bar_visible and "status_bar" not in self.visible_panels:
            self.visible_panels.append("status_bar")
        elif not self.status_bar_visible and "status_bar" in self.visible_panels:
            self.visible_panels.remove("status_bar")
        
        return self.status_bar_visible
    
    def set_layout_config(self, config: Dict[str, Any]) -> None:
        """
        Set the layout configuration.
        
        Args:
            config: The layout configuration to set.
        """
        self.layout_config.update(config)
    
    def get_layout_config(self) -> Dict[str, Any]:
        """
        Get the current layout configuration.
        
        Returns:
            The current layout configuration.
        """
        return self.layout_config
    
    def get_visible_panels(self) -> List[str]:
        """
        Get the list of visible panels.
        
        Returns:
            The list of visible panels.
        """
        return self.visible_panels
    
    def show_panel(self, panel_name: str) -> None:
        """
        Show a panel.
        
        Args:
            panel_name: The name of the panel to show.
        """
        if panel_name not in self.visible_panels:
            self.visible_panels.append(panel_name)
    
    def hide_panel(self, panel_name: str) -> None:
        """
        Hide a panel.
        
        Args:
            panel_name: The name of the panel to hide.
        """
        if panel_name in self.visible_panels:
            self.visible_panels.remove(panel_name)
    
    def is_panel_visible(self, panel_name: str) -> bool:
        """
        Check if a panel is visible.
        
        Args:
            panel_name: The name of the panel to check.
            
        Returns:
            True if the panel is visible, False otherwise.
        """
        return panel_name in self.visible_panels
    
    def get_zoom_level(self) -> float:
        """
        Get the current zoom level.
        
        Returns:
            The current zoom level.
        """
        return self.zoom_level
    
    def is_dark_mode(self) -> bool:
        """
        Check if dark mode is enabled.
        
        Returns:
            True if dark mode is enabled, False otherwise.
        """
        return self.dark_mode
    
    def calculate_layout(self, screen_width: int, screen_height: int) -> Dict[str, Dict[str, int]]:
        """
        Calculate the layout based on the screen dimensions and current configuration.
        
        Args:
            screen_width: The width of the screen.
            screen_height: The height of the screen.
            
        Returns:
            A dictionary containing the layout dimensions for each panel.
        """
        layout = {}
        
        # Calculate heights
        menu_bar_height = self.layout_config["menu_bar_height"]
        status_bar_height = self.layout_config["status_bar_height"] if self.status_bar_visible else 0
        content_height = screen_height - menu_bar_height - status_bar_height
        
        # Calculate widths
        sidebar_width = self.layout_config["sidebar_width"] if self.sidebar_visible else 0
        main_panel_width = screen_width - sidebar_width
        
        # Menu bar
        layout["menu_bar"] = {
            "x": 0,
            "y": 0,
            "width": screen_width,
            "height": menu_bar_height
        }
        
        # Sidebar
        if self.sidebar_visible:
            layout["sidebar"] = {
                "x": 0,
                "y": menu_bar_height,
                "width": sidebar_width,
                "height": content_height
            }
        
        # Main panel
        layout["main_panel"] = {
            "x": sidebar_width,
            "y": menu_bar_height,
            "width": main_panel_width,
            "height": content_height
        }
        
        # Status bar
        if self.status_bar_visible:
            layout["status_bar"] = {
                "x": 0,
                "y": screen_height - status_bar_height,
                "width": screen_width,
                "height": status_bar_height
            }
        
        return layout
