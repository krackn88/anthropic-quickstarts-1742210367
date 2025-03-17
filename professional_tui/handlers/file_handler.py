"""
File handler for the Professional TUI.
Provides file operations such as open, save, and export.
"""

import os
from typing import Optional, Callable, List, Dict, Any
from pathlib import Path

class FileHandler:
    """
    Handles file operations for the Professional TUI.
    """
    
    def __init__(self):
        """Initialize the file handler."""
        self.current_file: Optional[str] = None
        self.current_directory: str = os.getcwd()
        self.recent_files: List[str] = []
        self.max_recent_files: int = 10
    
    def open_file(self, filename: str) -> Optional[str]:
        """
        Open a file and return its contents.
        
        Args:
            filename: The name of the file to open.
            
        Returns:
            The contents of the file, or None if the file could not be opened.
        """
        try:
            filepath = self._get_filepath(filename)
            with open(filepath, 'r') as f:
                content = f.read()
            
            self.current_file = filepath
            self._add_recent_file(filepath)
            return content
        except Exception as e:
            print(f"Error opening file: {e}")
            return None
    
    def save_file(self, content: str) -> bool:
        """
        Save content to the current file.
        
        Args:
            content: The content to save.
            
        Returns:
            True if the file was saved successfully, False otherwise.
        """
        if not self.current_file:
            return False
        
        try:
            with open(self.current_file, 'w') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error saving file: {e}")
            return False
    
    def save_file_as(self, filename: str, content: str) -> bool:
        """
        Save content to a new file.
        
        Args:
            filename: The name of the file to save to.
            content: The content to save.
            
        Returns:
            True if the file was saved successfully, False otherwise.
        """
        try:
            filepath = self._get_filepath(filename)
            with open(filepath, 'w') as f:
                f.write(content)
            
            self.current_file = filepath
            self._add_recent_file(filepath)
            return True
        except Exception as e:
            print(f"Error saving file: {e}")
            return False
    
    def export_file(self, filename: str, content: str, format: str) -> bool:
        """
        Export content to a file in a specific format.
        
        Args:
            filename: The name of the file to export to.
            content: The content to export.
            format: The format to export to.
            
        Returns:
            True if the file was exported successfully, False otherwise.
        """
        try:
            # Add the format extension if not already present
            if not filename.endswith(f".{format}"):
                filename = f"{filename}.{format}"
            
            filepath = self._get_filepath(filename)
            
            # Handle different export formats
            if format == "txt":
                with open(filepath, 'w') as f:
                    f.write(content)
            elif format == "html":
                # Simple HTML export
                html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>{os.path.basename(filename)}</title>
</head>
<body>
    <pre>{content}</pre>
</body>
</html>
"""
                with open(filepath, 'w') as f:
                    f.write(html_content)
            elif format == "md":
                # Markdown export (just write the content as is)
                with open(filepath, 'w') as f:
                    f.write(content)
            else:
                # Unsupported format
                return False
            
            return True
        except Exception as e:
            print(f"Error exporting file: {e}")
            return False
    
    def list_files(self, directory: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List files in a directory.
        
        Args:
            directory: The directory to list files from. If None, use the current directory.
            
        Returns:
            A list of dictionaries containing file information.
        """
        if directory is None:
            directory = self.current_directory
        
        try:
            files = []
            for item in os.listdir(directory):
                item_path = os.path.join(directory, item)
                is_dir = os.path.isdir(item_path)
                
                files.append({
                    "name": item,
                    "path": item_path,
                    "is_dir": is_dir,
                    "size": os.path.getsize(item_path) if not is_dir else 0,
                    "modified": os.path.getmtime(item_path)
                })
            
            return files
        except Exception as e:
            print(f"Error listing files: {e}")
            return []
    
    def create_file(self, filename: str, content: str = "") -> bool:
        """
        Create a new file.
        
        Args:
            filename: The name of the file to create.
            content: The initial content of the file.
            
        Returns:
            True if the file was created successfully, False otherwise.
        """
        try:
            filepath = self._get_filepath(filename)
            
            # Create parent directories if they don't exist
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            with open(filepath, 'w') as f:
                f.write(content)
            
            self.current_file = filepath
            self._add_recent_file(filepath)
            return True
        except Exception as e:
            print(f"Error creating file: {e}")
            return False
    
    def delete_file(self, filename: str) -> bool:
        """
        Delete a file.
        
        Args:
            filename: The name of the file to delete.
            
        Returns:
            True if the file was deleted successfully, False otherwise.
        """
        try:
            filepath = self._get_filepath(filename)
            os.remove(filepath)
            
            if self.current_file == filepath:
                self.current_file = None
            
            # Remove from recent files
            if filepath in self.recent_files:
                self.recent_files.remove(filepath)
            
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def get_recent_files(self) -> List[str]:
        """
        Get the list of recent files.
        
        Returns:
            The list of recent files.
        """
        return self.recent_files
    
    def _add_recent_file(self, filepath: str) -> None:
        """
        Add a file to the recent files list.
        
        Args:
            filepath: The path of the file to add.
        """
        # Remove the file if it's already in the list
        if filepath in self.recent_files:
            self.recent_files.remove(filepath)
        
        # Add the file to the beginning of the list
        self.recent_files.insert(0, filepath)
        
        # Trim the list if it's too long
        if len(self.recent_files) > self.max_recent_files:
            self.recent_files = self.recent_files[:self.max_recent_files]
    
    def _get_filepath(self, filename: str) -> str:
        """
        Get the full path of a file.
        
        Args:
            filename: The name of the file.
            
        Returns:
            The full path of the file.
        """
        if os.path.isabs(filename):
            return filename
        else:
            return os.path.join(self.current_directory, filename)
