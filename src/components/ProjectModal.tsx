import { useEffect } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { ProjectItem } from '../types/portfolio';
import { PROJECT_IMAGES } from '../data/defaultPortfolio';
import { ResilientImage } from './ResilientImage';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    if (!project) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [project, onClose]);

  if (!project) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#10131C] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project details"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#090B10]/85 text-zinc-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="aspect-video w-full overflow-hidden border-b border-white/10 bg-[#090B10]">
          <ResilientImage
            src={PROJECT_IMAGES[project.imageKey]}
            alt={project.title}
            fallbackTitle={project.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>{project.index}</span>
            <span aria-hidden="true">·</span>
            <span>{project.category}</span>
          </div>

          <h3
            id="project-modal-title"
            className="text-2xl font-semibold tracking-tight text-white"
          >
            {project.title}
          </h3>

          <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
            {project.details}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 pt-1">
            <span className="text-zinc-500">Technologies:</span>
            {project.stack.map((tech, idx) => (
              <span key={tech} className="inline-flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true">·</span>}
                <span className="text-zinc-200">{tech}</span>
              </span>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0"
            >
              <span>View GitHub Repository</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white whitespace-nowrap shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
