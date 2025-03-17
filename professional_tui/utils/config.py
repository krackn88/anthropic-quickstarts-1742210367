"""
Configuration utilities for the Professional TUI.
Provides configuration management and settings handling.
"""

import os
import json
from typing import Dict, Any, Optional, List, Set

class Config:
    """
    Manages configuration settings for the Professional TUI.
    """
    
    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize the configuration manager.
        
        Args:
            config_file: The path to the configuration file. If None, use the default.
        """
        self.config_file = config_file or self._get_default_config_file()
        self.config: Dict[str, Any] = {}
        
        # Load the configuration
        self.load()
    
    def _get_default_config_file(self) -> str:
        """
        Get the default configuration file path.
        
        Returns:
            The default configuration file path.
        """
        # Get the user's home directory
        home_dir = os.path.expanduser("~")
        
        # Create the config directory if it doesn't exist
        config_dir = os.path.join(home_dir, ".professional_tui")
        os.makedirs(config_dir, exist_ok=True)
        
        # Return the config file path
        return os.path.join(config_dir, "config.json")
    
    def load(self) -> None:
        """Load the configuration from the config file."""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, "r") as f:
                    self.config = json.load(f)
            else:
                # Create a default configuration
                self.config = self._get_default_config()
                self.save()
        except Exception as e:
            print(f"Error loading configuration: {e}")
            self.config = self._get_default_config()
    
    def save(self) -> None:
        """Save the configuration to the config file."""
        try:
            with open(self.config_file, "w") as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            print(f"Error saving configuration: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.
        
        Args:
            key: The key to get the value for.
            default: The default value to return if the key is not found.
            
        Returns:
            The configuration value, or the default if not found.
        """
        # Split the key into parts
        parts = key.split(".")
        
        # Navigate through the config
        value = self.config
        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any) -> None:
        """
        Set a configuration value.
        
        Args:
            key: The key to set the value for.
            value: The value to set.
        """
        # Split the key into parts
        parts = key.split(".")
        
        # Navigate through the config
        config = self.config
        for i, part in enumerate(parts[:-1]):
            if part not in config:
                config[part] = {}
            elif not isinstance(config[part], dict):
                config[part] = {}
            
            config = config[part]
        
        # Set the value
        config[parts[-1]] = value
        
        # Save the configuration
        self.save()
    
    def delete(self, key: str) -> None:
        """
        Delete a configuration value.
        
        Args:
            key: The key to delete the value for.
        """
        # Split the key into parts
        parts = key.split(".")
        
        # Navigate through the config
        config = self.config
        for i, part in enumerate(parts[:-1]):
            if part not in config or not isinstance(config[part], dict):
                return
            
            config = config[part]
        
        # Delete the value
        if parts[-1] in config:
            del config[parts[-1]]
            
            # Save the configuration
            self.save()
    
    def get_all(self) -> Dict[str, Any]:
        """
        Get all configuration values.
        
        Returns:
            All configuration values.
        """
        return self.config
    
    def reset(self) -> None:
        """Reset the configuration to the default values."""
        self.config = self._get_default_config()
        self.save()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """
        Get the default configuration.
        
        Returns:
            The default configuration.
        """
        return {
            "app": {
                "name": "Professional TUI",
                "version": "1.0.0",
                "theme": "dark",
                "zoom_level": 1.0,
            },
            "ui": {
                "sidebar_visible": True,
                "status_bar_visible": True,
                "sidebar_width": 30,
                "main_panel_min_width": 40,
                "status_bar_height": 1,
                "menu_bar_height": 1,
            },
            "editor": {
                "tab_size": 4,
                "use_spaces": True,
                "word_wrap": True,
                "show_line_numbers": True,
                "highlight_current_line": True,
                "auto_indent": True,
                "auto_save": False,
                "auto_save_interval": 60,
            },
            "file": {
                "recent_files": [],
                "max_recent_files": 10,
                "default_directory": os.path.expanduser("~"),
            },
            "search": {
                "case_sensitive": False,
                "whole_word": False,
                "use_regex": False,
            },
            "keyboard": {
                "bindings": {
                    "quit": "q",
                    "toggle_help": "f1",
                    "toggle_sidebar": "f2",
                    "command_palette": "f3",
                    "save": "ctrl+s",
                    "save_as": "ctrl+shift+s",
                    "open": "ctrl+o",
                    "new": "ctrl+n",
                    "cut": "ctrl+x",
                    "copy": "ctrl+c",
                    "paste": "ctrl+v",
                    "find": "ctrl+f",
                    "replace": "ctrl+h",
                    "zoom_in": "ctrl++",
                    "zoom_out": "ctrl+-",
                    "reset_zoom": "ctrl+0",
                }
            }
        }
