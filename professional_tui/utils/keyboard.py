"""
Keyboard utilities for the Professional TUI.
Provides keyboard shortcut handling and key binding management.
"""

from typing import Dict, Any, List, Callable, Optional, Tuple, Set

class KeyBinding:
    """
    Represents a key binding for a keyboard shortcut.
    """
    
    def __init__(self, key: str, action: str, description: str, handler: Optional[Callable] = None):
        """
        Initialize a key binding.
        
        Args:
            key: The key combination (e.g., "ctrl+s").
            action: The action to perform.
            description: A description of the action.
            handler: An optional handler function to call when the key is pressed.
        """
        self.key = key
        self.action = action
        self.description = description
        self.handler = handler
    
    def __str__(self) -> str:
        """Return a string representation of the key binding."""
        return f"{self.key}: {self.description}"
    
    def __repr__(self) -> str:
        """Return a string representation of the key binding."""
        return f"KeyBinding(key='{self.key}', action='{self.action}', description='{self.description}')"

class KeyboardManager:
    """
    Manages keyboard shortcuts and key bindings.
    """
    
    def __init__(self):
        """Initialize the keyboard manager."""
        self.bindings: Dict[str, KeyBinding] = {}
        self.action_map: Dict[str, str] = {}
        
        # Initialize default key bindings
        self._init_default_bindings()
    
    def _init_default_bindings(self) -> None:
        """Initialize default key bindings."""
        self.add_binding("q", "quit", "Quit the application")
        self.add_binding("f1", "toggle_help", "Show help")
        self.add_binding("f2", "toggle_sidebar", "Toggle sidebar")
        self.add_binding("f3", "command_palette", "Open command palette")
        self.add_binding("ctrl+s", "save", "Save file")
        self.add_binding("ctrl+shift+s", "save_as", "Save file as")
        self.add_binding("ctrl+o", "open", "Open file")
        self.add_binding("ctrl+n", "new", "New file")
        self.add_binding("ctrl+x", "cut", "Cut")
        self.add_binding("ctrl+c", "copy", "Copy")
        self.add_binding("ctrl+v", "paste", "Paste")
        self.add_binding("ctrl+f", "find", "Find")
        self.add_binding("ctrl+h", "replace", "Replace")
        self.add_binding("ctrl++", "zoom_in", "Zoom in")
        self.add_binding("ctrl+-", "zoom_out", "Zoom out")
        self.add_binding("ctrl+0", "reset_zoom", "Reset zoom")
    
    def add_binding(self, key: str, action: str, description: str, handler: Optional[Callable] = None) -> None:
        """
        Add a key binding.
        
        Args:
            key: The key combination (e.g., "ctrl+s").
            action: The action to perform.
            description: A description of the action.
            handler: An optional handler function to call when the key is pressed.
        """
        # Normalize the key
        key = self._normalize_key(key)
        
        # Add the binding
        self.bindings[key] = KeyBinding(key, action, description, handler)
        self.action_map[action] = key
    
    def remove_binding(self, key: str) -> None:
        """
        Remove a key binding.
        
        Args:
            key: The key combination to remove.
        """
        # Normalize the key
        key = self._normalize_key(key)
        
        # Remove the binding
        if key in self.bindings:
            action = self.bindings[key].action
            del self.bindings[key]
            
            # Remove from action map
            if action in self.action_map and self.action_map[action] == key:
                del self.action_map[action]
    
    def get_binding(self, key: str) -> Optional[KeyBinding]:
        """
        Get a key binding.
        
        Args:
            key: The key combination to get.
            
        Returns:
            The key binding, or None if not found.
        """
        # Normalize the key
        key = self._normalize_key(key)
        
        # Get the binding
        return self.bindings.get(key)
    
    def get_binding_for_action(self, action: str) -> Optional[KeyBinding]:
        """
        Get a key binding for an action.
        
        Args:
            action: The action to get the binding for.
            
        Returns:
            The key binding, or None if not found.
        """
        # Get the key for the action
        key = self.action_map.get(action)
        
        # Get the binding
        if key:
            return self.bindings.get(key)
        
        return None
    
    def handle_key(self, key: str) -> Optional[str]:
        """
        Handle a key press.
        
        Args:
            key: The key combination that was pressed.
            
        Returns:
            The action to perform, or None if no binding was found.
        """
        # Normalize the key
        key = self._normalize_key(key)
        
        # Get the binding
        binding = self.bindings.get(key)
        
        # Call the handler if available
        if binding and binding.handler:
            binding.handler()
        
        # Return the action
        return binding.action if binding else None
    
    def get_all_bindings(self) -> List[KeyBinding]:
        """
        Get all key bindings.
        
        Returns:
            A list of all key bindings.
        """
        return list(self.bindings.values())
    
    def get_bindings_by_category(self) -> Dict[str, List[KeyBinding]]:
        """
        Get key bindings grouped by category.
        
        Returns:
            A dictionary of key bindings grouped by category.
        """
        categories = {
            "File": ["new", "open", "save", "save_as", "quit"],
            "Edit": ["cut", "copy", "paste", "find", "replace"],
            "View": ["toggle_sidebar", "toggle_help", "zoom_in", "zoom_out", "reset_zoom"],
            "Tools": ["command_palette"],
        }
        
        result = {}
        
        for category, actions in categories.items():
            result[category] = []
            
            for action in actions:
                binding = self.get_binding_for_action(action)
                if binding:
                    result[category].append(binding)
        
        return result
    
    def _normalize_key(self, key: str) -> str:
        """
        Normalize a key combination.
        
        Args:
            key: The key combination to normalize.
            
        Returns:
            The normalized key combination.
        """
        # Convert to lowercase
        key = key.lower()
        
        # Split into modifiers and key
        parts = key.split("+")
        
        # Sort modifiers
        if len(parts) > 1:
            modifiers = sorted(parts[:-1])
            key_part = parts[-1]
            
            # Reconstruct the key
            key = "+".join(modifiers + [key_part])
        
        return key
    
    def get_key_display(self, key: str) -> str:
        """
        Get a display-friendly version of a key combination.
        
        Args:
            key: The key combination to display.
            
        Returns:
            A display-friendly version of the key combination.
        """
        # Normalize the key
        key = self._normalize_key(key)
        
        # Split into modifiers and key
        parts = key.split("+")
        
        # Capitalize modifiers and key
        parts = [part.upper() for part in parts]
        
        # Replace modifier names with symbols
        modifier_map = {
            "CTRL": "Ctrl",
            "ALT": "Alt",
            "SHIFT": "Shift",
            "META": "Meta",
            "CMD": "Cmd",
            "SUPER": "Super",
        }
        
        for i, part in enumerate(parts):
            if part in modifier_map:
                parts[i] = modifier_map[part]
        
        # Join with + symbol
        return "+".join(parts)
