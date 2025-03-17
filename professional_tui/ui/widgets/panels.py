"""
Panel widgets for the Professional TUI.
Provides the main panel and side panel for the application.
"""

import os
import psutil
from datetime import datetime
from textual.app import ComposeResult
from textual.containers import Container, Vertical, Horizontal
from textual.widgets import Static, Tree, Label, Button, TextArea
from textual.widgets._tree import TreeNode
from textual.reactive import reactive
from textual import events, on
from textual.message import Message
from textual.widgets import Tree

from professional_tui.ui.colors import THEME_COLORS
from professional_tui.handlers.file_handler import FileHandler
from professional_tui.utils.git import GitUtils

class SidePanel(Vertical):
    """
    A side panel for navigation and tools.
    """
    
    def __init__(self, *args, **kwargs):
        """Initialize the side panel."""
        super().__init__(*args, **kwargs)
        self.add_class("side-panel")
        self.file_handler = FileHandler()
        self.git_utils = GitUtils()
    
    def compose(self) -> ComposeResult:
        """Compose the side panel."""
        # Panel title
        yield Static("Navigation", classes="panel-title")
        
        # File tree
        yield Tree("Project", id="file-tree")
        
        # Quick actions
        yield Static("Quick Actions", classes="panel-title")
        with Container(classes="quick-actions"):
            yield Button("New File", id="new-file-btn", classes="action-btn")
            yield Button("Open File", id="open-file-btn", classes="action-btn")
            yield Button("Save", id="save-btn", classes="action-btn")
            yield Button("Run", id="run-btn", classes="action-btn")
        
        # Task list
        yield Static("Tasks", classes="panel-title")
        with Container(id="task-list", classes="task-list"):
            yield Static("No tasks yet", classes="empty-message")
    
    def on_mount(self) -> None:
        """Called when the widget is mounted."""
        # Initial refresh
        self.refresh_tree()
        # Set up periodic refresh
        self.set_interval(5.0, self.refresh_tree)
    
    def refresh_tree(self) -> None:
        """Refresh the file tree."""
        tree = self.query_one("#file-tree", Tree)
        self.refresh_file_tree(tree)
    
    def refresh_file_tree(self, tree: Tree) -> None:
        """Refresh the file tree with actual files."""
        tree.root.remove_children()
        files = self.file_handler.list_files()
        
        # Group files by type
        groups = {
            "Source": [f for f in files if f["name"].endswith((".py", ".js", ".ts", ".cpp", ".c", ".h"))],
            "Documents": [f for f in files if f["name"].endswith((".md", ".txt", ".doc", ".pdf"))],
            "Data": [f for f in files if f["name"].endswith((".json", ".yaml", ".csv", ".xml"))],
            "Other": []
        }
        
        # Add files to tree with group icons
        group_icons = {
            "Source": "📦",
            "Documents": "📚",
            "Data": "💾",
            "Other": "📁"
        }
        
        for group_name, group_files in groups.items():
            if group_files:
                group = tree.root.add(f"{group_icons[group_name]} {group_name}", expand=True)
                for file in sorted(group_files, key=lambda x: x["name"]):
                    # Add icon based on file type
                    ext = os.path.splitext(file["name"])[1].lower()
                    # Get file type icon
                    type_icon = {
                        '.py': '🐍',  # Python
                        '.js': '📜',  # JavaScript
                        '.ts': '📘',  # TypeScript
                        '.html': '🌐', # HTML
                        '.css': '🎨',  # CSS
                        '.json': '📋', # JSON
                        '.md': '📝',   # Markdown
                        '.yaml': '⚙️',  # YAML
                        '.cpp': '⚡',   # C++
                        '.c': '⚡',     # C
                        '.h': '📑',     # Header
                        '.txt': '📄',   # Text
                        '.pdf': '📕',   # PDF
                        '.csv': '📊',   # CSV
                        '.xml': '📰',   # XML
                    }.get(ext, '📄')    # Default
                    
                    # Get git status icon
                    git_status = self.git_utils.get_file_status(".", file["name"])
                    git_icon = {
                        "modified": "📝",
                        "staged": "✅",
                        "untracked": "❓",
                        "unchanged": ""
                    }.get(git_status, "")
                    
                    # Combine icons
                    icons = f"{type_icon} {git_icon}".strip()
                    group.add_leaf(f"{icons} {file['name']}")
    
    async def on_tree_node_highlighted(self, _: Message) -> None:
        """Handle tree node selection."""
        tree = self.query_one("#file-tree", Tree)
        if tree.cursor_node:
            node = tree.cursor_node
            self.app.query_one("#status-file", Static).update(f"Selected: {node.label}")
            
            if not node.children:
                # Strip icon prefix from filename
                filename = str(node.label)
                if ' ' in filename:  # Icon and filename are separated by space
                    filename = filename.split(' ', 1)[1]
                await self.app.query_one("#main-panel", MainPanel).load_file(filename)

