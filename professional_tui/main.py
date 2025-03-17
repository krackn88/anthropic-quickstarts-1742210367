#!/usr/bin/env python3
"""
Professional TUI Application
A feature-rich terminal user interface with professional styling and interactive components.
"""

import sys
import os
from typing import List, Dict, Any, Optional

# Add the parent directory to sys.path to allow importing from the project
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from professional_tui.ui.app import ProfessionalTUI

def main():
    """Run the Professional TUI application."""
    app = ProfessionalTUI()
    app.run()

if __name__ == "__main__":
    main()
