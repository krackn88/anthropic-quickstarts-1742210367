"""
Edit handler for the Professional TUI.
Provides text editing operations such as cut, copy, paste, find, and replace.
"""

import re
from typing import Optional, List, Tuple, Dict, Any

class EditHandler:
    """
    Handles text editing operations for the Professional TUI.
    """
    
    def __init__(self):
        """Initialize the edit handler."""
        self.clipboard: str = ""
        self.last_search: Optional[str] = None
        self.last_replace: Optional[str] = None
        self.case_sensitive: bool = False
        self.whole_word: bool = False
        self.use_regex: bool = False
    
    def cut(self, text: str, start: int, end: int) -> Tuple[str, str]:
        """
        Cut text from a string.
        
        Args:
            text: The text to cut from.
            start: The start index of the text to cut.
            end: The end index of the text to cut.
            
        Returns:
            A tuple containing the new text and the cut text.
        """
        if start < 0 or end > len(text) or start > end:
            return text, ""
        
        cut_text = text[start:end]
        new_text = text[:start] + text[end:]
        
        self.clipboard = cut_text
        return new_text, cut_text
    
    def copy(self, text: str, start: int, end: int) -> str:
        """
        Copy text from a string.
        
        Args:
            text: The text to copy from.
            start: The start index of the text to copy.
            end: The end index of the text to copy.
            
        Returns:
            The copied text.
        """
        if start < 0 or end > len(text) or start > end:
            return ""
        
        copy_text = text[start:end]
        self.clipboard = copy_text
        return copy_text
    
    def paste(self, text: str, position: int) -> str:
        """
        Paste text into a string.
        
        Args:
            text: The text to paste into.
            position: The position to paste at.
            
        Returns:
            The new text.
        """
        if position < 0 or position > len(text):
            return text
        
        new_text = text[:position] + self.clipboard + text[position:]
        return new_text
    
    def find(self, text: str, search_text: str, start_position: int = 0) -> List[Tuple[int, int]]:
        """
        Find all occurrences of a string in text.
        
        Args:
            text: The text to search in.
            search_text: The text to search for.
            start_position: The position to start searching from.
            
        Returns:
            A list of tuples containing the start and end indices of each match.
        """
        if not search_text:
            return []
        
        self.last_search = search_text
        
        # Prepare the search pattern
        pattern = search_text
        
        if not self.use_regex:
            # Escape special regex characters if not using regex
            pattern = re.escape(pattern)
            
            # Add word boundaries if searching for whole words
            if self.whole_word:
                pattern = r'\b' + pattern + r'\b'
        
        # Compile the regex pattern
        flags = 0 if self.case_sensitive else re.IGNORECASE
        regex = re.compile(pattern, flags)
        
        # Find all matches
        matches = []
        for match in regex.finditer(text[start_position:]):
            start = start_position + match.start()
            end = start_position + match.end()
            matches.append((start, end))
        
        return matches
    
    def replace(self, text: str, search_text: str, replace_text: str, start_position: int = 0, replace_all: bool = False) -> Tuple[str, int]:
        """
        Replace occurrences of a string in text.
        
        Args:
            text: The text to perform replacements in.
            search_text: The text to search for.
            replace_text: The text to replace with.
            start_position: The position to start searching from.
            replace_all: Whether to replace all occurrences or just the first one.
            
        Returns:
            A tuple containing the new text and the number of replacements made.
        """
        if not search_text:
            return text, 0
        
        self.last_search = search_text
        self.last_replace = replace_text
        
        # Prepare the search pattern
        pattern = search_text
        
        if not self.use_regex:
            # Escape special regex characters if not using regex
            pattern = re.escape(pattern)
            
            # Add word boundaries if searching for whole words
            if self.whole_word:
                pattern = r'\b' + pattern + r'\b'
        
        # Compile the regex pattern
        flags = 0 if self.case_sensitive else re.IGNORECASE
        regex = re.compile(pattern, flags)
        
        # Perform the replacement
        if replace_all:
            # Replace all occurrences
            new_text, count = re.subn(regex, replace_text, text[start_position:])
            new_text = text[:start_position] + new_text
        else:
            # Replace only the first occurrence after start_position
            match = regex.search(text[start_position:])
            if match:
                start = start_position + match.start()
                end = start_position + match.end()
                new_text = text[:start] + replace_text + text[end:]
                count = 1
            else:
                new_text = text
                count = 0
        
        return new_text, count
    
    def get_clipboard(self) -> str:
        """
        Get the current clipboard content.
        
        Returns:
            The clipboard content.
        """
        return self.clipboard
    
    def set_clipboard(self, text: str) -> None:
        """
        Set the clipboard content.
        
        Args:
            text: The text to set as the clipboard content.
        """
        self.clipboard = text
    
    def set_search_options(self, case_sensitive: bool = False, whole_word: bool = False, use_regex: bool = False) -> None:
        """
        Set search options.
        
        Args:
            case_sensitive: Whether to perform case-sensitive searches.
            whole_word: Whether to match whole words only.
            use_regex: Whether to use regular expressions.
        """
        self.case_sensitive = case_sensitive
        self.whole_word = whole_word
        self.use_regex = use_regex
    
    def get_search_options(self) -> Dict[str, bool]:
        """
        Get the current search options.
        
        Returns:
            A dictionary containing the current search options.
        """
        return {
            "case_sensitive": self.case_sensitive,
            "whole_word": self.whole_word,
            "use_regex": self.use_regex
        }