class MainPanel(Container):
    """
    The main content panel.
    """
    
    content_type = reactive("welcome")
    current_file = reactive(None)
    
    def __init__(self, *args, **kwargs):
        """Initialize the main panel."""
        super().__init__(*args, **kwargs)
        self.add_class("main-panel")
        self.file_handler = FileHandler()

    async def on_key(self, event: events.Key) -> None:
        """Handle key events."""
        if event.key == "f3":
            await self.show_command_palette()

    @on(Button.Pressed, "#new-file-btn")
    async def handle_new_file(self) -> None:
        """Handle new file button click."""
        self.show_screen("editor")
        self.query_one("#editor-title", Static).update("Untitled")
        self.query_one("#editor-content", TextArea).text = ""
        self.current_file = None

    @on(Button.Pressed, "#open-file-btn") 
    async def handle_open_file(self) -> None:
        """Handle open file button click."""
        self.show_screen("editor")
        self.query_one("#editor-title", Static).update("Open File")
        self.query_one("#editor-content", TextArea).text = "Select a file from the sidebar to open it."

    @on(Button.Pressed, "#save-btn")
    async def handle_save(self) -> None:
        """Handle save button click."""
        if self.content_type != "editor":
            return
            
        content = self.query_one("#editor-content", TextArea).text
        filename = self.current_file or "Untitled"
        
        if self.file_handler.save_file_as(filename, content):
            self.query_one("#editor-title", Static).update(f"Saved: {filename}")
            # Refresh file tree
            self.app.query_one("#file-tree", Tree).refresh()
        else:
            self.query_one("#editor-title", Static).update("Error saving file")

    @on(Button.Pressed, "#run-btn")
    async def handle_run(self) -> None:
        """Handle run button click."""
        if self.content_type != "editor":
            return
            
        content = self.query_one("#editor-content", TextArea).text
        if not self.current_file or not self.current_file.endswith(".py"):
            self.query_one("#editor-title", Static).update("Can only run Python files")
            return
            
        # Save file before running
        if not self.file_handler.save_file_as(self.current_file, content):
            self.query_one("#editor-title", Static).update("Error saving file")
            return
            
        try:
            # Run the Python file and capture output
            import subprocess
            result = subprocess.run(["python", self.current_file], 
                                 capture_output=True, 
                                 text=True)
            output = result.stdout if result.returncode == 0 else result.stderr
            
            self.query_one("#editor-title", Static).update("Program Output:")
            self.query_one("#editor-content", TextArea).text = output
        except Exception as e:
            self.query_one("#editor-title", Static).update("Error running program")
            self.query_one("#editor-content", TextArea).text = str(e)

    async def show_command_palette(self) -> None:
        """Show the command palette."""
        from professional_tui.ui.widgets.command_palette import CommandPalette
        await self.app.mount(CommandPalette())

    def compose(self) -> ComposeResult:
        """Compose the main panel."""
        # Welcome screen (initial content)
        with Container(id="welcome-screen", classes="content-screen"):
            yield Static("# Welcome to Professional TUI", classes="welcome-title")
            yield Static("""
            A feature-rich terminal user interface with professional styling and interactive components.
            
            ## Getting Started
            
            - Use the menu bar at the top to access various features
            - The sidebar on the left provides navigation and quick actions
            - Press F1 for help or F3 to open the command palette
            
            ## Features
            
            - Professional dark theme
            - Full menu system
            - Interactive components
            - Keyboard navigation
            - And much more!
            """, classes="welcome-text")
        
        # Text editor (initially hidden)
        with Container(id="editor-screen", classes="content-screen hidden"):
            yield Static("", id="editor-title", classes="editor-title")
            yield TextArea("", id="editor-content", classes="editor-content", language="python")
        
        # Dashboard (initially hidden)
        with Container(id="dashboard-screen", classes="content-screen hidden"):
            yield Static("Dashboard", classes="panel-title")
            
            # Dashboard widgets
            with Horizontal(classes="dashboard-row"):
                with Container(classes="dashboard-widget"):
                    yield Static("Statistics", classes="widget-title")
                    yield Static(id="stats-content", classes="widget-content")
                
                with Container(classes="dashboard-widget"):
                    yield Static("Recent Files", classes="widget-title")
                    yield Static(id="recent-files", classes="widget-content")
            
            with Horizontal(classes="dashboard-row"):
                with Container(classes="dashboard-widget"):
                    yield Static("Tasks", classes="widget-title")
                    yield Static(id="tasks-content", classes="widget-content")
                
                with Container(classes="dashboard-widget"):
                    yield Static("System Info", classes="widget-title")
                    yield Static(id="system-info", classes="widget-content")
    
    def on_mount(self) -> None:
        """Called when the widget is mounted."""
        # Show the welcome screen initially
        self.show_screen("welcome")
    
    def show_screen(self, screen_type: str) -> None:
        """
        Show a specific content screen.
        
        Args:
            screen_type: The type of screen to show (welcome, editor, dashboard).
        """
        self.content_type = screen_type
        
        # Hide all screens
        for screen in self.query(".content-screen"):
            screen.add_class("hidden")
        
        # Show the requested screen
        screen = self.query_one(f"#{screen_type}-screen")
        screen.remove_class("hidden")
        
        # Update dashboard if showing it
        if screen_type == "dashboard":
            self.update_dashboard()
        
        # Update the status bar
        self.app.query_one("#status-mode", Static).update(f"Mode: {screen_type.capitalize()}")
    
    def update_dashboard(self) -> None:
        """Update dashboard widgets with real data."""
        # Update statistics with icons
        stats = self.query_one("#stats-content", Static)
        files = self.file_handler.list_files()
        
        # Count files by type
        python_files = len([f for f in files if f['name'].endswith('.py')])
        doc_files = len([f for f in files if f['name'].endswith(('.md', '.txt'))])
        data_files = len([f for f in files if f['name'].endswith(('.json', '.yaml', '.csv'))])
        code_files = len([f for f in files if f['name'].endswith(('.js', '.ts', '.cpp', '.c', '.h'))])
        
        stats.update(f"""
        📊 Total Files: {len(files)}
        🐍 Python Files: {python_files}
        📝 Documents: {doc_files}
        💾 Data Files: {data_files}
        ⚡ Code Files: {code_files}
        📈 File Distribution:
        {'🟦' * python_files}{'🟨' * doc_files}{'🟩' * data_files}{'🟪' * code_files}
        """)
        
        # Update recent files with icons
        recent = self.query_one("#recent-files", Static)
        recent_files = self.file_handler.get_recent_files()
        if recent_files:
            file_icons = []
            for f in recent_files[:5]:
                ext = os.path.splitext(f)[1].lower()
                icon = {
                    '.py': '🐍',  # Python
                    '.js': '📜',  # JavaScript
                    '.ts': '📘',  # TypeScript
                    '.html': '🌐', # HTML
                    '.css': '🎨',  # CSS
                    '.json': '📋', # JSON
                    '.md': '📝',   # Markdown
                    '.yaml': '⚙️',  # YAML
                    '.cpp': '⚡',   # C++
                    '.c': '⚡',     # C
                    '.h': '📑',     # Header
                    '.txt': '📄',   # Text
                    '.pdf': '📕',   # PDF
                    '.csv': '📊',   # CSV
                    '.xml': '📰',   # XML
                }.get(ext, '📄')    # Default
                file_icons.append(f"{icon} {os.path.basename(f)}")
            recent_text = "\n".join(file_icons)
            recent.update(recent_text)
        else:
            recent.update("📂 No recent files")
        
        # Update tasks with icons
        tasks = self.query_one("#tasks-content", Static)
        tasks.update("""
        ✅ Add file icons
        ✅ Add syntax highlighting
        ✅ Add git integration
        🔄 Support multiple tabs
        🔄 Add file type associations
        🔄 Add keyboard shortcuts help
        🔄 Add file creation dialog
        """)
        
        # Update system info with icons
        sysinfo = self.query_one("#system-info", Static)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        sysinfo.update(f"""
        💻 CPU Usage: {psutil.cpu_percent()}%
        🧠 Memory: {memory.percent}% used ({memory.used // (1024*1024)} MB)
        💾 Disk Space: {disk.percent}% used
        📁 Free Space: {disk.free // (1024*1024*1024)} GB
        ⏰ Time: {datetime.now().strftime('%H:%M:%S')}
        🌡️ CPU Cores: {psutil.cpu_count()}
        🔄 System Load: {os.getloadavg()[0]:.1f}, {os.getloadavg()[1]:.1f}, {os.getloadavg()[2]:.1f}
        """)
    
    async def load_file(self, filename: str) -> None:
        """
        Load a file into the editor.
        
        Args:
            filename: The name of the file to load.
        """
        content = self.file_handler.open_file(filename)
        if content is None:
            self.app.query_one("#status-file", Static).update(f"Error loading file: {filename}")
            return
            
        self.current_file = filename
        self.show_screen("editor")
        
        # Update editor with file content
        self.query_one("#editor-title", Static).update(f"Editing: {filename}")
        editor = self.query_one("#editor-content", TextArea)
        
        # Set language based on file extension
        ext = os.path.splitext(filename)[1].lower()
        language = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.md': 'markdown',
            '.yaml': 'yaml',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'cpp',
        }.get(ext, None)
        
        if language:
            editor.language = language
        editor.text = content
        
        # Update status bar
        self.app.query_one("#status-file", Static).update(f"File: {filename}")
