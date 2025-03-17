"""
Git utilities for the Professional TUI.
Provides git status and operations.
"""

import os
import subprocess
from typing import Dict, List, Optional, Tuple

class GitStatus:
    """Git status information."""
    def __init__(self):
        self.branch = ""
        self.modified: List[str] = []
        self.untracked: List[str] = []
        self.staged: List[str] = []
        self.ahead = 0
        self.behind = 0

class GitUtils:
    """Git utility functions."""
    
    @staticmethod
    def is_git_repo(path: str = ".") -> bool:
        """Check if path is in a git repository."""
        try:
            subprocess.run(
                ["git", "rev-parse", "--is-inside-work-tree"],
                cwd=path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            return True
        except subprocess.CalledProcessError:
            return False
    
    @staticmethod
    def get_branch_name(path: str = ".") -> str:
        """Get current branch name."""
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                cwd=path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                text=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError:
            return ""
    
    @staticmethod
    def get_status(path: str = ".") -> GitStatus:
        """Get git status information."""
        status = GitStatus()
        
        if not GitUtils.is_git_repo(path):
            return status
        
        # Get branch name
        status.branch = GitUtils.get_branch_name(path)
        
        try:
            # Get status
            result = subprocess.run(
                ["git", "status", "--porcelain", "-b"],
                cwd=path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                text=True
            )
            
            for line in result.stdout.splitlines():
                if line.startswith("##"):
                    # Parse ahead/behind
                    if "ahead" in line:
                        status.ahead = int(line.split("ahead ")[1].split("]")[0])
                    if "behind" in line:
                        status.behind = int(line.split("behind ")[1].split("]")[0])
                else:
                    # Parse file status
                    if len(line) >= 2:
                        code = line[:2]
                        file = line[3:]
                        
                        if code == "??":
                            status.untracked.append(file)
                        elif code[1] == "M":
                            status.modified.append(file)
                        elif code[0] != " ":
                            status.staged.append(file)
            
        except subprocess.CalledProcessError:
            pass
        
        return status
    
    @staticmethod
    def get_file_status(path: str, file: str) -> str:
        """Get status of a specific file."""
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain", file],
                cwd=path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                text=True
            )
            
            if result.stdout:
                code = result.stdout[:2]
                if code == "??":
                    return "untracked"
                elif code[1] == "M":
                    return "modified"
                elif code[0] != " ":
                    return "staged"
            
            return "unchanged"
            
        except subprocess.CalledProcessError:
            return "unchanged"
