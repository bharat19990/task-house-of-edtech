import { Github, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Built</span>
          <span>by</span>
          <span className="font-semibold text-foreground">Bharat Patidar</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/bharat19990"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/bharat-patidar-0b7053216/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Linkedin className="h-4 w-4" />
            <span className="hidden sm:inline">LinkedIn</span>
          </a>
        </div>

        {/* <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CollabEdit. All rights reserved.
        </p> */}
      </div>
    </footer>
  );
}
